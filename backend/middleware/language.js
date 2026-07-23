module.exports = (req, res, next) => {
  // Detect language from:
  // 1. lang query param (e.g. ?lang=hi)
  // 2. lang body param (e.g. { "lang": "hi" })
  // 3. lang header (e.g. lang: hi)
  // 4. Accept-Language header (e.g. Accept-Language: hi-IN,hi;q=0.9)
  let lang = req.query.lang || req.body.lang || req.headers['lang'] || req.headers['accept-language'] || 'en';

  if (lang) {
    // Extract first language code if comma-separated or containing locale
    lang = String(lang).split(',')[0].split('-')[0].trim().toLowerCase();
  }

  const supportedLanguages = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te'];
  if (!supportedLanguages.includes(lang)) {
    lang = 'en';
  }

  req.lang = lang;
  next();
};
