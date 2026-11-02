const { DbLayer, memoryCart } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { translate } = require('../helpers/translate');
const { localizeService } = require('../helpers/contentI18n');
const { resolveDynamicServiceImageUrl, sanitizeServiceDbObj, resolveServiceUrls } = require('../utils/imageHelpers');
const { resolveServiceDetails } = require('../services/category.service');
const { readDataFromJsonDb } = require('../utils/helpers');

async function getUserIdFromReq(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user && (user.id || user.phone || user.user_id)) {
      return String(user.id || user.phone || user.user_id);
    }
  } catch (e) {}

  const headers = req ? (req.headers || {}) : {};
  const fromHeader = headers['x-user-id'] || headers['x-user-phone'] || headers['userid'];
  if (fromHeader) return String(fromHeader);

  const query = req ? (req.query || {}) : {};
  const fromQuery = query.userId || query.user_id || query.phone || query.id;
  if (fromQuery) return String(fromQuery);

  const body = req ? (req.body || {}) : {};
  const fromBody = body.userId || body.user_id || body.phone || body.id;
  if (fromBody) return String(fromBody);

  return "guest_default";
}

async function getUserRawCartItems(userId) {
  let items = [];

  if (getMysqlReady()) {
    try {
      await getMysqlPool().query(`
        CREATE TABLE IF NOT EXISTS node_cart (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          service_id VARCHAR(100) NOT NULL,
          category_id VARCHAR(100) DEFAULT '',
          category_name VARCHAR(255) DEFAULT '',
          quantity INT DEFAULT 1,
          options TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY user_service (user_id, service_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      let rows;
      try {
        [rows] = await getMysqlPool().query("SELECT * FROM node_cart WHERE user_id = ?", [userId]);
      } catch (err1) {
        [rows] = await getMysqlPool().query("SELECT * FROM node_cart WHERE userPhone = ?", [userId]);
      }

      if (rows && rows.length > 0) {
        return rows.map(r => {
          const opts = r.options ? (typeof r.options === 'string' ? JSON.parse(r.options || '{}') : r.options) : {};
          return {
            serviceId: String(r.service_id),
            quantity: parseInt(r.quantity || 1, 10),
            categoryId: String(r.category_id || ''),
            categoryName: String(r.category_name || ''),
            price: opts.price || r.price,
            cutPrice: opts.cutPrice || opts.cut_price || r.cut_price,
            options: opts
          };
        });
      }
    } catch (e) {
      console.warn("[Cart] MySQL query failed, falling back:", e.message);
    }
  }

  try {
    const dbData = readDataFromJsonDb();
    if (dbData && dbData.cart) {
      const userItems = dbData.cart.filter(item => String(item.userId || item.user_id || item.userPhone) === String(userId));
      if (userItems.length > 0) {
        return userItems.map(item => ({
          serviceId: String(item.serviceId || item.service_id),
          quantity: parseInt(item.quantity || item.qty || 1, 10),
          categoryId: String(item.categoryId || item.category_id || ''),
          categoryName: String(item.categoryName || item.category_name || ''),
          price: item.price || (item.options && item.options.price),
          cutPrice: item.cutPrice || item.cut_price || (item.options && (item.options.cutPrice || item.options.cut_price)),
          options: item.options || {}
        }));
      }
    }
  } catch (e) {}

  if (memoryCart.has(userId)) {
    const userMap = memoryCart.get(userId);
    items = Array.from(userMap.values());
  }

  return items;
}

async function saveUserRawCartItems(userId, items) {
  const userMap = new Map();
  items.forEach(item => {
    userMap.set(String(item.serviceId), item);
  });
  memoryCart.set(userId, userMap);

  if (getMysqlReady()) {
    try {
      try {
        await getMysqlPool().query("DELETE FROM node_cart WHERE user_id = ?", [userId]);
      } catch (err1) {
        await getMysqlPool().query("DELETE FROM node_cart WHERE userPhone = ?", [userId]);
      }

      for (const item of items) {
        try {
          await getMysqlPool().query(
            "INSERT INTO node_cart (user_id, service_id, category_id, category_name, quantity, options) VALUES (?, ?, ?, ?, ?, ?)",
            [
              userId,
              String(item.serviceId),
              String(item.categoryId || ''),
              String(item.categoryName || ''),
              item.quantity,
              JSON.stringify(item.options || {})
            ]
          );
        } catch (err1) {
          await getMysqlPool().query(
            "INSERT INTO node_cart (userPhone, service_id, category_id, category_name, quantity, options) VALUES (?, ?, ?, ?, ?, ?)",
            [
              userId,
              String(item.serviceId),
              String(item.categoryId || ''),
              String(item.categoryName || ''),
              item.quantity,
              JSON.stringify(item.options || {})
            ]
          );
        }
      }
    } catch (e) {
      console.warn("[Cart] MySQL save failed:", e.message);
    }
  }

  try {
    const dbPath = path.join(__dirname, 'database.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (dbData) {
        dbData.cart = (dbData.cart || []).filter(item => String(item.userId || item.user_id || item.userPhone) !== String(userId));
        for (const item of items) {
          dbData.cart.push({
            userId: userId,
            serviceId: String(item.serviceId),
            quantity: item.quantity,
            categoryId: String(item.categoryId || ''),
            categoryName: String(item.categoryName || ''),
            price: item.price,
            cutPrice: item.cutPrice,
            options: item.options || {},
            updatedAt: new Date().toISOString()
          });
        }
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
      }
    }
  } catch (e) {
    console.warn("[Cart] JSON save failed:", e.message);
  }
}


async function resolveFullUserCart(userId, lang = 'en') {
  const rawItems = await getUserRawCartItems(userId);
  const host = 'https://backend-1-ux3b.onrender.com';
  const serverBaseUrl = host;

  let allServices = [];
  let allVariants = [];

  if (getMysqlReady()) {
    try {
      const [rows] = await getMysqlPool().query(
        "SELECT s.*, c.title as cat_name FROM node_services s LEFT JOIN node_categories c ON s.category_id = c.id WHERE s.status IN (0, 1)"
      );
      if (rows && rows.length > 0) {
        allServices = rows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
      }
      try {
        const [vRows] = await getMysqlPool().query("SELECT * FROM service_variants");
        if (vRows && vRows.length > 0) {
          allVariants = vRows;
        }
      } catch (e) {}
    } catch (e) {}
  }

  if (allServices.length === 0) {
    try {
      const data = readDataFromJsonDb();
      if (data && data.services) {
        allServices = data.services;
      }
    } catch (e) {}
  }

  const enrichedItems = [];
  let subtotal = 0;
  let totalQuantity = 0;
  let totalOriginalPrice = 0;

  for (const raw of rawItems) {
    const sId = String(raw.serviceId);

    const vId = raw.options ? String(raw.options.variantId || raw.options.variant_id || raw.options.id || '') : '';
    let matchedVariant = allVariants.find(v => 
      String(v.id) === sId || 
      String(v.variantId) === sId || 
      (vId && String(v.id) === vId)
    );

    let matchedSvc = allServices.find(s => 
      String(s.id) === sId || 
      String(s.service_id) === sId || 
      (matchedVariant && (String(s.id) === String(matchedVariant.service_id) || String(s.service_id) === String(matchedVariant.service_id))) ||
      (s.title && s.title.toLowerCase() === sId.toLowerCase())
    );

    let title = raw.title || (matchedVariant ? (matchedVariant.title || matchedVariant.name) : '') || (matchedSvc ? (matchedSvc.title || matchedSvc.name) : "Service Item");
    let description = (matchedVariant && matchedVariant.description) || (matchedSvc ? (matchedSvc.description || matchedSvc.desc || "") : "");

    let optPrice = raw.price || (raw.options && (raw.options.price || raw.options.variantPrice || (raw.options.variant && raw.options.variant.price)));
    let parsedOptPrice = optPrice !== undefined && optPrice !== null && !isNaN(parseFloat(optPrice)) ? parseFloat(optPrice) : 0;

    let price = 0;
    if (parsedOptPrice > 0) {
      price = parsedOptPrice;
    } else if (matchedVariant && parseFloat(matchedVariant.price || 0) > 0) {
      price = parseFloat(matchedVariant.price);
    } else if (matchedSvc && parseFloat(matchedSvc.price || matchedSvc.price_final || matchedSvc.discount_price || 0) > 0) {
      price = parseFloat(matchedSvc.price || matchedSvc.price_final || matchedSvc.discount_price);
    } else if (raw.price && parseFloat(raw.price) > 0) {
      price = parseFloat(raw.price);
    }

    let optCutPrice = raw.cutPrice || (raw.options && (raw.options.cutPrice || raw.options.originalPrice || (raw.options.variant && (raw.options.variant.cutPrice || raw.options.variant.originalPrice))));
    let parsedOptCutPrice = optCutPrice !== undefined && optCutPrice !== null && !isNaN(parseFloat(optCutPrice)) ? parseFloat(optCutPrice) : 0;

    let originalPrice = 0;
    if (parsedOptCutPrice > 0) {
      originalPrice = parsedOptCutPrice;
    } else if (matchedVariant && parseFloat(matchedVariant.cutPrice || matchedVariant.cut_price || 0) > 0) {
      originalPrice = parseFloat(matchedVariant.cutPrice || matchedVariant.cut_price);
    } else if (matchedSvc && parseFloat(matchedSvc.original_price || matchedSvc.cut_price || matchedSvc.cutPrice || 0) > 0) {
      originalPrice = parseFloat(matchedSvc.original_price || matchedSvc.cut_price || matchedSvc.cutPrice);
    } else {
      originalPrice = Math.round(price * 1.25);
    }

    if (originalPrice < price) originalPrice = Math.round(price * 1.2);
    
    let discount = (matchedVariant && matchedVariant.discount) ? matchedVariant.discount : ((matchedSvc && matchedSvc.discount) ? matchedSvc.discount : "20% OFF");
    let image = matchedSvc ? resolveDynamicServiceImageUrl(matchedSvc, serverBaseUrl) : (raw.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop");
    let catId = raw.categoryId || (matchedSvc ? String(matchedSvc.category_id || matchedSvc.category || "1") : "1");
    let catName = raw.categoryName || (matchedSvc ? String(matchedSvc.cat_name || matchedSvc.categoryName || matchedSvc.category || "General") : "General");
    let qty = parseInt(raw.quantity || 1, 10);
    let itemTotal = price * qty;
    let duration = (matchedVariant && matchedVariant.duration) ? (matchedVariant.duration + " mins") : ((matchedSvc && matchedSvc.duration) ? matchedSvc.duration : "45 mins");
    let warranty = matchedSvc && matchedSvc.warranty ? matchedSvc.warranty : "30 Days Warranty";

    if (lang && lang !== 'en' && matchedSvc && getMysqlReady()) {
      try {
        const [trans] = await getMysqlPool().query(
          `SELECT title_${lang}, description_${lang} FROM node_services WHERE id = ? LIMIT 1`,
          [matchedSvc.id]
        );
        if (trans && trans[0]) {
          if (trans[0][`title_${lang}`]) title = trans[0][`title_${lang}`];
          if (trans[0][`description_${lang}`]) description = trans[0][`description_${lang}`];
        }
      } catch (e) {}
    }

    subtotal += itemTotal;
    totalQuantity += qty;
    totalOriginalPrice += (originalPrice * qty);

    enrichedItems.push({
      serviceId: sId,
      id: sId,
      title: title,
      name: title,
      description: description,
      price: Math.round(price),
      originalPrice: Math.round(originalPrice),
      cutPrice: Math.round(originalPrice),
      discount: discount,
      image: image,
      imageUrl: image,
      categoryId: catId,
      categoryName: catName,
      quantity: qty,
      qty: qty,
      itemTotal: Math.round(itemTotal),
      duration: duration,
      warranty: warranty,
      options: raw.options || {}
    });
  }

  const discountTotal = Math.max(0, Math.round(totalOriginalPrice - subtotal));

  return {
    items: enrichedItems,
    totalItems: enrichedItems.length,
    totalQuantity: totalQuantity,
    subtotal: Math.round(subtotal),
    discountTotal: discountTotal,
    tax: 0,
    deliveryFee: 0,
    grandTotal: Math.round(subtotal)
  };
}


const enrichCartItems = async (cartItems, lang, serverBaseUrl) => {
  const enriched = [];
  for (const item of cartItems) {
    const serviceDetails = await resolveServiceDetails(item.productId);
    const resolvedUrlService = resolveServiceUrls([serviceDetails], serverBaseUrl)[0];
    const localized = localizeService(resolvedUrlService, lang);
    enriched.push({
      productId: item.productId,
      quantity: item.quantity,
      title: localized.title,
      name: localized.name,
      price: localized.price,
      description: localized.description,
      image: localized.image,
      category: localized.category,
      categoryId: localized.categoryId
    });
  }
  return enriched;
};

const addToCart = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const body = req.body || {};
    const serviceId = String(body.serviceId || body.service_id || body.id || '');
    const quantity = parseInt(body.quantity || body.qty || 1, 10);
    const categoryId = String(body.categoryId || body.category_id || '');
    const categoryName = String(body.categoryName || body.category_name || '');
    const options = body.options || {};

    const price = body.price || (body.options && body.options.price);
    const cutPrice = body.cutPrice || body.cut_price || body.originalPrice || (body.options && (body.options.cutPrice || body.options.originalPrice));

    if (price !== undefined) options.price = parseFloat(price);
    if (cutPrice !== undefined) options.cutPrice = parseFloat(cutPrice);

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);
    const existingIndex = items.findIndex(item => String(item.serviceId) === serviceId);

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      if (categoryId) items[existingIndex].categoryId = categoryId;
      if (categoryName) items[existingIndex].categoryName = categoryName;
      if (price !== undefined) items[existingIndex].price = parseFloat(price);
      if (cutPrice !== undefined) items[existingIndex].cutPrice = parseFloat(cutPrice);
      items[existingIndex].options = { ...(items[existingIndex].options || {}), ...options };
    } else {
      items.push({
        serviceId: serviceId,
        quantity: quantity,
        categoryId: categoryId,
        categoryName: categoryName,
        price: price !== undefined ? parseFloat(price) : undefined,
        cutPrice: cutPrice !== undefined ? parseFloat(cutPrice) : undefined,
        options: options
      });
    }

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_item_added", req.lang) || "Service added to cart successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Add to cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
const getCart = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_retrieved", req.lang) || "Cart retrieved successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Get cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
const updateQuantity = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const body = req.body || {};
    const serviceId = String(body.serviceId || body.service_id || body.id || '');
    const newQty = parseInt(body.quantity !== undefined ? body.quantity : (body.qty !== undefined ? body.qty : 1), 10);

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);

    if (newQty <= 0) {
      items = items.filter(item => String(item.serviceId) !== serviceId);
    } else {
      const existingIndex = items.findIndex(item => String(item.serviceId) === serviceId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity = newQty;
      } else {
        items.push({ serviceId: serviceId, quantity: newQty });
      }
    }

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_updated", req.lang) || "Cart quantity updated successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Update cart quantity failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
const removeItem = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const serviceId = String(req.params ? (req.params.serviceId || '') : '');

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);
    items = items.filter(item => String(item.serviceId) !== serviceId);

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_item_removed", req.lang) || "Item removed from cart successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Remove cart item failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
const clearCart = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);

    await saveUserRawCartItems(userId, []);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_cleared", req.lang) || "Cart cleared successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Clear cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const getCartAlt = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const cartItems = await DbLayer.getCart(user.phone);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, items: enriched });
  } catch (err) {
    console.error("Get cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addToCartAlt = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    const qty = parseInt(quantity) || 1;
    
    // Verify product exists
    await resolveServiceDetails(productId);
    
    const cartItems = await DbLayer.addToCart(user.phone, productId, qty);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_item_added", req.lang) || "Item added to cart", items: enriched });
  } catch (err) {
    console.error("Add to cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateCartAlt = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    if (quantity === undefined) {
      return res.status(400).json({ error: "quantity is required" });
    }
    const qty = parseInt(quantity);
    
    const cartItems = await DbLayer.updateCartItem(user.phone, productId, qty);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_updated", req.lang) || "Cart updated successfully", items: enriched });
  } catch (err) {
    console.error("Update cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const clearCartAlt = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await DbLayer.clearCart(user.phone);
    res.json({ success: true, message: translate("cart_cleared", req.lang) || "Cart cleared successfully", items: [] });
  } catch (err) {
    console.error("Clear cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const removeItemAlt = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const productId = req.params.productId;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    const cartItems = await DbLayer.removeFromCart(user.phone, productId);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_item_removed", req.lang) || "Item removed from cart", items: enriched });
  } catch (err) {
    console.error("Remove from cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  clearCart,
  getCartAlt,
  addToCartAlt,
  updateCartAlt,
  clearCartAlt,
  removeItemAlt
};
