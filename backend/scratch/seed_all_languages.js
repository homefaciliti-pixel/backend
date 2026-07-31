const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { translate } = require('@vitalets/google-translate-api');

// Setup DB pool using env vars
const host = process.env.MYSQL_HOST || 'localhost';
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || 'home_services';
const port = process.env.MYSQL_PORT || 3306;

const pool = mysql.createPool({
  host, user, password, database, port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const { runContentI18nMigration, SUPPORTED_LANGS } = require('../helpers/contentI18n.js');
const { Translation } = require('../models/Translation.js');

const defaultTranslations = [
  { translation_key: "login_success", en: "Login successful" },
  { translation_key: "profile_updated", en: "Profile updated successfully" },
  { translation_key: "booking_success", en: "Booking placed successfully" },
  { translation_key: "booking_failed", en: "Booking failed" },
  { translation_key: "logout_success", en: "Logged out successfully" },
  { translation_key: "unauthorized", en: "Unauthorized" },
  { translation_key: "service_request", en: "Service request placed" },
  { translation_key: "account_deleted", en: "Account deleted successfully" },
  { translation_key: "otp_sent", en: "OTP sent successfully" },
  { translation_key: "invalid_otp", en: "Invalid OTP or OTP expired" },
  { translation_key: "address_saved", en: "Address saved successfully" },
  { translation_key: "addresses_retrieved", en: "Addresses retrieved successfully" },
  { translation_key: "checkout_success", en: "Checkout completed successfully and order placed" },
  { translation_key: "order_cancelled", en: "Order cancelled successfully" },
  { translation_key: "order_not_found", en: "Order not found" },
  { translation_key: "bookings_retrieved", en: "Bookings retrieved successfully" },
  { translation_key: "contact_sent", en: "Contact message sent successfully" },
  { translation_key: "service_details_retrieved", en: "Service details retrieved successfully" },
  { translation_key: "slots_retrieved", en: "Available booking time slots retrieved successfully" },
  { translation_key: "dates_retrieved", en: "Available booking dates retrieved successfully" },
  { translation_key: "booking_flow_retrieved", en: "Booking flow status retrieved successfully" },
  { translation_key: "booking_flow_updated", en: "Booking flow status updated successfully" },
  { translation_key: "wallet_retrieved", en: "Wallet transactions retrieved successfully" },
  { translation_key: "wallet_topup_success", en: "Wallet topped up successfully" },
  { translation_key: "internal_error", en: "Internal Server Error" },
  { translation_key: "language_updated", en: "Language preference updated successfully" }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeTranslate(text, to) {
  if (!text || text.trim() === '') return '';
  try {
    const res = await translate(text, { to });
    return res.text;
  } catch (err) {
    console.error(`[Translate Error] text="${text}", to="${to}":`, err.message);
    return text;
  }
}

async function seedLanguages() {
  console.log("Setting up DB...");
  const { setPool } = require('../models/Translation.js');
  setPool(pool);

  console.log("Altering translations table to add new columns if missing...");
  const addColumns = ['kn', 'ml', 'pa', 'or', 'as'];
  for (const col of addColumns) {
    try {
      const colName = col === 'or' || col === 'as' ? `\`${col}\`` : col;
      await pool.query(`ALTER TABLE translations ADD COLUMN ${colName} TEXT DEFAULT NULL`);
      console.log(`Added ${colName} to translations table.`);
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.error(e);
      }
    }
  }

  console.log("Running content i18n migration...");
  await runContentI18nMigration(pool);

  console.log("Translating system default translations...");
  for (const item of defaultTranslations) {
    const dbItem = await Translation.getByKey(item.translation_key);
    const updatePayload = { en: item.en };
    for (const lang of SUPPORTED_LANGS) {
      const colName = lang;
      if (!dbItem || !dbItem[colName]) {
        updatePayload[colName] = await safeTranslate(item.en, lang);
        await delay(500); 
      }
    }
    await Translation.upsert(item.translation_key, updatePayload);
  }

  console.log("Translating Categories...");
  const [categories] = await pool.query("SELECT id, name, title FROM node_categories");
  for (const cat of categories) {
    const baseText = cat.title || cat.name;
    if (!baseText) continue;
    
    const updates = {};
    for (const lang of SUPPORTED_LANGS) {
      const colTitle = `title_${lang}`;
      const colName = `name_${lang}`;
      
      const [[check]] = await pool.query(`SELECT ${colTitle}, ${colName} FROM node_categories WHERE id = ?`, [cat.id]);
      if (!check || (!check[colTitle] && !check[colName])) {
        const translated = await safeTranslate(baseText, lang);
        updates[colTitle] = translated;
        updates[colName] = translated;
        await delay(500);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      await pool.query(`UPDATE node_categories SET ${setClause} WHERE id = ?`, [...values, cat.id]);
      console.log(`Updated category ${cat.id} translations.`);
    }
  }

  console.log("Translating Services...");
  const [services] = await pool.query("SELECT id, title, description FROM node_services");
  for (const srv of services) {
    const updates = {};
    for (const lang of SUPPORTED_LANGS) {
      const colTitle = `title_${lang}`;
      const colDesc = `description_${lang}`;
      
      const [[check]] = await pool.query(`SELECT ${colTitle}, ${colDesc} FROM node_services WHERE id = ?`, [srv.id]);
      if (!check || !check[colTitle]) {
        if (srv.title) {
          updates[colTitle] = await safeTranslate(srv.title, lang);
          await delay(300);
        }
      }
      if (!check || !check[colDesc]) {
        if (srv.description) {
          updates[colDesc] = await safeTranslate(srv.description, lang);
          await delay(300);
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      await pool.query(`UPDATE node_services SET ${setClause} WHERE id = ?`, [...values, srv.id]);
      console.log(`Updated service ${srv.id} translations.`);
    }
  }

  console.log("All translations complete.");
  process.exit(0);
}

seedLanguages().catch(console.error);
