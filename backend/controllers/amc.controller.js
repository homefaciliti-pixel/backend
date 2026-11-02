const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { AMC_SUPPORTED_CATEGORIES, CATEGORIES_DATA } = require('../config/constants');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getPhoneVariants, isMockPaymentAllowed, getCanonicalCategoryName, safeJsonParse, parseOrderNumbers, normalizeDate, normalizeTimeSlot } = require('../utils/helpers');
const { getCategoryIdByName, getServiceCategoryDbOrStatic, resolveServiceDetails } = require('../services/category.service');
const { localizeCategory } = require('../helpers/contentI18n');
const { translate } = require('../helpers/translate');

const getPlans = (req, res) => {
  const plans = AMC_SUPPORTED_CATEGORIES.map(categoryName => {
    const catId = getCategoryIdByName(categoryName);
    const locCat = localizeCategory({ name: categoryName, id: catId }, req.lang);
    const isHi = (req.lang === 'hi');
    return {
      category: locCat.name,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      baseRatePerSqFt: 1.0,
      price: 1.0,
      description: isHi 
        ? `${locCat.name} के लिए वार्षिक रखरखाव अनुबंध (AMC)। प्रति वर्ष 12 मुफ्त सेवाएँ। बेस रेट: ₹1/वर्ग फुट।`
        : `Annual Maintenance Contract for ${locCat.name}. Free 12 services per year. Base price: ₹1 per sq feet.`
    };
  });
  res.json({ 
    success: true, 
    plans,
    message: (req.lang === 'hi') ? "AMC प्लान्स सफलतापूर्ण प्राप्त हुए" : undefined
  });
};
const subscribe = async (req, res) => {
  const { category, areaSqFt, floors, note, notes, price, file, document } = req.body;
  if (!category || !areaSqFt || !floors || areaSqFt <= 0 || floors <= 0) {
    return res.status(400).json({ error: "category, areaSqFt and floors are required and must be positive numbers" });
  }

  if (!AMC_SUPPORTED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "This category does not support AMC subscriptions" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user already has an active subscription for this category
    const existing = await DbLayer.getAmcSubscriptionByCategory(user.phone, category);
    if (existing) {
      return res.status(400).json({ error: `You already have an active AMC subscription for ${category} (AMC ID: ${existing.amcId})` });
    }

    // Build file URLs if uploaded
    const serverBase = `${req.protocol}://${req.get('host')}`;
    const photoFile = req.files && req.files['photo'] && req.files['photo'][0];
    const imageFile = req.files && req.files['image'] && req.files['image'][0];
    const pdfFile = req.files && req.files['pdf'] && req.files['pdf'][0];
    const fileFile = req.files && req.files['file'] && req.files['file'][0];
    const docFile = req.files && req.files['document'] && req.files['document'][0];

    // Resolve a single combined fileUrl dynamically from any uploaded file or body text parameter
    let resolvedFileUrl = null;
    if (photoFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${photoFile.filename}`;
    } else if (imageFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${imageFile.filename}`;
    } else if (pdfFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${pdfFile.filename}`;
    } else if (fileFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${fileFile.filename}`;
    } else if (docFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${docFile.filename}`;
    } else if (req.body.photo) {
      resolvedFileUrl = req.body.photo;
    } else if (req.body.image) {
      resolvedFileUrl = req.body.image;
    } else if (req.body.pdf) {
      resolvedFileUrl = req.body.pdf;
    } else if (req.body.file) {
      resolvedFileUrl = req.body.file;
    } else if (req.body.document) {
      resolvedFileUrl = req.body.document;
    }

    const resolvedNote = note || notes || null;

    // Calculate price: fallback to formula (areaSqFt * ₹1/sq ft * floors) if not passed in body
    const ratePerSqFt = 1.0;
    const totalPrice = price !== undefined && price !== "" ? Number(price) : (Number(areaSqFt) * 1 * Number(floors));

    // Generate unique AMC ID
    const amcId = `AMC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const catId = getCategoryIdByName(category);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // 1 year validity

    const newSub = {
      amcId,
      userPhone: user.phone,
      category,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      areaSqFt: Number(areaSqFt),
      floors: Number(floors),
      price: totalPrice,
      status: 'pending_payment',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      photoUrl: resolvedFileUrl,
      pdfUrl: resolvedFileUrl,
      fileUrl: resolvedFileUrl,
      note: resolvedNote
    };

    await DbLayer.createAmcSubscription(newSub);

    res.json({
      success: true,
      orderId: amcId,
      order_id: amcId,
      amcId: amcId,
      message: `Successfully subscribed to AMC for ${category}! Valid for 1 year with 12 free bookings.`,
      subscription: {
        ...newSub,
        orderId: amcId,
        order_id: amcId
      }
    });
  } catch (err) {
    console.error("AMC subscription failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getSubscriptions = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscriptions = (await DbLayer.getAmcSubscriptions(user.phone))
      .filter(s => s.status === 'active');

    // Map each subscription to include completed bookings progress count, categoryId, and monthly limit checks
    const activeSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
      const completedCount = await DbLayer.countAmcBookingsCompleted(sub.amcId);
      const currentMonthCount = await DbLayer.countAmcBookingsInCurrentMonth(sub.amcId);
      const catId = getCategoryIdByName(sub.category);
      const locCat = localizeCategory({ name: sub.category, id: catId }, req.lang);
      const isHi = (req.lang === 'hi');
      
      return {
        amcId: sub.amcId,
        userPhone: sub.userPhone,
        category: locCat.name,
        categoryId: catId,
        category_id: catId,
        catId: catId,
        id: catId,
        areaSqFt: sub.areaSqFt,
        floors: sub.floors,
        price: parseFloat(sub.price),
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        completedCount,
        currentMonthCount,
        monthlyLimit: 1,
        canBookThisMonth: currentMonthCount < 1,
        totalAllowed: 12,
        progressMessage: isHi 
          ? `12 में से ${completedCount} सेवाएँ पूर्ण (प्रति माह 1 सेवा की सीमा)` 
          : `${completedCount} complete out of 12 (Limit: 1 service per month)`,
        photoUrl: sub.photoUrl,
        pdfUrl: sub.pdfUrl,
        fileUrl: sub.fileUrl || sub.photoUrl || sub.pdfUrl,
        note: sub.note,
        buttons: {
          bookService: isHi ? `सेवा बुक करें (₹0 पर)` : `Book Service (at ₹0)`,
          renewService: isHi ? `सेवा रिन्यू करें` : `Renew Service`
        }
      };
    }));

    // Find which categories do NOT have an active subscription
    const now = new Date();
    const subscribedCategories = subscriptions
      .filter(s => s.status === 'active' && new Date(s.endDate) > now)
      .map(s => s.category);

    const availablePlans = AMC_SUPPORTED_CATEGORIES
      .filter(cat => !subscribedCategories.includes(cat))
      .map(cat => {
        const catId = getCategoryIdByName(cat);
        const locCat = localizeCategory({ name: cat, id: catId }, req.lang);
        const isHi = (req.lang === 'hi');
        
        return {
          category: locCat.name,
          categoryId: catId,
          category_id: catId,
          catId: catId,
          id: catId,
          baseRatePerSqFt: 1.0,
          price: 1.0,
          description: isHi 
            ? `${locCat.name} के लिए वार्षिक रखरखाव अनुबंध (AMC) लें (₹1/वर्ग फुट बेस रेट पर प्रति वर्ष 12 मुफ्त सेवाएँ)।` 
            : `Subscribe to Annual Maintenance Contract for ${locCat.name} (12 free services per year at ₹1/sq ft base rate).`
        };
      });

    res.json({
      success: true,
      activeSubscriptions,
      availablePlans,
      message: (req.lang === 'hi') ? "AMC सब्सक्रिप्शन सफलतापूर्ण प्राप्त हुए" : "AMC subscriptions and plans retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch AMC subscriptions failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const renew = async (req, res) => {
  const { amcId } = req.body;
  if (!amcId) {
    return res.status(400).json({ error: "amcId is required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sub = await DbLayer.getAmcSubscriptionById(amcId);
    if (!sub || sub.userPhone !== user.phone) {
      return res.status(404).json({ error: "AMC subscription not found" });
    }

    const now = new Date();
    const baseDate = (sub.status === 'active' && new Date(sub.endDate) > now) ? new Date(sub.endDate) : now;
    const newEndDate = new Date(baseDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    const updated = await DbLayer.updateAmcSubscription(amcId, {
      status: 'active',
      endDate: newEndDate.toISOString()
    });

    res.json({
      success: true,
      message: `AMC subscription ${amcId} renewed successfully! Extended for 1 year.`,
      subscription: updated
    });
  } catch (err) {
    console.error("Renew AMC subscription failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getPlansByCategory = (req, res) => {
  const { category } = req.params;
  const exists = CATEGORIES_DATA.some(cat => cat.toLowerCase() === category.toLowerCase());
  if (!exists) {
    return res.status(404).json({ error: `AMC plan for category ${category} not found` });
  }
  const matchedCategory = CATEGORIES_DATA.find(cat => cat.toLowerCase() === category.toLowerCase());
  const catId = getCategoryIdByName(matchedCategory);
  res.json({
    success: true,
    plan: {
      category: matchedCategory,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      baseRatePerSqFt: 1.0,
      price: 1.0,
      description: `Annual Maintenance Contract for ${matchedCategory}. Free 12 services per year. Base price: ₹1 per sq feet.`
    }
  });
};
const planPropertyDetails = (req, res) => {
  const { category, areaSqFt, floors } = req.body;
  if (!category || !areaSqFt || !floors || areaSqFt <= 0 || floors <= 0) {
    return res.status(400).json({ error: "category, areaSqFt and floors are required and must be positive numbers" });
  }
  if (!CATEGORIES_DATA.some(cat => cat.toLowerCase() === category.toLowerCase())) {
    return res.status(400).json({ error: "Invalid category" });
  }
  const matchedCategory = CATEGORIES_DATA.find(cat => cat.toLowerCase() === category.toLowerCase());
  const ratePerSqFt = 1.0;
  const totalPrice = Number(areaSqFt) * 1 * Number(floors);
  const catId = getCategoryIdByName(matchedCategory);
  res.json({
    success: true,
    category: matchedCategory,
    categoryId: catId,
    category_id: catId,
    catId: catId,
    id: catId,
    areaSqFt: Number(areaSqFt),
    floors: Number(floors),
    ratePerSqFt,
    totalPrice,
    description: `Estimated AMC for ${matchedCategory} over ${areaSqFt} sq ft across ${floors} floor(s).`
  });
};

const handlePostAmcBooking = async (req, res) => {
  const amcId = req.body.amcId || req.body.amc || req.query.amcId || req.query.amc;
  const productId = req.body.productId || req.body.product || req.body.product_id || req.body.serviceName || req.query.productId;
  let date = req.body.date || req.query.date;
  let timeSlot = req.body.timeSlot || req.body.slot || req.query.timeSlot;
  const addressObj = req.body.address;

  if (!amcId || !productId || !date || !timeSlot) {
    return res.status(400).json({ error: "amcId, productId, date, and timeSlot are required" });
  }

  date = normalizeDate(date);
  timeSlot = normalizeTimeSlot(timeSlot);

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sub = await DbLayer.getAmcSubscriptionById(amcId);
    if (!sub || sub.userPhone !== user.phone) {
      return res.status(404).json({ error: "AMC subscription not found" });
    }

    if (sub.status !== 'active') {
      return res.status(400).json({ error: `AMC subscription status is '${sub.status}', not 'active'` });
    }

    if (new Date(sub.endDate) < new Date()) {
      return res.status(400).json({ error: "AMC subscription has expired" });
    }

    const completedCount = await DbLayer.countAmcBookingsCompleted(amcId);
    if (completedCount >= 12) {
      return res.status(400).json({ error: "You have already completed all 12 free services for this AMC subscription" });
    }

    const currentMonthCount = await DbLayer.countAmcBookingsInCurrentMonth(amcId);
    if (currentMonthCount >= 1) {
      return res.status(400).json({ error: "You have already booked your 1 free AMC service for this month. You can book your next free AMC service next month." });
    }

    const resolvedProduct = await resolveServiceDetails(productId);
    if (!resolvedProduct) {
      return res.status(404).json({ error: `Service/Product '${productId}' not found in catalog` });
    }

    const serviceCategory = await getServiceCategoryDbOrStatic(resolvedProduct.title);
    const canonicalServiceCategory = getCanonicalCategoryName(serviceCategory);
    const canonicalSubCategory = getCanonicalCategoryName(sub.category);
    if (canonicalServiceCategory !== canonicalSubCategory) {
      return res.status(400).json({
        error: `Category mismatch: This service (${resolvedProduct.title}) belongs to category '${canonicalServiceCategory}', but your AMC subscription is for '${canonicalSubCategory}'`
      });
    }

    let resolvedAddress = null;
    if (addressObj) {
      try {
        const newAddress = {
          userPhone: user.phone,
          type: addressObj.type || "Home",
          houseNo: addressObj.houseNo || "",
          society: addressObj.society || "",
          floor: addressObj.floor || "",
          landmark: addressObj.landmark || "",
          city: addressObj.city || "",
          locality: addressObj.locality || "",
          pincode: addressObj.pincode || "",
          latitude: Number(addressObj.latitude) || 0,
          longitude: Number(addressObj.longitude) || 0,
          name: addressObj.name || "",
          alternateNumber: addressObj.alternateNumber || addressObj.alternate_number || "",
          countryCode: addressObj.countryCode || addressObj.country_code || "+91"
        };
        resolvedAddress = await DbLayer.createAddress(newAddress);
      } catch (addrErr) {
        console.error("Save address from body failed:", addrErr);
      }
    }
    if (!resolvedAddress) {
      const addresses = await DbLayer.getAddressesByUserPhone(user.phone).catch(() => []);
      if (addresses && addresses.length > 0) {
        resolvedAddress = addresses[addresses.length - 1];
      }
    }

    const lastOrderId = await DbLayer.getLastOrderId();
    let highestId = lastOrderId;
    for (const draft of draftOrders.values()) {
      if (draft.id > highestId) {
        highestId = draft.id;
      }
    }
    const orderId = highestId + 1;

    const newOrder = {
      id: orderId,
      userPhone: user.phone,
      userId: user.phone,
      serviceName: resolvedProduct.serviceName,
      price: 0.00,
      date: date,
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: resolvedProduct.productId,
      description: resolvedProduct.description,
      timeSlot: timeSlot,
      address: resolvedAddress,
      payment: {
        paymentMethod: "AMC",
        amountPaid: 0.00
      },
      razorpayOrderId: null,
      razorpayPaymentId: null,
      createdAt: Date.now(),
      amcId: sub.amcId,
      advancePayment: 0.00,
      remainingAmount: 0.00
    };

    const placedOrder = await DbLayer.createOrder(newOrder);
    draftOrders.delete(user.phone);

    res.json({
      success: true,
      orderId: placedOrder.id,
      order_id: placedOrder.id,
      message: `Successfully booked service '${resolvedProduct.title}' under AMC subscription ${sub.amcId}!`,
      order: placedOrder
    });
  } catch (err) {
    console.error("AMC booking failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  getPlans,
  subscribe,
  getSubscriptions,
  renew,
  getPlansByCategory,
  planPropertyDetails,
  handlePostAmcBooking
};
