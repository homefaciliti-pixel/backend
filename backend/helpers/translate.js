const { Translation, setPool } = require('../models/Translation');

// In-memory cache of translations
let translationCache = {};

const defaultTranslations = [
  {
    translation_key: "login_success",
    en: "Login successful",
    hi: "लॉगिन सफल",
    mr: "लॉगिन यशस्वी",
    gu: "લોગિન સફળ",
    bn: "লগইন সফল",
    ta: "உள்நுழைவு வெற்றி",
    te: "లాగిన్ విజయవంతమైంది"
  },
  {
    translation_key: "profile_updated",
    en: "Profile updated successfully",
    hi: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई",
    mr: "प्रोफाइल यशस्वीरित्या अद्यतनित केले",
    gu: "પ્રોફાઇલ સફળતાપૂર્વક અપડેટ કરવામાં આવી",
    bn: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে",
    ta: "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது",
    te: "ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది"
  },
  {
    translation_key: "booking_success",
    en: "Booking placed successfully",
    hi: "बुकिंग सफलतापूर्वक की गई",
    mr: "बुकिंग यशस्वीरित्या झाली",
    gu: "બુકિંગ સફળતાપૂર્વક કરવામાં આવ્યું",
    bn: "বুকিং সফলভাবে সম্পন্ন হয়েছে",
    ta: "புக் செய்வது வெற்றிகரமாக முடிந்தது",
    te: "బుకింగ్ విజయవంతంగా చేయబడింది"
  },
  {
    translation_key: "booking_failed",
    en: "Booking failed",
    hi: "बुकिंग विफल रही",
    mr: "बुकिंग अयशस्वी",
    gu: "બુકિંગ નિષ્ફળ ગયું",
    bn: "বুকিং ব্যর্থ হয়েছে",
    ta: "புக் செய்வது தோல்வியடைந்தது",
    te: "బుకింగ్ విఫలమైంది"
  },
  {
    translation_key: "logout_success",
    en: "Logged out successfully",
    hi: "सफलतापूर्वक लॉगआउट किया गया",
    mr: "यशस्वीरित्या लॉगआउट झाले",
    gu: "સફળતાપૂર્વક લોગઆઉટ કર્યું",
    bn: "সফলভাবে লগআউট করা হয়েছে",
    ta: "வெற்றிகரமாக வெளியேறப்பட்டது",
    te: "విజయవంతంగా లాగ్ అవుట్ అయ్యారు"
  },
  {
    translation_key: "unauthorized",
    en: "Unauthorized",
    hi: "अनाधिकृत",
    mr: "अनधिकृत",
    gu: "અનધિકૃત",
    bn: "অননুমোদিত",
    ta: "அங்கீகரிக்கப்படாதது",
    te: "అనధికారిక"
  },
  {
    translation_key: "service_request",
    en: "Service request placed",
    hi: "सेवा अनुरोध रखा गया",
    mr: "सेवा विनंती पाठवली",
    gu: "સેવા વિનંતી સબમિટ કરી",
    bn: "পরিষেba অনুরোধ করা হয়েছে",
    ta: "சேவை கோரிக்கை வைக்கப்பட்டது",
    te: "సేవా అభ్యర్థన సమర్పించబడింది"
  },
  {
    translation_key: "account_deleted",
    en: "Account deleted successfully",
    hi: "खाता सफलतापूर्वक हटा दिया गया",
    mr: "खाते यशस्वीरित्या हटवले गेले",
    gu: "ખાતું સફળતાપૂર્વક કાઢી નાખવામાં આવ્યું",
    bn: "অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে",
    ta: "கணக்கு வெற்றிகரமாக நீக்கப்பட்டது",
    te: "ఖాతా విజయవంతంగా తొలగించబడింది"
  }
];

async function initTranslationEngine(mysqlPool) {
  if (mysqlPool) {
    setPool(mysqlPool);
  }
  try {
    await Translation.createTable();
    
    // Seed default translations if database table is empty
    const existing = await Translation.getAll();
    if (existing.length === 0) {
      console.log("Seeding default translations into DB...");
      for (const item of defaultTranslations) {
        const { translation_key, ...rest } = item;
        await Translation.upsert(translation_key, rest);
      }
    }
    
    await reloadTranslationCache();
    console.log("Translation engine initialized and cached successfully.");
  } catch (err) {
    console.error("Failed to initialize translation engine:", err);
  }
}

async function reloadTranslationCache() {
  try {
    const rows = await Translation.getAll();
    const newCache = {};
    for (const row of rows) {
      newCache[row.translation_key] = {
        en: row.en || "",
        hi: row.hi || "",
        mr: row.mr || "",
        gu: row.gu || "",
        bn: row.bn || "",
        ta: row.ta || "",
        te: row.te || ""
      };
    }
    translationCache = newCache;
    console.log(`Reloaded translation cache with ${rows.length} keys.`);
  } catch (err) {
    console.error("Failed to reload translation cache:", err);
  }
}

function translate(key, lang) {
  const normalizedLang = (lang || 'en').toLowerCase().trim();
  const translations = translationCache[key];
  if (!translations) {
    return key; // Fallback to key if translation key doesn't exist
  }
  return translations[normalizedLang] || translations['en'] || key;
}

module.exports = {
  initTranslationEngine,
  reloadTranslationCache,
  translate
};
