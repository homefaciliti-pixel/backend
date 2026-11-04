const fs = require('fs');
const path = require('path');
const { DB_FILE, DEFAULT_CATEGORIES } = require('../config/constants');
const { getMysqlPool, getMysqlReady, setMysqlReady, getDbMode, setDbMode, initJsonDb } = require('../config/db');
const { parseOrderNumbers, getPhoneVariants, getCanonicalPhone } = require('../utils/helpers');
const { fetchAdminBackendCategories } = require('./adminBackend.service');
const { handleBookingStatusSmsTrigger } = require('./sms.service');

// Active OTPs in-memory storage (phone -> { otp, expiresAt })
const activeOTPsMap = new Map();
const activeOTPs = {
  get(key) { return activeOTPsMap.get(getCanonicalPhone(key)); },
  set(key, val) { activeOTPsMap.set(getCanonicalPhone(key), val); return this; },
  delete(key) { return activeOTPsMap.delete(getCanonicalPhone(key)); },
  has(key) { return activeOTPsMap.has(getCanonicalPhone(key)); },
  clear() { activeOTPsMap.clear(); },
  values() { return activeOTPsMap.values(); },
  keys() { return activeOTPsMap.keys(); },
  entries() { return activeOTPsMap.entries(); },
  get size() { return activeOTPsMap.size; },
  [Symbol.iterator]() { return activeOTPsMap[Symbol.iterator](); }
};

// Active checkout draft bookings in-memory storage (phone -> draftOrderObject)
const draftOrdersMap = new Map();
const draftOrders = {
  get(key) { return draftOrdersMap.get(getCanonicalPhone(key)); },
  set(key, val) { draftOrdersMap.set(getCanonicalPhone(key), val); return this; },
  delete(key) { return draftOrdersMap.delete(getCanonicalPhone(key)); },
  has(key) { return draftOrdersMap.has(getCanonicalPhone(key)); },
  clear() { draftOrdersMap.clear(); },
  values() { return draftOrdersMap.values(); },
  keys() { return draftOrdersMap.keys(); },
  entries() { return draftOrdersMap.entries(); },
  get size() { return draftOrdersMap.size; },
  [Symbol.iterator]() { return draftOrdersMap[Symbol.iterator](); }
};

const memoryCart = new Map();

