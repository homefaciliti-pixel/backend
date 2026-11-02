const { DbLayer } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { parseOrderNumbers } = require('../utils/helpers');
const { localizeService } = require('../helpers/contentI18n');
const { translate } = require('../helpers/translate');

const getOrders = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
    const placedOrders = userOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");

    const statusQuery = req.query.status || req.body.status;
    let filteredOrders = placedOrders;
    if (statusQuery) {
      filteredOrders = placedOrders.filter(o => 
        (o.status && o.status.toLowerCase() === statusQuery.toLowerCase()) ||
        (o.payment && o.payment.paymentMethod && o.payment.paymentMethod.toLowerCase() === statusQuery.toLowerCase())
      );
    }

    // Localize serviceName for each order
    const localizedFilteredOrders = await Promise.all(filteredOrders.map(async o => {
      let localizedServiceName = o.serviceName;
      let localizedDescription = o.description;
      if (req.lang && req.lang !== 'en' && o.serviceName && getMysqlPool()) {
        try {
          const [svcRows] = await getMysqlPool().query(
            `SELECT title, title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
            [String(o.serviceName).toLowerCase()]
          );
          if (svcRows && svcRows[0]) {
            if (svcRows[0][`title_${req.lang}`]) {
              localizedServiceName = svcRows[0][`title_${req.lang}`];
            }
            if (svcRows[0][`description_${req.lang}`]) {
              localizedDescription = svcRows[0][`description_${req.lang}`];
            }
          }
        } catch (e) { /* ignore, use English name */ }
      }

      // Also localize items
      const itemsList = o.items || [];
      const localizedItems = await Promise.all(itemsList.map(async item => {
        let localizedItemName = item.serviceName;
        let localizedItemDesc = item.description;
        if (req.lang && req.lang !== 'en' && item.serviceName && getMysqlPool()) {
          try {
            const [svcRows] = await getMysqlPool().query(
              `SELECT title, title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
              [String(item.serviceName).toLowerCase()]
            );
            if (svcRows && svcRows[0]) {
              if (svcRows[0][`title_${req.lang}`]) {
                localizedItemName = svcRows[0][`title_${req.lang}`];
              }
              if (svcRows[0][`description_${req.lang}`]) {
                localizedItemDesc = svcRows[0][`description_${req.lang}`];
              }
            }
          } catch (e) {}
        }
        return {
          ...item,
          serviceName: localizedItemName,
          title: localizedItemName,
          description: localizedItemDesc,
          quantity: item.quantity || 1
        };
      }));

      return { 
        ...o, 
        serviceName: localizedServiceName, 
        description: localizedDescription,
        items: localizedItems.length > 0 ? localizedItems : null
      };
    }));

    // Enriched list mapping
    const list = localizedFilteredOrders.map(o => ({
      id: o.id,
      serviceName: o.serviceName,
      price: o.price,
      status: o.status,
      date: o.date,
      timeSlot: o.timeSlot,
      razorpayOrderId: o.razorpayOrderId || null,
      advancePayment: o.advancePayment !== undefined ? Number(o.advancePayment) : 0.00,
      remainingAmount: o.remainingAmount !== undefined ? Number(o.remainingAmount) : (o.status === "AMC" ? 0.00 : Number(o.price || 0)),
      platformCharge: o.platformCharge !== undefined ? Number(o.platformCharge) : 0.00,
      totalAmount: o.status === "AMC" ? 0.00 : Number(o.price || 0),
      total: o.status === "AMC" ? 0.00 : Number(o.price || 0),
      items: o.items
    }));

    const orderlist = {
      total: localizedFilteredOrders.length,
      data: localizedFilteredOrders
    };

    res.json({
      success: true,
      orders: localizedFilteredOrders,
      list,
      orderlist,
      status: statusQuery || "ALL",
      message: translate("bookings_retrieved", req.lang)
    });
  } catch (err) {
    console.error("Fetch orders failed:", err);
    res.status(500).json({ error: translate("internal_error", req.lang) });
  }
};
const getOrderById = async (req, res) => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  try {
    const order = await DbLayer.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (req.lang && req.lang !== 'en' && order.serviceName && getMysqlPool()) {
      try {
        const [svcRows] = await getMysqlPool().query(
          `SELECT title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
          [String(order.serviceName).toLowerCase()]
        );
        if (svcRows && svcRows[0]) {
          if (svcRows[0][`title_${req.lang}`]) {
            order.serviceName = svcRows[0][`title_${req.lang}`];
            order.title_hi = svcRows[0][`title_${req.lang}`]; 
          }
          if (svcRows[0][`description_${req.lang}`]) {
            order.description = svcRows[0][`description_${req.lang}`];
            order.description_hi = svcRows[0][`description_${req.lang}`];
          }
        }
      } catch (e) { /* ignore */ }
    }

    if (order.items && Array.isArray(order.items)) {
      order.items = await Promise.all(order.items.map(async item => {
        const localizedItem = localizeService(item, req.lang);
        if (req.lang && req.lang !== 'en' && item.serviceName && getMysqlPool()) {
          try {
            const [svcRows] = await getMysqlPool().query(
              `SELECT title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
              [String(item.serviceName).toLowerCase()]
            );
            if (svcRows && svcRows[0]) {
              if (svcRows[0][`title_${req.lang}`]) {
                localizedItem.serviceName = svcRows[0][`title_${req.lang}`];
                localizedItem.title = svcRows[0][`title_${req.lang}`];
              }
              if (svcRows[0][`description_${req.lang}`]) {
                localizedItem.description = svcRows[0][`description_${req.lang}`];
              }
            }
          } catch (e) {}
        }
        return {
          ...localizedItem,
          quantity: item.quantity || 1
        };
      }));
    }

    const localizedOrder = localizeService(order, req.lang);

    res.json({
      success: true,
      ...localizedOrder,
      status: localizedOrder.status || "Pending",
      advancePayment: localizedOrder.advancePayment !== undefined ? Number(localizedOrder.advancePayment) : (localizedOrder.status === "AMC" ? 0.00 : 199.00),
      remainingAmount: localizedOrder.remainingAmount !== undefined ? Number(localizedOrder.remainingAmount) : 0.00,
      platformCharge: localizedOrder.platformCharge !== undefined ? Number(localizedOrder.platformCharge) : 0.00,
      totalAmount: localizedOrder.status === "AMC" ? 0.00 : Number(localizedOrder.price || 0),
      total: localizedOrder.remainingAmount !== undefined ? Number(localizedOrder.remainingAmount) : 0.00,
      order: localizedOrder
    });
  } catch (err) {
    console.error("Fetch order details failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createOrder = async (req, res) => {
  const { serviceName, price, date, productId, description, timeSlot } = req.body;
  if (!serviceName || !price) {
    return res.status(400).json({ error: "Service Name and Price are required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Auto-increment simple numerical ID
    const lastOrderId = await DbLayer.getLastOrderId();
    const orderId = lastOrderId + 1;

    const newOrder = {
      id: orderId,
      userPhone: user.phone,
      serviceName: serviceName,
      price: Number(price),
      date: date || new Date().toISOString(),
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: productId || null,
      description: description || null,
      timeSlot: timeSlot || null,
      createdAt: Date.now()
    };

    await DbLayer.createOrder(newOrder);

    // Clear cart for user after placing order
    await DbLayer.clearCart(user.phone).catch(() => {});
    await saveUserRawCartItems(user.phone, []).catch(() => {});

    console.log(`Placed new order #${orderId} - ${serviceName} for phone ${user.phone}`);
    res.json({ success: true, order: newOrder, message: translate("booking_success", req.lang) });
  } catch (err) {
    console.error("Place order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleCancelOrder = async (req, res) => {
  const orderId = req.body.orderId || req.body.order_id || req.body.id || req.query.orderId || req.query.id;
  const cancelResponse = req.body.response || req.body.reason || req.body.cancelReason || req.body.cancellationReason || req.query.response || req.query.reason;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "orderId is required in request body"
    });
  }

  if (!cancelResponse || String(cancelResponse).trim() === "") {
    return res.status(400).json({
      success: false,
      error: "response (cancellation reason) is required in request body"
    });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
    }

    const numericOrderId = parseInt(orderId);
    const order = await DbLayer.getOrderById(numericOrderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const updates = {
      status: "Cancelled",
      bookingStatus: "idle",
      cancelReason: String(cancelResponse).trim()
    };

    let updatedOrder;
    try {
      updatedOrder = await DbLayer.updateOrder(numericOrderId, updates);
    } catch (dbErr) {
      delete updates.cancelReason;
      updatedOrder = await DbLayer.updateOrder(numericOrderId, updates);
    }

    return res.json({
      success: true,
      orderId: numericOrderId,
      status: "Cancelled",
      reason: String(cancelResponse).trim(),
      response: String(cancelResponse).trim(),
      order: updatedOrder,
      message: translate("order_cancelled", req.lang)
    });
  } catch (err) {
    console.error("Cancel order failed:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


const cancelOrderById = async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await DbLayer.updateOrder(orderId, {
      status: "Cancelled",
      bookingStatus: "idle"
    });

    res.json({ success: true, order: updatedOrder, message: translate("order_cancelled", req.lang) });
  } catch (err) {
    console.error("Cancel order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getBookingFlow = async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Real-time dispatching flow: bookings remain in searching state until accepted by a nearby partner or assigned by admin

    res.json({
      success: true,
      status: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance,
      message: translate("booking_flow_retrieved", req.lang)
    });
  } catch (err) {
    console.error("Get booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateBookingFlow = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, partnerName, partnerDistance } = req.body;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updates = {};
    if (status) {
      updates.bookingStatus = status;
      if (status === "completed") {
        updates.status = "Completed";
      }
    }
    if (partnerName) updates.partnerName = partnerName;
    if (partnerDistance) updates.partnerDistance = partnerDistance;

    const updatedOrder = await DbLayer.updateOrder(orderId, updates);
    console.log(`Updated Order #${orderId} Booking Status to: ${status}`);

    res.json({
      success: true,
      status: updatedOrder.bookingStatus,
      partnerName: updatedOrder.partnerName,
      partnerDistance: updatedOrder.partnerDistance,
      message: translate("booking_flow_updated", req.lang)
    });
  } catch (err) {
    console.error("Update booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  handleCancelOrder,
  cancelOrderById,
  getBookingFlow,
  updateBookingFlow
};
