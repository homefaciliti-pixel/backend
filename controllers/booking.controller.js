const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getPhoneVariants, parseOrderNumbers, parseTimeRange, timesOverlap, normalizeDate, normalizeTimeSlot } = require('../utils/helpers');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { STATIC_BOOKING_SLOTS } = require('../config/constants');
const { resolveServiceDetails } = require('../services/category.service');
const { localizeService } = require('../helpers/contentI18n');
const { debugLogs } = require('../services/sms.service');
const { translate } = require('../helpers/translate');

async function getBookingSlots() {
  if (getDbMode() === 'mysql' && getMysqlReady()) {
    try {
      const [rows] = await getMysqlPool().query('SELECT * FROM slots ORDER BY id ASC');
      if (rows && rows.length > 0) {
        return rows.map((r, index) => {
          const parsed = parseTimeRange(r.slot_time);
          const startHour = parsed ? parsed.start : (9 + index);
          return {
            id: `slot_${r.id}`,
            time: r.slot_time,
            start: startHour
          };
        });
      }
    } catch (err) {
      console.warn('Could not load dynamic slots from database, using static fallback:', err.message);
    }
  }
  return STATIC_BOOKING_SLOTS;
}

async function getAvailableSlotsForDate(dateStr, excludeOrderId = null, productId = null, pincode = null) {
  const MAX_ORDERS_PER_SLOT = 50;
  const bookingSlots = await getBookingSlots();
  const slots = bookingSlots.map(s => ({ ...s, available: true }));
  if (!dateStr) return slots;
  try {
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = normalizeDate(dateStr.split('T')[0]);
    const matchingOrders = allOrders.filter(o => {
      if (!o.date) return false;
      if (excludeOrderId && Number(o.id) === Number(excludeOrderId)) return false;
      if (o.status && o.status.toLowerCase() === 'cancelled') return false;
      if (o.bookingStatus && o.bookingStatus.toLowerCase() === 'draft') return false;
      const orderDate = normalizeDate(o.date.split('T')[0]);
      return orderDate === targetDate;
    });
    const bookedRanges = matchingOrders.map(o => parseTimeRange(o.timeSlot)).filter(r => r !== null);
    for (const slot of slots) {
      const slotRange = parseTimeRange(slot.time);
      if (!slotRange) continue;
      if (bookedRanges.some(b => timesOverlap(slotRange, b))) {
        slot.available = false;
        continue;
      }
      if (productId && pincode) {
        const capacityCount = matchingOrders.filter(o => {
          const matchProduct = (o.productId && o.productId.toLowerCase() === productId.toLowerCase()) ||
                               (o.serviceName && o.serviceName.toLowerCase() === productId.toLowerCase());
          if (!matchProduct) return false;
          const orderSlotRange = parseTimeRange(o.timeSlot);
          if (!orderSlotRange) return false;
          if (!timesOverlap(slotRange, orderSlotRange)) return false;
          const orderPincode = o.address ? String(o.address.pincode || '').trim() : '';
          return orderPincode === String(pincode).trim();
        }).length;
        if (capacityCount >= MAX_ORDERS_PER_SLOT) {
          slot.available = false;
          slot.fullReason = `Slot full for this area (${capacityCount}/${MAX_ORDERS_PER_SLOT})`;
        }
      }
    }
  } catch (err) {
    console.error('[getAvailableSlotsForDate] DB check failed, returning all slots as available:', err.message);
  }
  return slots;
}


// Helper to resolve address for a user phone number
const resolveAddressForPhone = async (phone) => {
  if (phone && phone !== "9876543210") {
    try {
      const addresses = await DbLayer.getAddressesByUserPhone(phone);
      if (addresses && addresses.length > 0) {
        return addresses[addresses.length - 1];
      }
    } catch (err) {
      console.error("Resolve address for phone failed:", err);
    }
  }

  // Fallback to user profile location/locality fields if they exist
  try {
    const user = await DbLayer.getUserByPhone(phone);
    if (user && (user.location || user.locality)) {
      console.log(`[AddressResolution] Falling back to user profile location fields for user ${phone}`);
      return {
        type: "Home",
        houseNo: "",
        society: "",
        floor: "",
        landmark: "",
        city: user.location || "Mumbai, Maharashtra",
        locality: user.locality || "Andheri West",
        pincode: "",
        latitude: 26.9124,
        longitude: 75.7873,
        name: user.name || "",
        alternateNumber: "",
        countryCode: user.countryCode || "+91"
      };
    }
  } catch (userErr) {
    console.error("Resolve address from user profile failed:", userErr);
  }

  return null;
};

