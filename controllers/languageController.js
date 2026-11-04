const { Translation } = require('../models/Translation');
const { reloadTranslationCache } = require('../helpers/translate');

const languageController = {
  // GET /api/language/:lang
  // Returns key-value pairs for translations in requested language
  async getTranslations(req, res) {
    const reqLang = String(req.params.lang || req.lang || 'en').toLowerCase().trim();
    const supportedLanguages = ['en', 'hi'];
    const activeLang = supportedLanguages.includes(reqLang) ? reqLang : 'en';

    try {
      const allRows = await Translation.getAll();
      const localizedTranslations = {};
      for (const row of allRows) {
        localizedTranslations[row.translation_key] = row[activeLang] || row['en'] || row.translation_key;
      }
      res.json(localizedTranslations);
    } catch (err) {
      console.error("Failed to fetch translations:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // POST /api/language/upsert
  // Upsert translation mapping and reload cache dynamically
  async upsertTranslation(req, res) {
    const { translation_key, en, hi, mr, gu, bn, ta, te } = req.body;
    if (!translation_key) {
      return res.status(400).json({ error: "translation_key is required" });
    }

    try {
      const data = {};
      if (en !== undefined) data.en = en;
      if (hi !== undefined) data.hi = hi;
      if (mr !== undefined) data.mr = mr;
      if (gu !== undefined) data.gu = gu;
      if (bn !== undefined) data.bn = bn;
      if (ta !== undefined) data.ta = ta;
      if (te !== undefined) data.te = te;

      await Translation.upsert(translation_key, data);
      await reloadTranslationCache();

      res.json({
        success: true,
        message: "Translation saved and cache reloaded successfully"
      });
    } catch (err) {
      console.error("Failed to upsert translation:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

module.exports = languageController;
