const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_jwt_key_123';
const { Translation } = require('../models/Translation');

module.exports = async (req, res, next) => {
  try {
    // 1. Check if lang is present in query, body, headers
    let lang = req.query.lang || req.query.language ||
               (req.body && (req.body.lang || req.body.language)) ||
               req.headers['lang'] || req.headers['language'] ||
               req.headers['accept-language'];

    // Extract first language code if comma-separated or containing locale
    lang = String(lang).split(',')[0].split('-')[0].trim().toLowerCase();

    const supportedLanguages = ['en', 'hi', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'pa', 'or', 'as'];
    
    // 2. Check full raw URL string for supported languages (in case URL was formatted like ?status=?lang=hi or ?status=&lang=hi)
    const fullUrl = (req.originalUrl || req.url || '');
    if (!lang || lang === 'en') {
      for (const sl of supportedLanguages) {
        if (sl !== 'en') {
          const regex = new RegExp(`[\\?&=]lang=${sl}\\b|[\\?&=]language=${sl}\\b|lang=${sl}`, 'i');
          if (regex.test(fullUrl)) {
            lang = sl;
            break;
          }
        }
      }
    }

    // 3. Fallback to token/user stored language if authorization header is set
    if ((!lang || lang === 'en') && req.headers['authorization'] && req.path && req.path.startsWith('/api')) {
      const authHeader = req.headers['authorization'];
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        let phone = null;
        if (/^\d{10}$/.test(token)) {
          phone = token;
        } else {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            phone = decoded.phone;
          } catch (err) {
            // Ignore invalid token
          }
        }

        if (phone) {
          const storedLang = await Translation.getUserLanguage(phone);
          if (storedLang) {
            lang = storedLang;
          }
        }
      }
    }

    if (!lang || !supportedLanguages.includes(lang)) {
      lang = 'en';
    }

    req.lang = lang;
  } catch (err) {
    console.error("Error in language middleware:", err);
    req.lang = 'en';
  }
  next();
};