const handlePostBooking = async (req, res) => {
  let productId = req.body.productId || req.query.productId || req.body.product_id || req.query.product_id || req.body.product || req.query.product || req.body.serviceName || req.query.serviceName;
  let date = req.body.date || req.query.date || req.body.dates || req.query.dates || req.headers['x-date'];
  let timeSlot = req.body.timeSlot || req.query.timeSlot || req.body.slot || req.query.slot || req.body.slots || req.query.slots || req.body.solt || req.query.solt || req.body.solts || req.query.solts ||
                 req.headers['x-timeslot'] || req.headers['x-slot'] || req.headers['x-slots'] || req.headers['x-solt'] || req.headers['x-solts'];

  // Support nested structures: product, booking, order
  for (const objKey of ['product', 'booking', 'order']) {
    if (req.body[objKey]) {
      productId = productId || req.body[objKey].productId || req.body[objKey].product_id || req.body[objKey].product || req.body[objKey].serviceName;
      date = date || req.body[objKey].date || req.body[objKey].dates;
      timeSlot = timeSlot || req.body[objKey].timeSlot || req.body[objKey].slot || req.body[objKey].slots || req.body[objKey].solt || req.body[objKey].solts;
    }
  }

  if (productId && typeof productId === 'object') {
    productId = productId.productId || productId.serviceName || productId.product || productId.product_id;
  }

  // Normalize inputs
  date = normalizeDate(date);
  timeSlot = normalizeTimeSlot(timeSlot);

  const logBookingResult = (statusCode, success, errMessage = null, userPhone = null) => {
    debugLogs.push({
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      productId,
      rawProductId: req.body.productId || req.body.serviceName || req.body.product || (req.body.booking && req.body.booking.productId),
      date,
      timeSlot,
      headers: {
        authorization: req.headers['authorization'] ? "Present" : "Missing",
      },
      statusCode,
      success,
      userPhone,
      error: errMessage
    });
    if (debugLogs.length > 50) debugLogs.shift();
  };

  // Support multiple items list
  const rawItems = req.body.items || req.query.items || (req.body.booking && req.body.booking.items);
  let itemsList = [];
  if (Array.isArray(rawItems)) {
    itemsList = rawItems;
  } else if (rawItems && typeof rawItems === 'string') {
    try {
      itemsList = JSON.parse(rawItems);
    } catch (e) {
      console.warn("Failed to parse items query/body string:", e.message);
    }
  }

  // Fallback to legacy single product booking if no items list was sent
  if (itemsList.length === 0 && productId) {
    itemsList.push({ productId: productId, quantity: 1 });
  }

  if (itemsList.length === 0 || !date || !timeSlot) {
    logBookingResult(400, false, "items list (or productId), date, and timeSlot are required");
    return res.status(400).json({ error: "items list (or productId), date, and timeSlot are required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      logBookingResult(401, false, `Unauthorized: ${req.authError || "Token verification failed"}`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Resolve details for all selected services and compute total price
    const resolvedItems = [];
    let totalPrice = 0;
    for (const item of itemsList) {
      const itemProdId = item.productId || item.product_id || item.id;
      const qty = parseInt(item.quantity || item.qty || 1) || 1;
      if (!itemProdId) continue;
      
      const resolved = await resolveServiceDetails(itemProdId);
      if (resolved) {
        resolvedItems.push({
          productId: resolved.productId,
          serviceName: resolved.serviceName,
          price: Number(resolved.price),
          quantity: qty,
          description: resolved.description || "",
          image: resolved.image || "",
          category: resolved.category || ""
        });
        totalPrice += Number(resolved.price) * qty;
      }
    }

    if (resolvedItems.length === 0) {
      logBookingResult(400, false, "No valid services could be resolved from request items", user.phone);
      return res.status(400).json({ error: "No valid services could be resolved from request items." });
    }

    // Validate slot availability (no overlap with existing bookings on the same date for any of the products)
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = normalizeDate(date.split('T')[0]);
    const matchingOrders = allOrders.filter(order => {
      if (!order.date) return false;
      if (order.status && order.status.toLowerCase() === "cancelled") return false;
      if (order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") return false;
      const orderDate = normalizeDate(order.date.split('T')[0]);
      if (orderDate !== targetDate) return false;

      // Extract all product IDs related to this saved order
      const orderProductIds = [];
      if (order.items && Array.isArray(order.items)) {
        orderProductIds.push(...order.items.map(it => String(it.productId).toLowerCase()));
      }
      if (order.productId) {
        orderProductIds.push(String(order.productId).toLowerCase());
      }
      if (order.serviceName) {
        orderProductIds.push(String(order.serviceName).toLowerCase());
      }

      // Check if any of our requested services overlap with this order's products
      return resolvedItems.some(it => {
        const idLower = String(it.productId).toLowerCase();
        const nameLower = String(it.serviceName).toLowerCase();
        return orderProductIds.includes(idLower) || orderProductIds.includes(nameLower);
      });
    });

    const reqRange = parseTimeRange(timeSlot);
    if (reqRange) {
      const bookedRanges = matchingOrders
        .map(order => parseTimeRange(order.timeSlot))
        .filter(range => range !== null);

      const overlappingBookingsCount = bookedRanges.filter(bookedRange => timesOverlap(reqRange, bookedRange)).length;
      if (overlappingBookingsCount >= 5) {
        logBookingResult(400, false, "This time slot is already booked. Please choose another slot.", user.phone);
        return res.status(400).json({ error: "This time slot is already booked. Please choose another slot." });
      }
    }
    
    // ─── MAX 50 ORDERS PER SLOT PER PINCODE PER SERVICE ───────────────────────
    const MAX_ORDERS_PER_SLOT_PINCODE = 50;

    // Get user's pincode from their saved address
    const resolvedAddrForLimit = await resolveAddressForPhone(user.phone);
    const userPincode = resolvedAddrForLimit
      ? String(resolvedAddrForLimit.pincode || "").trim()
      : "";

    if (userPincode) {
      // Count active orders for same service + date + slot + pincode
      const sameSlotOrders = allOrders.filter(order => {
        if (!order.date) return false;
        // Skip cancelled and draft orders
        if (order.status && order.status.toLowerCase() === "cancelled") return false;
        if (order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") return false;

        // Match date
        const orderDate = normalizeDate(order.date.split('T')[0]);
        if (orderDate !== targetDate) return false;

        // Extract all product IDs related to this saved order
        const orderProductIds = [];
        if (order.items && Array.isArray(order.items)) {
          orderProductIds.push(...order.items.map(it => String(it.productId).toLowerCase()));
        }
        if (order.productId) {
          orderProductIds.push(String(order.productId).toLowerCase());
        }
        if (order.serviceName) {
          orderProductIds.push(String(order.serviceName).toLowerCase());
        }

        // Check if any of our requested services overlap with this order's products
        const hasOverlapProduct = resolvedItems.some(it => {
          const idLower = String(it.productId).toLowerCase();
          const nameLower = String(it.serviceName).toLowerCase();
          return orderProductIds.includes(idLower) || orderProductIds.includes(nameLower);
        });
        if (!hasOverlapProduct) return false;

        // Match time slot (exact or overlapping)
        const orderSlotRange = parseTimeRange(order.timeSlot);
        const reqSlotRange = parseTimeRange(timeSlot);
        if (!orderSlotRange || !reqSlotRange) return false;
        if (!timesOverlap(reqSlotRange, orderSlotRange)) return false;

        // Match pincode from order's address
        const orderPincode = order.address
          ? String(order.address.pincode || "").trim()
          : "";
        return orderPincode === userPincode;
      });

      if (sameSlotOrders.length >= MAX_ORDERS_PER_SLOT_PINCODE) {
        const msg = `Slot full: maximum ${MAX_ORDERS_PER_SLOT_PINCODE} bookings reached for this service, slot, and area (pincode: ${userPincode}). Please choose a different slot or date.`;
        logBookingResult(400, false, msg, user.phone);
        return res.status(400).json({ error: msg });
      }

      console.log(`[Capacity] ${sameSlotOrders.length}/${MAX_ORDERS_PER_SLOT_PINCODE} orders for multiple items on ${date} @ ${timeSlot} in pincode ${userPincode}`);
    }
    // ────────────────────────────────────────────────────────────────────────────

    console.log(`User ${user.phone} validated booking slot ${timeSlot} on ${date} for multiple items`);

    const statusParam = req.body.status || req.query.status || (req.body.booking && req.body.booking.status);
    const useAmc = statusParam === "AMC" || req.body.useAmc === true || req.body.useAmc === "true" || (req.body.payment && String(req.body.payment.paymentMethod).toLowerCase() === "amc");

    // ALWAYS create a new draft order record with a new unique ID instead of overwriting/reusing.
    // This prevents active or previously booked orders from being updated or removed.
    const resolvedAddr = await resolveAddressForPhone(user.phone);
    const lastOrderId = await DbLayer.getLastOrderId();
    let highestId = lastOrderId;
    for (const draft of draftOrders.values()) {
      if (draft.id > highestId) {
        highestId = draft.id;
      }
    }
    const orderId = highestId + 1;

    const order = {
      id: orderId,
      userPhone: user.phone,
      userId: user.phone,
      serviceName: resolvedItems.map(x => x.serviceName).join(", "),
      price: useAmc ? 0.00 : totalPrice,
      date: date,
      status: useAmc ? "AMC" : "Draft",
      bookingStatus: "draft",
      partnerName: null,
      partnerDistance: null,
      productId: resolvedItems[0].productId,
      description: resolvedItems[0].description,
      timeSlot: timeSlot,
      address: resolvedAddr,
      payment: {
        paymentMethod: useAmc ? "AMC" : "Wallet",
        amountPaid: useAmc ? 0.00 : totalPrice
      },
      createdAt: Date.now(),
      items: resolvedItems
    };
    draftOrders.set(user.phone, order);
    console.log(`[handlePostBooking] Created new in-memory draft order #${order.id} for user ${user.phone} with ${resolvedItems.length} items`);

    // Always persist to DB so server restarts don't lose the draft (both created and updated drafts)
    try {
      await DbLayer.createOrder(order);
      console.log(`[handlePostBooking] Saved draft order #${order.id} to DB`);
    } catch (dbErr) {
      console.warn(`[handlePostBooking] Could not save draft to DB:`, dbErr.message);
    }

    logBookingResult(200, true, null, user.phone);
    res.json({
      success: true,
      message: "Booking details validated and registered",
      booking: {
        productId: resolvedItems[0].productId,
        date,
        timeSlot,
        items: resolvedItems
      }
    });
  } catch (err) {
    console.error("Booking validation failed:", err);
    logBookingResult(500, false, err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getBookings = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);
    if (user) {
      const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
      const placedOrders = userOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");
      const limitedUserOrders = placedOrders.slice(0, 5).map(o => localizeService(o, req.lang));
      return res.json({ success: true, bookings: limitedUserOrders, message: translate("bookings_retrieved", req.lang) });
    }
    
    // Fallback: public view of all bookings in the system for testing without authorization header
    const allOrders = await DbLayer.getAllOrders();
    const placedAllOrders = allOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");
    const limitedAllOrders = placedAllOrders.slice(0, 5).map(o => localizeService(o, req.lang));
    res.json({ success: true, bookings: limitedAllOrders, message: translate("bookings_retrieved", req.lang) });
  } catch (err) {
    console.error("Fetch bookings failed:", err);
    res.status(500).json({ error: translate("internal_error", req.lang) });
  }
};
const getAvailableDates = (req, res) => {
  const dates = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      formattedDate: d.toISOString().split('T')[0], // "2026-05-26"
      dayName: i === 0 ? "Today" : (i === 1 ? "Tomorrow" : daysOfWeek[d.getDay()]),
      displayDate: `${d.getDate()} ${months[d.getMonth()]}` // "26 May"
    });
  }

  res.json({
    success: true,
    dates: dates,
    message: translate("dates_retrieved", req.lang)
  });
};

const handleGetAvailableSlots = async (req, res) => {
  let date = req.query.date || req.query.dates || req.body.date || req.body.dates || req.headers['x-date'];
  let productId = req.query.productId || req.query.product || req.query.product_id || req.query.serviceName ||
                  req.body.productId || req.body.product || req.body.product_id || req.body.serviceName ||
                  req.headers['x-product-id'] || req.headers['x-product'];

  if (productId && typeof productId === 'object') {
    productId = productId.productId || productId.serviceName || productId.product || productId.product_id;
  }

  // Normalize inputs
  date = normalizeDate(date);

  if (productId) {
    const resolvedProduct = await resolveServiceDetails(productId);
    if (resolvedProduct) {
      productId = resolvedProduct.productId;
    }
  }

  try {
    let slots;
    const bookingSlots = await getBookingSlots();

    // Get pincode from query params or authenticated user's address
    let pincode = req.query.pincode || req.body.pincode || null;
    if (!pincode) {
      try {
        const authUser = await getAuthenticatedUser(req).catch(() => null);
        if (authUser) {
          const addr = await resolveAddressForPhone(authUser.phone);
          if (addr) pincode = String(addr.pincode || "").trim() || null;
        }
      } catch(_) {}
    }

    if (date) {
      // Use shared helper which checks real DB bookings for the given date
      // Pass productId and pincode for capacity check (50 orders per slot per service per pincode)
      const rawSlots = await getAvailableSlotsForDate(date, null, productId || null, pincode || null);
      slots = rawSlots.filter(s => s.available);
    } else {
      // No date provided — return all slots as available
      slots = bookingSlots.map(s => ({ ...s, available: true }));
    }

    res.json({
      success: true,
      slots: slots,
      message: translate("slots_retrieved", req.lang)
    });
  } catch (err) {
    console.error("Fetch available slots failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  handlePostBooking,
  getBookings,
  getAvailableDates,
  handleGetAvailableSlots
};
