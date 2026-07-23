const { Translation, setPool } = require('../models/Translation');

// In-memory cache of translations
let translationCache = {};

const defaultTranslations = [
  { translation_key: "login_success", en: "Login successful", hi: "लॉगिन सफल", mr: "लॉगिन यशस्वी", gu: "લોગિન સફળ", bn: "লগইন সফল", ta: "உள்நுழைவு வெற்றி", te: "లాగిన్ విజయవంతమైంది" },
  { translation_key: "profile_updated", en: "Profile updated successfully", hi: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई", mr: "प्रोफाइल यशस्वीरित्या अद्यतनित केले", gu: "પ્રોફાઇલ સફળતાપૂર્વક અપડેટ કરવામાં આવી", bn: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে", ta: "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது", te: "ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది" },
  { translation_key: "booking_success", en: "Booking placed successfully", hi: "बुकिंग सफलतापूर्वक की गई", mr: "बुकिंग यशस्वीरित्या झाली", gu: "બુકિંગ સફળતાપૂર્વક કરવામાં આવ્યું", bn: "বুকিং সফলভাবে সম্পন্ন হয়েছে", ta: "புக் செய்வது வெற்றிகரமாக முடிந்தது", te: "బుకింగ్ విజయవంతంగా చేయబడింది" },
  { translation_key: "booking_failed", en: "Booking failed", hi: "बुकिंग विफल रही", mr: "बुकिंग अयशस्वी", gu: "બુકિંગ નિષ્ફળ ગયું", bn: "বুকিং ব্যর্থ হয়েছে", ta: "புக் செய்வது தோல்வியடைந்தது", te: "బుకింగ్ విఫలమైంది" },
  { translation_key: "logout_success", en: "Logged out successfully", hi: "सफलतापूर्वक लॉगआउट किया गया", mr: "यशस्वीरित्या लॉगआउट झाले", gu: "સફળતાપૂર્વક લોગઆઉટ કર્યું", bn: "সফলভাবে লগআউট করা হয়েছে", ta: "வெற்றிகரமாக வெளியேறப்பட்டது", te: "విజయవంతంగా లాగ్ అవుట్ అయ్యారు" },
  { translation_key: "unauthorized", en: "Unauthorized", hi: "अनाधिकृत", mr: "अनधिकृत", gu: "અનધિકૃત", bn: "অননুমোদিত", ta: "அங்கீகரிக்கப்படாதது", te: "అనధికారిక" },
  { translation_key: "service_request", en: "Service request placed", hi: "सेवा अनुरोध रखा गया", mr: "सेवा विनंती पाठवली", gu: "સેવા વિનંતી સબમિટ કરી", bn: "সেবা অনুরোধ করা হয়েছে", ta: "சேவை கோரிக்கை வைக்கப்பட்டது", te: "సేవా అభ్యర్థన సమర్పించబడింది" },
  { translation_key: "account_deleted", en: "Account deleted successfully", hi: "खाता सफलतापूर्वक हटा दिया गया", mr: "खाते यशस्वीरित्या हटवले गेले", gu: "ખાતું સફળતાપૂર્વક કાઢી નાખવામાં આવ્યું", bn: "অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে", ta: "கணக்கு வெற்றிகரமாக நீக்கப்பட்டது", te: "ఖాతా విజయవంతంగా తొలగించబడింది" },
  { translation_key: "otp_sent", en: "OTP sent successfully", hi: "OTP सफलतापूर्वक भेजा गया", mr: "OTP यशस्वीरित्या पाठवला", gu: "OTP સફળતાપૂર્વક મોકલ્યો", bn: "OTP সফলভাবে পাঠানো হয়েছে", ta: "OTP வெற்றிகரமாக அனுப்பப்பட்டது", te: "OTP విజయవంతంగా పంపబడింది" },
  { translation_key: "invalid_otp", en: "Invalid OTP or OTP expired", hi: "OTP अमान्य है या समय सीमा समाप्त हो गई", mr: "OTP अवैध आहे किंवा कालबाह्य झाला", gu: "OTP અમાન્ય છે અથવા સમય સમાપ્ત થઈ ગયો", bn: "OTP অবৈধ অথবা মেয়াদ উত্তীর্ণ", ta: "OTP தவறானது அல்லது காலாவதியாகிவிட்டது", te: "OTP చెల్లుబాటు కాదు లేదా గడువు ముగిసింది" },
  { translation_key: "address_saved", en: "Address saved successfully", hi: "पता सफलतापूर्वक सहेजा गया", mr: "पत्ता यशस्वीरित्या जतन केला", gu: "સરનામું સફળતાપૂર્વક સાચવ્યું", bn: "ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে", ta: "முகவரி வெற்றிகரமாக சேமிக்கப்பட்டது", te: "చిరునామా విజయవంతంగా సేవ్ చేయబడింది" },
  { translation_key: "addresses_retrieved", en: "Addresses retrieved successfully", hi: "पते सफलतापूर्वक प्राप्त किए गए", mr: "पत्ते यशस्वीरित्या मिळवले", gu: "સરનામાં સફળતાપૂર્વક મળ્યાં", bn: "ঠিকানাগুলি সফলভাবে পাওয়া গেছে", ta: "முகவரிகள் வெற்றிகரமாக பெறப்பட்டன", te: "చిరునామాలు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "checkout_success", en: "Checkout completed successfully and order placed", hi: "चेकआउट सफलतापूर्वक पूर्ण हुआ और ऑर्डर दिया गया", mr: "चेकआउट यशस्वीरित्या पूर्ण झाले आणि ऑर्डर दिला", gu: "ચેકઆઉટ સફળ અને ઓર્ડર આપ્યો", bn: "চেকআউট সম্পন্ন এবং অর্ডার দেওয়া হয়েছে", ta: "செக்அவுட் முடிந்தது மற்றும் ஆர்டர் வைக்கப்பட்டது", te: "చెక్అవుట్ పూర్తయింది మరియు ఆర్డర్ చేయబడింది" },
  { translation_key: "order_cancelled", en: "Order cancelled successfully", hi: "ऑर्डर सफलतापूर्वक रद्द किया गया", mr: "ऑर्डर यशस्वीरित्या रद्द केला", gu: "ઓર્ડર સફળતાપૂર્વક રદ કર્યો", bn: "অর্ডার সফলভাবে বাতিল করা হয়েছে", ta: "ஆர்டர் வெற்றிகரமாக ரத்து செய்யப்பட்டது", te: "ఆర్డర్ విజయవంతంగా రద్దు చేయబడింది" },
  { translation_key: "order_not_found", en: "Order not found", hi: "ऑर्डर नहीं मिला", mr: "ऑर्डर सापडला नाही", gu: "ઓર્ડર મળ્યો નહીં", bn: "অর্ডার পাওয়া যায়নি", ta: "ஆர்டர் கிடைக்கவில்லை", te: "ఆర్డర్ కనుగొనబడలేదు" },
  { translation_key: "bookings_retrieved", en: "Bookings retrieved successfully", hi: "बुकिंग सफलतापूर्वक प्राप्त की गईं", mr: "बुकिंग यशस्वीरित्या मिळवल्या", gu: "બુકિંગ સફળતાપૂર્વક મળ્યાં", bn: "বুকিংগুলি সফলভাবে পাওয়া গেছে", ta: "முன்பதிவுகள் வெற்றிகரமாக பெறப்பட்டன", te: "బుకింగ్లు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "contact_sent", en: "Contact message sent successfully", hi: "संपर्क संदेश सफलतापूर्वक भेजा गया", mr: "संपर्क संदेश यशस्वीरित्या पाठवला", gu: "સંપર્ક સંદેશ સફળ", bn: "যোগাযোগ বার্তা সফলভাবে পাঠানো হয়েছে", ta: "தொடர்பு செய்தி வெற்றிகரமாக அனுப்பப்பட்டது", te: "సంప్రదింపు సందేశం విజయవంతంగా పంపబడింది" },
  { translation_key: "service_details_retrieved", en: "Service details retrieved successfully", hi: "सेवा विवरण सफलतापूर्वक प्राप्त किया गया", mr: "सेवा तपशील यशस्वीरित्या मिळवला", gu: "સેવાની વિગત સફળ", bn: "সেবার বিবরণ সফলভাবে পাওয়া গেছে", ta: "சேவை விவரங்கள் வெற்றிகரமாக பெறப்பட்டன", te: "సేవా వివరాలు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "slots_retrieved", en: "Available booking time slots retrieved successfully", hi: "उपलब्ध बुकिंग स्लॉट सफलतापूर्वक प्राप्त किए गए", mr: "उपलब्ध बुकिंग स्लॉट यशस्वीरित्या मिळवले", gu: "ઉપલબ્ધ સ્લૉટ સફળ", bn: "উপলব্ধ স্লট সফলভাবে পাওয়া গেছে", ta: "கிடைக்கக்கூடிய ஸ்லாட்கள் வெற்றிகரமாக பெறப்பட்டன", te: "అందుబాటు స్లాట్లు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "dates_retrieved", en: "Available booking dates retrieved successfully", hi: "उपलब्ध बुकिंग तिथियाँ सफलतापूर्वक प्राप्त की गईं", mr: "उपलब्ध बुकिंग तारखा यशस्वीरित्या मिळवल्या", gu: "ઉપલબ્ધ તારીખો સફળ", bn: "উপলব্ধ তারিখ সফলভাবে পাওয়া গেছে", ta: "கிடைக்கக்கூடிய தேதிகள் வெற்றிகரமாக பெறப்பட்டன", te: "అందుబాటు తేదీలు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "booking_flow_retrieved", en: "Booking flow status retrieved successfully", hi: "बुकिंग स्थिति सफलतापूर्वक प्राप्त की गई", mr: "बुकिंग स्थिती यशस्वीरित्या मिळवली", gu: "બુકિંગ સ્ટેટ્સ સફળ", bn: "বুকিং স্থিতি সফলভাবে পাওয়া গেছে", ta: "புக்கிங் நிலை வெற்றிகரமாக பெறப்பட்டது", te: "బుకింగ్ స్థితి విజయవంతంగా తీసుకోబడింది" },
  { translation_key: "booking_flow_updated", en: "Booking flow status updated successfully", hi: "बुकिंग स्थिति सफलतापूर्वक अपडेट की गई", mr: "बुकिंग स्थिती यशस्वीरित्या अद्यतनित केली", gu: "બુકિંગ સ્ટેટ્સ અપડેટ સફળ", bn: "বুকিং স্থিতি সফলভাবে আপডেট হয়েছে", ta: "புக்கிங் நிலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது", te: "బుకింగ్ స్థితి విజయవంతంగా నవీకరించబడింది" },
  { translation_key: "wallet_retrieved", en: "Wallet transactions retrieved successfully", hi: "वॉलेट लेन-देन सफलतापूर्वक प्राप्त किए गए", mr: "वॉलेट व्यवहार यशस्वीरित्या मिळवले", gu: "વૉલેટ ટ્રાન્ઝેક્શન સફળ", bn: "ওয়ালেট লেনদেন সফলভাবে পাওয়া গেছে", ta: "வாலட் பரிவர்த்தனைகள் வெற்றிகரமாக பெறப்பட்டன", te: "వాలెట్ లావాదేవీలు విజయవంతంగా తీసుకోబడ్డాయి" },
  { translation_key: "wallet_topup_success", en: "Wallet topped up successfully", hi: "वॉलेट सफलतापूर्वक रिचार्ज किया गया", mr: "वॉलेट यशस्वीरित्या रिचार्ज केले", gu: "વૉલેટ ટૉપ-અપ સફળ", bn: "ওয়ালেট সফলভাবে রিচার্জ হয়েছে", ta: "வாலட் வெற்றிகரமாக டாப்-அப் செய்யப்பட்டது", te: "వాలెట్ విజయవంతంగా టాప్-అప్ చేయబడింది" },
  { translation_key: "internal_error", en: "Internal Server Error", hi: "आंतरिक सर्वर त्रुटि", mr: "अंतर्गत सर्व्हर त्रुटी", gu: "આંતરિક સર્વર ભૂલ", bn: "অভ্যন্তরীণ সার্ভার ত্রুটি", ta: "உள் சர்வர் பிழை", te: "అంతర్గత సర్వర్ లోపం" },
  { translation_key: "language_updated", en: "Language preference updated successfully", hi: "भाषा प्राथमिकता सफलतापूर्वक अपडेट की गई", mr: "भाषा प्राधान्य यशस्वीरित्या अद्यतनित केले", gu: "ભાષા પ્રાધાન્ય અપડેટ સફળ", bn: "ভাষার পছন্দ সফলভাবে আপডেট হয়েছে", ta: "மொழி விருப்பம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது", te: "భాషా ప్రాధాన్యత విజయవంతంగా నవీకరించబడింది" }
];

async function initTranslationEngine(mysqlPool) {
  if (mysqlPool) {
    setPool(mysqlPool);
  }
  try {
    await Translation.createTable();
    // Always upsert so new keys are added to existing DBs on server restart
    console.log("Seeding/updating default translations into DB...");
    for (const item of defaultTranslations) {
      const { translation_key, ...rest } = item;
      await Translation.upsert(translation_key, rest);
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