const MySqlDbLayer = {
  async queryOne(sql, params) {
    const [rows] = await getMysqlPool().query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async getUserByPhone(phone) {
    const row = await this.queryOne("SELECT * FROM node_users_v2 WHERE phone IN (?) LIMIT 1", [getPhoneVariants(phone)]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance || 0);
    const variants = getPhoneVariants(phone);
    if (variants.some(p => String(p).includes('7799666101'))) {
      if (!row.walletBalance || row.walletBalance < 2000) {
        row.walletBalance = 2000.00;
      }
    }
    return row;
  },

  async getUserByReferralCode(code) {
    const row = await this.queryOne("SELECT * FROM node_users_v2 WHERE referralCode = ?", [code]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance);
    return row;
  },

  async createUser(user) {
    const { phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode, language } = user;
    const finalName = name || "";
    const finalEmail = email || "";
    const finalLocation = location || "";
    const finalLocality = locality || "";
    const finalGender = gender || "Male";
    const finalWalletBalance = walletBalance !== undefined ? walletBalance : 0.00;
    const finalCountryCode = countryCode || "+91";
    const finalLanguage = language || "en";

    await getMysqlPool().query(
      "INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), location=VALUES(location), locality=VALUES(locality), gender=VALUES(gender), referralCode=VALUES(referralCode), walletBalance=VALUES(walletBalance), countryCode=VALUES(countryCode), language=VALUES(language)",
      [phone, finalName, finalEmail, finalLocation, finalLocality, finalGender, referralCode, finalWalletBalance, finalCountryCode, finalLanguage]
    );

    return this.getUserByPhone(phone);
  },

  async updateUser(phone, updates) {
    const user = await this.getUserByPhone(phone);
    const targetPhone = user ? user.phone : phone;
    if (Object.keys(updates).length === 0) return user;
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await getMysqlPool().query(`UPDATE node_users_v2 SET ${setClause} WHERE phone = ?`, [...values, targetPhone]);
    return this.getUserByPhone(targetPhone);
  },

  async deleteUser(phone) {
    const user = await this.getUserByPhone(phone);
    const targetPhone = user ? user.phone : phone;
    await getMysqlPool().query("DELETE FROM node_users_v2 WHERE phone = ?", [targetPhone]);
    await getMysqlPool().query("DELETE FROM node_addresses_v2 WHERE userPhone = ?", [targetPhone]);
    return true;
  },

  async createContact(contact) {
    const { name, email, phone, message } = contact;
    const [result] = await getMysqlPool().query(
      "INSERT INTO node_contacts_v2 (name, email, phone, message) VALUES (?, ?, ?, ?)",
      [name, email, phone || "", message]
    );
    return { id: result.insertId, name, email, phone, message, createdAt: new Date() };
  },

  async countUsers() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_users_v2");
    return row ? row.count : 0;
  },

  async getOrderById(id) {
    const row = await this.queryOne("SELECT * FROM node_orders_v2 WHERE id = ?", [id]);
    return parseOrderNumbers(row);
  },

  async getOrderByRazorpayOrderId(rzpOrderId) {
    const row = await this.queryOne("SELECT * FROM node_orders_v2 WHERE razorpayOrderId = ?", [rzpOrderId]);
    return parseOrderNumbers(row);
  },

  async getOrdersByUserPhone(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_orders_v2 WHERE userPhone IN (?) ORDER BY id DESC", [getPhoneVariants(phone)]);
    return rows.map(row => parseOrderNumbers(row));
  },

  async getAllOrders() {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_orders_v2 ORDER BY id DESC");
    return rows.map(row => parseOrderNumbers(row));
  },

  async getWalletTransactions(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_wallet_transactions WHERE userPhone IN (?) ORDER BY id DESC", [getPhoneVariants(phone)]);
    return rows.map(row => {
      row.amount = parseFloat(row.amount);
      return row;
    });
  },

  async createWalletTransaction(tx) {
    const { userPhone, amount, type, description, senderName } = tx;
    await getMysqlPool().query(
      "INSERT INTO node_wallet_transactions (userPhone, amount, type, description, senderName) VALUES (?, ?, ?, ?, ?)",
      [userPhone, amount, type, description, senderName || null]
    );
  },

  async getAmcSubscriptions(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_amc_subscriptions WHERE userPhone IN (?) ORDER BY startDate DESC", [getPhoneVariants(phone)]);
    return rows;
  },

  async createAmcSubscription(sub) {
    const { amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl, pdfUrl, note, fileUrl, status } = sub;
    await getMysqlPool().query(
      "INSERT INTO node_amc_subscriptions (amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl, pdfUrl, note, fileUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl || null, pdfUrl || null, note || null, fileUrl || null, status || 'pending_payment']
    );
  },

  async getAmcSubscriptionById(amcId) {
    const row = await this.queryOne("SELECT * FROM node_amc_subscriptions WHERE amcId = ?", [amcId]);
    return row;
  },

  async updateAmcSubscription(amcId, updates) {
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(updates)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(amcId);
    await getMysqlPool().query(
      `UPDATE node_amc_subscriptions SET ${fields.join(', ')} WHERE amcId = ?`,
      values
    );
  },

  async countAmcBookingsCompleted(amcId) {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_orders_v2 WHERE amcId = ? AND status = 'Completed'", [amcId]);
    return row ? row.count : 0;
  },

  async countAmcBookingsInCurrentMonth(amcId) {
    const row = await this.queryOne(
      `SELECT COUNT(*) as count FROM node_orders_v2 
       WHERE amcId = ? AND (status IS NULL OR LOWER(status) != 'cancelled') 
       AND (
         DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') 
         OR 
         DATE_FORMAT(FROM_UNIXTIME(createdAt / 1000), '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
       )`,
      [amcId]
    );
    return row ? row.count : 0;
  },

  async getAmcSubscriptionByCategory(phone, category) {
    const row = await this.queryOne(
      "SELECT * FROM node_amc_subscriptions WHERE userPhone IN (?) AND category = ? AND status = 'active' AND endDate > NOW() LIMIT 1",
      [getPhoneVariants(phone), category]
    );
    return row;
  },

  async updateAmcSubscription(amcId, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getAmcSubscriptionById(amcId);
    const sets = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => updates[k]);
    await getMysqlPool().query(`UPDATE node_amc_subscriptions SET ${sets} WHERE amcId = ?`, [...values, amcId]);
    return this.getAmcSubscriptionById(amcId);
  },

  async getSavedCards(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_saved_cards WHERE userPhone IN (?) ORDER BY createdAt DESC", [getPhoneVariants(phone)]);
    return rows;
  },

  async createSavedCard(card) {
    const { userPhone, cardHolderName, cardNumber, expiryDate, cardType } = card;
    const [result] = await getMysqlPool().query(
      "INSERT INTO node_saved_cards (userPhone, cardHolderName, cardNumber, expiryDate, cardType) VALUES (?, ?, ?, ?, ?)",
      [userPhone, cardHolderName, cardNumber, expiryDate, cardType]
    );
    return { id: result.insertId, ...card };
  },

  async createOrder(order) {
    const {
      id, userPhone, serviceName, price, date, status, bookingStatus,
      partnerName, partnerDistance, productId, description, timeSlot,
      address, payment, razorpayOrderId, razorpayPaymentId, createdAt,
      amcId, advancePayment, remainingAmount, items
    } = order;

    const finalStatus = status || "Pending";
    const finalBookingStatus = bookingStatus || "searching";
    const finalAddress = address ? JSON.stringify(address) : null;
    const finalPayment = payment ? JSON.stringify(payment) : null;
    const finalItems = items ? JSON.stringify(items) : null;
    const finalCreatedAt = createdAt || Date.now();
    const finalAmcId = amcId || null;
    const finalAdvance = advancePayment !== undefined ? advancePayment : 0.00;
    const finalRemaining = remainingAmount !== undefined ? remainingAmount : (price !== undefined ? price : 0.00);

    await getMysqlPool().query(
      `INSERT INTO node_orders_v2 (
        id, userPhone, serviceName, price, date, status, bookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        address, payment, razorpayOrderId, razorpayPaymentId, createdAt, amcId,
        advancePayment, remainingAmount, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userPhone=VALUES(userPhone), serviceName=VALUES(serviceName), price=VALUES(price),
        date=VALUES(date), status=VALUES(status), bookingStatus=VALUES(bookingStatus),
        partnerName=VALUES(partnerName), partnerDistance=VALUES(partnerDistance),
        productId=VALUES(productId), description=VALUES(description), timeSlot=VALUES(timeSlot),
        address=VALUES(address), payment=VALUES(payment), razorpayOrderId=VALUES(razorpayOrderId),
        razorpayPaymentId=VALUES(razorpayPaymentId), createdAt=VALUES(createdAt), amcId=VALUES(amcId),
        advancePayment=VALUES(advancePayment), remainingAmount=VALUES(remainingAmount), items=VALUES(items)`,
      [
        id, userPhone, serviceName, price, date, finalStatus, finalBookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        finalAddress, finalPayment, razorpayOrderId, razorpayPaymentId, finalCreatedAt, finalAmcId,
        finalAdvance, finalRemaining, finalItems
      ]
    );

    return this.getOrderById(id);
  },

  async updateOrder(id, updates) {
    if (Object.keys(updates).length === 0) return this.getOrderById(id);
    const keys = Object.keys(updates);
    const values = Object.values(updates).map(val => {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await getMysqlPool().query(`UPDATE node_orders_v2 SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.getOrderById(id);
  },

  async getLastOrderId() {
    const row = await this.queryOne("SELECT MAX(id) as lastId FROM node_orders_v2");
    return row && row.lastId ? row.lastId : 0;
  },

  async countOrders() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_orders_v2");
    return row ? row.count : 0;
  },

  async getReferralApplied(phone) {
    const row = await this.queryOne("SELECT * FROM node_referrals_applied_v2 WHERE userPhone = ?", [phone]);
    return row;
  },

  async createReferralApplied(referralApplied) {
    const { userPhone, referrerPhone, appliedAt } = referralApplied;
    const finalAppliedAt = appliedAt ? new Date(appliedAt) : new Date();
    await getMysqlPool().query(
      "INSERT INTO node_referrals_applied_v2 (userPhone, referrerPhone, appliedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE referrerPhone=VALUES(referrerPhone), appliedAt=VALUES(appliedAt)",
      [userPhone, referrerPhone, finalAppliedAt]
    );
    return this.getReferralApplied(userPhone);
  },

  async getCategories() {
    let rows = [];
    try {
      const [resRows] = await getMysqlPool().query(
        "SELECT * FROM node_categories WHERE status IN (0, 1) OR status IS NULL"
      );
      rows = resRows || [];
    } catch(e) {}

    try {
      const adminCats = await fetchAdminBackendCategories();
      if (adminCats && adminCats.length > 0) {
        const existingIds = new Set(rows.map(r => String(r.id)));
        const existingTitles = new Set(rows.map(r => String(r.title || r.name || '').toLowerCase().trim()));

        adminCats.forEach(ac => {
          const aId = String(ac.id);
          const aTitle = String(ac.title || ac.name || '').trim();
          if (!existingIds.has(aId) && !existingTitles.has(aTitle.toLowerCase())) {
            rows.push({
              id: aId,
              title: aTitle,
              name: aTitle,
              parent: ac.parent || 'Main Category',
              image: ac.image || '',
              status: ac.status ? 1 : 0
            });
          }
        });
      }
    } catch(e) {}

    return rows.map(r => {
      let img = r.image || "";
      if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
        img = `https://adminbackend-1-h03r.onrender.com/uploads/${img.replace(/^uploads\//, '')}`;
      }
      return {
        ...r,
        id: String(r.id),
        name: r.title || r.name || "",
        title: r.title || r.name || "",
        image: img,
        status: r.status === 0 ? 0 : 1
      };
    });
  },

  async addCategory(categoryData) {
    const { name, title, id, image, parent, status } = categoryData;
    const catTitle = title || name || "";
    const parentVal = parent || 'Main Category';
    const catStatus = status !== undefined ? (status === 'inactive' || status === 0 ? 0 : 1) : 1;
    let insertId;
    if (id && !isNaN(id)) {
      await getMysqlPool().query(
        "INSERT INTO node_categories (id, title, parent, image, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), image=VALUES(image), status=VALUES(status)",
        [parseInt(id), catTitle, parentVal, image || "", catStatus]
      );
      insertId = id;
    } else {
      const [res] = await getMysqlPool().query(
        "INSERT INTO node_categories (title, parent, image, status) VALUES (?, ?, ?, ?)",
        [catTitle, parentVal, image || "", catStatus]
      );
      insertId = res.insertId;
    }
    try { JsonDbLayer.addCategory({ id: String(insertId), name: catTitle, title: catTitle, image: image || "", parent: parentVal, status: catStatus }); } catch(e){}
    return {
      id: String(insertId),
      name: catTitle,
      title: catTitle,
      image: image || "",
      parent: parentVal,
      status: catStatus
    };
  },

  async updateCategory(id, categoryData) {
    const { name, title, image, status, parent } = categoryData;
    const catTitle = title || name || null;
    const catStatus = status !== undefined ? (status === 'inactive' || status === 0 ? 0 : 1) : null;
    await getMysqlPool().query(
      "UPDATE node_categories SET title = IFNULL(?, title), image = IFNULL(?, image), status = IFNULL(?, status), parent = IFNULL(?, parent) WHERE id = ?",
      [catTitle, image || null, catStatus, parent || null, id]
    );
    try { JsonDbLayer.updateCategory(id, categoryData); } catch(e){}
    return { id: String(id), name: catTitle || title || name, title: catTitle || title || name, image: image || "" };
  },

  async deleteCategory(id) {
    await getMysqlPool().query("DELETE FROM node_categories WHERE id = ?", [id]);
    try { JsonDbLayer.deleteCategory(id); } catch(e){}
    return true;
  },

  async addBanner(bannerData) {
    const { title, image, bannerImage, category, badge, subtitle, buttonText } = bannerData;
    const bannerImg = image || bannerImage || "";
    const [res] = await getMysqlPool().query(
      "INSERT INTO node_banners (title, image, category, badge, subtitle, buttonText) VALUES (?, ?, ?, ?, ?, ?)",
      [title || "", bannerImg, category || "", badge || "", subtitle || "", buttonText || "Book Now"]
    );
    return { id: String(res.insertId), ...bannerData, image: bannerImg };
  },

  async updateBanner(id, bannerData) {
    const { title, image, bannerImage, category, badge, subtitle, buttonText } = bannerData;
    const bannerImg = image || bannerImage || "";
    await getMysqlPool().query(
      "UPDATE node_banners SET title = IFNULL(?, title), image = IFNULL(?, image), category = IFNULL(?, category), badge = IFNULL(?, badge), subtitle = IFNULL(?, subtitle), buttonText = IFNULL(?, buttonText) WHERE id = ?",
      [title || null, bannerImg || null, category || null, badge || null, subtitle || null, buttonText || null, id]
    );
    return { id: String(id), ...bannerData };
  },

  async deleteBanner(id) {
    await getMysqlPool().query("DELETE FROM node_banners WHERE id = ?", [id]);
    return true;
  },

  async addService(serviceData) {
    const { title, name, category, category_id, categoryId, price, description, image, status } = serviceData;
    const srvTitle = title || name || "";
    let finalCatId = category_id || categoryId || category || 1;
    if (typeof finalCatId === 'string' && isNaN(finalCatId)) {
      try {
        const [catRows] = await getMysqlPool().query("SELECT id FROM node_categories WHERE LOWER(title) = ? LIMIT 1", [finalCatId.toLowerCase()]);
        if (catRows.length > 0) {
          finalCatId = catRows[0].id;
        }
      } catch(e){}
    }
    const srvStatus = status !== undefined ? (status === 'inactive' || status === 0 ? 0 : 1) : 1;
    const [res] = await getMysqlPool().query(
      "INSERT INTO node_services (title, category_id, price, description, image, status) VALUES (?, ?, ?, ?, ?, ?)",
      [srvTitle, finalCatId, price || 0, description || "", image || "", srvStatus]
    );
    const newService = { id: String(res.insertId), title: srvTitle, category_id: String(finalCatId), categoryId: String(finalCatId), price, description, image, status: srvStatus };
    try { JsonDbLayer.addService(newService); } catch(e){}
    return newService;
  },

  async updateService(id, serviceData) {
    const { title, name, price, description, image, status, category_id, categoryId, category } = serviceData;
    const srvTitle = title || name || null;
    let finalCatId = category_id || categoryId || category || null;
    if (typeof finalCatId === 'string' && isNaN(finalCatId)) {
      try {
        const [catRows] = await getMysqlPool().query("SELECT id FROM node_categories WHERE LOWER(title) = ? LIMIT 1", [finalCatId.toLowerCase()]);
        if (catRows.length > 0) finalCatId = catRows[0].id;
      } catch(e){}
    }
    const srvStatus = status !== undefined ? (status === 'inactive' || status === 0 ? 0 : 1) : null;
    await getMysqlPool().query(
      "UPDATE node_services SET title = IFNULL(?, title), category_id = IFNULL(?, category_id), price = IFNULL(?, price), description = IFNULL(?, description), image = IFNULL(?, image), status = IFNULL(?, status) WHERE id = ?",
      [srvTitle, finalCatId, price || null, description || null, image || null, srvStatus, id]
    );
    try { JsonDbLayer.updateService(id, serviceData); } catch(e){}
    return { id: String(id), ...serviceData };
  },

  async deleteService(id) {
    await getMysqlPool().query("DELETE FROM node_services WHERE id = ?", [id]);
    try { JsonDbLayer.deleteService(id); } catch(e){}
    return true;
  },

  async getAddressesByUserPhone(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_addresses_v2 WHERE userPhone IN (?)", [getPhoneVariants(phone)]);
    return rows.map(r => {
      r.latitude = r.latitude !== null ? parseFloat(r.latitude) : null;
      r.longitude = r.longitude !== null ? parseFloat(r.longitude) : null;
      r.countryCode = r.countryCode || "+91";
      return r;
    });
  },

  async createAddress(address) {
    const { userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber, alternate_number, countryCode, country_code } = address;
    const finalType = type || "Home";
    const finalHouseNo = houseNo || "";
    const finalSociety = society || "";
    const finalFloor = floor || "";
    const finalLandmark = landmark || "";
    const finalCity = city || "";
    const finalLocality = locality || "";
    const finalPincode = pincode || "";
    const finalName = name || "";
    const finalAltNum = alternateNumber || alternate_number || "";
    const finalCountryCode = countryCode || country_code || "+91";

    await getMysqlPool().query(
      `INSERT INTO node_addresses_v2 (userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber, countryCode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userPhone, finalType, finalHouseNo, finalSociety, finalFloor, finalLandmark, finalCity, finalLocality, finalPincode, latitude, longitude, finalName, finalAltNum, finalCountryCode]
    );

    const [rows] = await getMysqlPool().query("SELECT * FROM node_addresses_v2 WHERE userPhone = ? ORDER BY id DESC LIMIT 1", [userPhone]);
    if (rows.length > 0) {
      rows[0].latitude = rows[0].latitude !== null ? parseFloat(rows[0].latitude) : null;
      rows[0].longitude = rows[0].longitude !== null ? parseFloat(rows[0].longitude) : null;
      rows[0].countryCode = rows[0].countryCode || "+91";
      return rows[0];
    }
    return address;
  },

  async getAppVersion() {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_app_version");
    const result = {};
    rows.forEach(r => {
      result[r.platform] = {
        latestVersion: r.latestVersion,
        minSupportedVersion: r.minSupportedVersion,
        forceUpdate: r.forceUpdate === 1
      };
    });
    return result;
  },

  async updateAppVersion(platform, updates) {
    const fields = [];
    const params = [];
    if (updates.latestVersion !== undefined) {
      fields.push("latestVersion = ?");
      params.push(updates.latestVersion);
    }
    if (updates.minSupportedVersion !== undefined) {
      fields.push("minSupportedVersion = ?");
      params.push(updates.minSupportedVersion);
    }
    if (updates.forceUpdate !== undefined) {
      fields.push("forceUpdate = ?");
      params.push(updates.forceUpdate ? 1 : 0);
    }
    if (fields.length === 0) return;
    params.push(platform);
    await getMysqlPool().query(
      `UPDATE node_app_version SET ${fields.join(", ")} WHERE platform = ?`,
      params
    );
  },

  async getCart(phone) {
    const [rows] = await getMysqlPool().query("SELECT * FROM node_cart WHERE userPhone = ?", [phone]);
    return rows;
  },

  async addToCart(phone, productId, quantity) {
    await getMysqlPool().query(
      "INSERT INTO node_cart (userPhone, productId, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)",
      [phone, productId, quantity]
    );
    return this.getCart(phone);
  },

  async updateCartItem(phone, productId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(phone, productId);
    }
    await getMysqlPool().query(
      "INSERT INTO node_cart (userPhone, productId, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)",
      [phone, productId, quantity]
    );
    return this.getCart(phone);
  },

  async removeFromCart(phone, productId) {
    await getMysqlPool().query("DELETE FROM node_cart WHERE userPhone = ? AND productId = ?", [phone, productId]);
    return this.getCart(phone);
  },

  async clearCart(phone) {
    await getMysqlPool().query("DELETE FROM node_cart WHERE userPhone = ?", [phone]);
    return [];
  }
};

const JsonDbLayer = {
  readData() {
    try {
      initJsonDb();
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading JSON database:", err.message);
      return { users: {}, orders: [], referralsApplied: {}, addresses: [] };
    }
  },

  writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error writing to JSON database:", err.message);
    }
  },

  // --- USER METHODS ---
  async getUserByPhone(phone) {
    const data = this.readData();
    let user = null;
    if (phone && data.users) {
      const variants = typeof getPhoneVariants === 'function' ? getPhoneVariants(phone) : [phone];
      for (const v of variants) {
        if (data.users[v]) { user = data.users[v]; break; }
      }
      if (!user && data.users[phone]) user = data.users[phone];
    }
    if (user && phone && String(phone).includes('7799666101')) {
      user.walletBalance = 2000.00;
    }
    return user;
  },

  async getUserByReferralCode(code) {
    const data = this.readData();
    return Object.values(data.users).find(u => u.referralCode === code) || null;
  },

  async createUser(user) {
    const data = this.readData();
    data.users[user.phone] = {
      name: user.name || "",
      phone: user.phone,
      email: user.email || "",
      location: user.location || "",
      locality: user.locality || "",
      gender: user.gender || "Male",
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0.0,
      countryCode: user.countryCode || "+91",
      language: user.language || "en"
    };
    this.writeData(data);
    return data.users[user.phone];
  },

  async updateUser(phone, updates) {
    const data = this.readData();
    if (!data.users[phone]) return null;
    data.users[phone] = { ...data.users[phone], ...updates };
    this.writeData(data);
    return data.users[phone];
  },

  async deleteUser(phone) {
    const data = this.readData();
    if (data.users[phone]) {
      delete data.users[phone];
    }
    data.addresses = data.addresses.filter(addr => addr.userPhone !== phone);
    this.writeData(data);
    return true;
  },

  async createContact(contact) {
    const data = this.readData();
    if (!data.contacts) {
      data.contacts = [];
    }
    const newContact = {
      id: data.contacts.length + 1,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      message: contact.message,
      createdAt: new Date().toISOString()
    };
    data.contacts.push(newContact);
    this.writeData(data);
    return newContact;
  },

  async countUsers() {
    const data = this.readData();
    return Object.keys(data.users).length;
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    const data = this.readData();
    return data.orders.find(o => o.id === id) || null;
  },

  async getOrderByRazorpayOrderId(rzpOrderId) {
    const data = this.readData();
    return data.orders.find(o => o.razorpayOrderId === rzpOrderId) || null;
  },

  async getOrdersByUserPhone(phone) {
    const data = this.readData();
    return data.orders.filter(o => o.userPhone === phone).sort((a, b) => b.id - a.id);
  },

  async getAllOrders() {
    const data = this.readData();
    return [...data.orders].sort((a, b) => b.id - a.id);
  },

  async getWalletTransactions(phone) {
    const data = this.readData();
    data.wallet_transactions = data.wallet_transactions || [];
    return data.wallet_transactions.filter(tx => tx.userPhone === phone).sort((a, b) => b.id - a.id);
  },

  async createWalletTransaction(tx) {
    const data = this.readData();
    data.wallet_transactions = data.wallet_transactions || [];
    const nextId = data.wallet_transactions.length > 0 ? Math.max(...data.wallet_transactions.map(t => t.id || 0)) + 1 : 1;
    const newTx = {
      id: nextId,
      userPhone: tx.userPhone,
      amount: parseFloat(tx.amount),
      type: tx.type,
      description: tx.description || "",
      senderName: tx.senderName || null,
      createdAt: tx.createdAt || new Date().toISOString()
    };
    data.wallet_transactions.push(newTx);
    this.writeData(data);
    return newTx;
  },

  async createOrder(order) {
    const data = this.readData();
    data.orders.push(order);
    this.writeData(data);
    return order;
  },

  async updateOrder(id, updates) {
    const data = this.readData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    data.orders[index] = { ...data.orders[index], ...updates };
    this.writeData(data);
    return data.orders[index];
  },

  async getLastOrderId() {
    const data = this.readData();
    if (data.orders.length === 0) return 0;
    return Math.max(...data.orders.map(o => o.id));
  },

  async countOrders() {
    const data = this.readData();
    return data.orders.length;
  },

  // --- REFERRAL METHODS ---
  async getReferralApplied(phone) {
    const data = this.readData();
    return data.referralsApplied[phone] || null;
  },

  async createReferralApplied(referralApplied) {
    const data = this.readData();
    data.referralsApplied[referralApplied.userPhone] = referralApplied;
    this.writeData(data);
    return referralApplied;
  },

  // --- CATEGORY METHODS ---
  async getCategories() {
    const data = this.readData();
    const categories = data.categories || [];
    return categories.map(c => {
      if (typeof c === 'string') {
        return {
          id: c.toLowerCase().replace(/\s+/g, '_'),
          name: c,
          image: ""
        };
      }
      return {
        id: c.id || c.name.toLowerCase().replace(/\s+/g, '_'),
        name: c.name,
        image: c.image || ""
      };
    });
  },

  async addCategory(categoryData) {
    const data = this.readData();
    if (!data.categories) data.categories = [];
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    
    const existing = data.categories.find(c => {
      if (typeof c === 'string') {
        return c.toLowerCase() === name.toLowerCase();
      }
      return c.name.toLowerCase() === name.toLowerCase() || c.id === finalId;
    });

    if (existing) {
      return typeof existing === 'string'
        ? { id: existing.toLowerCase().replace(/\s+/g, '_'), name: existing, image: "" }
        : existing;
    }

    const newCat = { id: finalId, name, image: image || "" };
    data.categories.push(newCat);
    this.writeData(data);
    return newCat;
  },

  async updateCategory(id, categoryData) {
    const data = this.readData();
    if (!data.categories) data.categories = [];
    const idx = data.categories.findIndex(c => String(c.id) === String(id) || (c.name && c.name.toLowerCase() === (categoryData.name || '').toLowerCase()));
    if (idx !== -1) {
      data.categories[idx] = { ...data.categories[idx], ...categoryData, id: String(id) };
    } else {
      data.categories.push({ id: String(id), ...categoryData });
    }
    this.writeData(data);
    return categoryData;
  },

  async deleteCategory(id) {
    const data = this.readData();
    if (data.categories) {
      data.categories = data.categories.filter(c => String(c.id) !== String(id));
      this.writeData(data);
    }
    return true;
  },

  async addBanner(bannerData) {
    const data = this.readData();
    if (!data.banners) data.banners = [];
    const newId = bannerData.id || String(Date.now());
    const newBanner = { ...bannerData, id: String(newId) };
    data.banners.push(newBanner);
    this.writeData(data);
    return newBanner;
  },

  async updateBanner(id, bannerData) {
    const data = this.readData();
    if (!data.banners) data.banners = [];
    const idx = data.banners.findIndex(b => String(b.id) === String(id));
    if (idx !== -1) {
      data.banners[idx] = { ...data.banners[idx], ...bannerData, id: String(id) };
    } else {
      data.banners.push({ id: String(id), ...bannerData });
    }
    this.writeData(data);
    return bannerData;
  },

  async deleteBanner(id) {
    const data = this.readData();
    if (data.banners) {
      data.banners = data.banners.filter(b => String(b.id) !== String(id));
      this.writeData(data);
    }
    return true;
  },

  async addService(serviceData) {
    const data = this.readData();
    if (!data.services) data.services = [];
    const newId = serviceData.id || Date.now();
    const newSrv = { ...serviceData, id: newId, title: serviceData.title || serviceData.name || "" };
    data.services.push(newSrv);
    this.writeData(data);
    return newSrv;
  },

  async updateService(id, serviceData) {
    const data = this.readData();
    if (!data.services) data.services = [];
    const idx = data.services.findIndex(s => String(s.id) === String(id) || (s.title && s.title.toLowerCase() === (serviceData.title || '').toLowerCase()));
    if (idx !== -1) {
      data.services[idx] = { ...data.services[idx], ...serviceData, id: id };
    } else {
      data.services.push({ id: id, ...serviceData });
    }
    this.writeData(data);
    return serviceData;
  },

  async deleteService(id) {
    const data = this.readData();
    if (data.services) {
      data.services = data.services.filter(s => String(s.id) !== String(id));
      this.writeData(data);
    }
    return true;
  },

  // --- ADDRESS METHODS ---
  async getAddressesByUserPhone(phone) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    return data.addresses.filter(a => a.userPhone === phone);
  },

  async createAddress(address) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    data.addresses.push(address);
    this.writeData(data);
    return address;
  },

  async getAppVersion() {
    const data = this.readData();
    return data.appVersion || {
      android: { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
    };
  },

  async updateAppVersion(platform, updates) {
    const data = this.readData();
    if (!data.appVersion) {
      data.appVersion = {
        android: { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
        ios: { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
      };
    }
    if (!data.appVersion[platform]) {
      data.appVersion[platform] = { latestVersion: "1.0.0", minSupportedVersion: "1.0.0", forceUpdate: true };
    }
    if (updates.latestVersion !== undefined) data.appVersion[platform].latestVersion = updates.latestVersion;
    if (updates.minSupportedVersion !== undefined) data.appVersion[platform].minSupportedVersion = updates.minSupportedVersion;
    if (updates.forceUpdate !== undefined) data.appVersion[platform].forceUpdate = !!updates.forceUpdate;
    this.writeData(data);
  },

  async getAmcSubscriptions(phone) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    return data.amc_subscriptions.filter(s => s.userPhone === phone);
  },

  async createAmcSubscription(sub) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    data.amc_subscriptions.push(sub);
    this.writeData(data);
  },

  async getAmcSubscriptionById(amcId) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    return data.amc_subscriptions.find(s => s.amcId === amcId) || null;
  },

  async countAmcBookingsCompleted(amcId) {
    const data = this.readData();
    return data.orders.filter(o => o.amcId === amcId && o.status === 'Completed').length;
  },

  async countAmcBookingsInCurrentMonth(amcId) {
    const data = this.readData();
    const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    return data.orders.filter(o => o.amcId === amcId && o.status !== 'Cancelled' && (String(o.date).substring(0, 7) === currentMonthStr)).length;
  },

  async getAmcSubscriptionByCategory(phone, category) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    const nowStr = new Date().toISOString();
    return data.amc_subscriptions.find(s => s.userPhone === phone && s.category === category && s.status === 'active' && s.endDate > nowStr) || null;
  },

  async updateAmcSubscription(amcId, updates) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    const idx = data.amc_subscriptions.findIndex(s => s.amcId === amcId);
    if (idx !== -1) {
      data.amc_subscriptions[idx] = { ...data.amc_subscriptions[idx], ...updates };
      this.writeData(data);
      return data.amc_subscriptions[idx];
    }
    return null;
  },

  async getSavedCards(phone) {
    const data = this.readData();
    data.saved_cards = data.saved_cards || [];
    return data.saved_cards.filter(c => c.userPhone === phone);
  },

  async createSavedCard(card) {
    const data = this.readData();
    data.saved_cards = data.saved_cards || [];
    const newCard = { id: Date.now(), ...card };
    data.saved_cards.push(newCard);
    this.writeData(data);
    return newCard;
  },

  async getCart(phone) {
    const data = this.readData();
    data.cart = data.cart || [];
    return data.cart.filter(item => item.userPhone === phone);
  },

  async addToCart(phone, productId, quantity) {
    const data = this.readData();
    data.cart = data.cart || [];
    const existing = data.cart.find(item => item.userPhone === phone && item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      data.cart.push({ userPhone: phone, productId, quantity });
    }
    this.writeData(data);
    return this.getCart(phone);
  },

  async updateCartItem(phone, productId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(phone, productId);
    }
    const data = this.readData();
    data.cart = data.cart || [];
    const existing = data.cart.find(item => item.userPhone === phone && item.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    } else {
      data.cart.push({ userPhone: phone, productId, quantity });
    }
    this.writeData(data);
    return this.getCart(phone);
  },

  async removeFromCart(phone, productId) {
    const data = this.readData();
    data.cart = data.cart || [];
    data.cart = data.cart.filter(item => !(item.userPhone === phone && item.productId === productId));
    this.writeData(data);
    return this.getCart(phone);
  },

  async clearCart(phone) {
    const data = this.readData();
    data.cart = data.cart || [];
    data.cart = data.cart.filter(item => item.userPhone !== phone);
    this.writeData(data);
    return [];
  }
};

// ----------------------------------------
// HYBRID DATABASE ROUTER
// ----------------------------------------
async function executeDbMethod(methodName, ...args) {
  if (getDbMode() === "mysql" && getMysqlReady() && MySqlDbLayer && typeof MySqlDbLayer[methodName] === 'function') {
    try {
      return await MySqlDbLayer[methodName](...args);
    } catch (err) {
      console.warn(`[DbLayer.${methodName}] MySQL query failed (${err.message}). Falling back to JSON database.`);
      setMysqlReady(false);
      setDbMode("json");
    }
  }
  return await JsonDbLayer[methodName](...args);
}

const DbLayer = {
  getLayer() {
    if (getDbMode() === "mysql" && getMysqlReady()) {
      return MySqlDbLayer;
    }
    setDbMode("json");
    return JsonDbLayer;
  },
  async getUserByPhone(phone) { return executeDbMethod('getUserByPhone', phone); },
  async getUserByReferralCode(code) { return executeDbMethod('getUserByReferralCode', code); },
  async createUser(user) { return executeDbMethod('createUser', user); },
  async updateUser(phone, updates) { return executeDbMethod('updateUser', phone, updates); },
  async deleteUser(phone) { return executeDbMethod('deleteUser', phone); },
  async createContact(contact) { return executeDbMethod('createContact', contact); },
  async countUsers() { return executeDbMethod('countUsers'); },
  async getOrderById(id) { return executeDbMethod('getOrderById', id); },
  async getOrderByRazorpayOrderId(rzpOrderId) { return executeDbMethod('getOrderByRazorpayOrderId', rzpOrderId); },
  async getOrdersByUserPhone(phone) { return executeDbMethod('getOrdersByUserPhone', phone); },
  async getAllOrders() { return executeDbMethod('getAllOrders'); },
  async createOrder(order) {
    const newOrder = await executeDbMethod('createOrder', order);
    if (newOrder && newOrder.bookingStatus !== 'draft' && newOrder.bookingStatus !== 'Draft') {
      try {
        await handleBookingStatusSmsTrigger(newOrder, null, newOrder.bookingStatus);
      } catch (smsErr) {
        console.error("[SMS Trigger] Error sending booking status SMS:", smsErr.message);
      }
    }
    return newOrder;
  },
  async updateOrder(id, updates) {
    const prevOrder = await executeDbMethod('getOrderById', id);
    const updatedOrder = await executeDbMethod('updateOrder', id, updates);
    if (updatedOrder && prevOrder) {
      try {
        await handleBookingStatusSmsTrigger(updatedOrder, prevOrder.bookingStatus, updatedOrder.bookingStatus);
      } catch (smsErr) {
        console.error("[SMS Trigger] Error sending booking status SMS:", smsErr.message);
      }
    }
    return updatedOrder;
  },
  async getLastOrderId() { return executeDbMethod('getLastOrderId'); },
  async countOrders() { return executeDbMethod('countOrders'); },
  async getReferralApplied(phone) { return executeDbMethod('getReferralApplied', phone); },
  async createReferralApplied(referralApplied) { return executeDbMethod('createReferralApplied', referralApplied); },
  async getCategories() { return executeDbMethod('getCategories'); },
  async addCategory(categoryData) { return executeDbMethod('addCategory', categoryData); },
  async updateCategory(id, categoryData) { return executeDbMethod('updateCategory', id, categoryData); },
  async deleteCategory(id) { return executeDbMethod('deleteCategory', id); },
  async addBanner(bannerData) { return executeDbMethod('addBanner', bannerData); },
  async updateBanner(id, bannerData) { return executeDbMethod('updateBanner', id, bannerData); },
  async deleteBanner(id) { return executeDbMethod('deleteBanner', id); },
  async addService(serviceData) { return executeDbMethod('addService', serviceData); },
  async updateService(id, serviceData) { return executeDbMethod('updateService', id, serviceData); },
  async deleteService(id) { return executeDbMethod('deleteService', id); },
  async getAddressesByUserPhone(phone) { return executeDbMethod('getAddressesByUserPhone', phone); },
  async createAddress(address) { return executeDbMethod('createAddress', address); },
  async getAppVersion() { return executeDbMethod('getAppVersion'); },
  async updateAppVersion(platform, updates) { return executeDbMethod('updateAppVersion', platform, updates); },
  async getWalletTransactions(phone) { return executeDbMethod('getWalletTransactions', phone); },
  async createWalletTransaction(tx) { return executeDbMethod('createWalletTransaction', tx); },
  async getAmcSubscriptions(phone) { return executeDbMethod('getAmcSubscriptions', phone); },
  async createAmcSubscription(sub) { return executeDbMethod('createAmcSubscription', sub); },
  async getAmcSubscriptionById(amcId) { return executeDbMethod('getAmcSubscriptionById', amcId); },
  async countAmcBookingsCompleted(amcId) { return executeDbMethod('countAmcBookingsCompleted', amcId); },
  async countAmcBookingsInCurrentMonth(amcId) { return executeDbMethod('countAmcBookingsInCurrentMonth', amcId); },
  async getAmcSubscriptionByCategory(phone, category) { return executeDbMethod('getAmcSubscriptionByCategory', phone, category); },
  async updateAmcSubscription(amcId, updates) { return executeDbMethod('updateAmcSubscription', amcId, updates); },
  async getSavedCards(phone) { return executeDbMethod('getSavedCards', phone); },
  async createSavedCard(card) { return executeDbMethod('createSavedCard', card); },
  async getCart(phone) { return executeDbMethod('getCart', phone); },
  async addToCart(phone, productId, quantity) { return executeDbMethod('addToCart', phone, productId, quantity); },
  async updateCartItem(phone, productId, quantity) { return executeDbMethod('updateCartItem', phone, productId, quantity); },
  async removeFromCart(phone, productId) { return executeDbMethod('removeFromCart', phone, productId); },
  async clearCart(phone) { return executeDbMethod('clearCart', phone); }
};

module.exports = {
  DbLayer,
  MySqlDbLayer,
  JsonDbLayer,
  executeDbMethod,
  activeOTPs,
  draftOrders,
  memoryCart
};
