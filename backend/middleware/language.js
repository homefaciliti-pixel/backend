const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_jwt_key_123';
const { Translation } = require('../models/Translation');

module.exports = async (req, res, next) => {
  try {
    // Detect language from:
    // 1. lang / language query param (e.g. ?lang=hi or ?language=hi)
    // 2. lang / language body param (e.g. { "lang": "hi" } or { "language": "hi" })
    // 3. lang / language header (e.g. lang: hi or language: hi)
    // 4. Accept-Language header (e.g. Accept-Language: hi-IN,hi;q=0.9)
    let lang = req.query.lang || req.query.language ||
               (req.body && (req.body.lang || req.body.language)) ||
               req.headers['lang'] || req.headers['language'] ||
               req.headers['accept-language'];

    // 5. Fallback: If not explicitly provided, and we have an Authorization header, and this is an /api route,
    // fetch the user's language preference from the DB.
    if (!lang && req.headers['authorization'] && req.path && req.path.startsWith('/api')) {
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

    if (!lang) {
      lang = 'en';
    }

    // Extract first language code if comma-separated or containing locale
    lang = String(lang).split(',')[0].split('-')[0].trim().toLowerCase();

    const supportedLanguages = ['en', 'hi'];
    if (!supportedLanguages.includes(lang)) {
      lang = 'en';
    }

    req.lang = lang;
  } catch (err) {
    console.error("Error in language middleware:", err);
    req.lang = 'en';
  }
  next();
};
