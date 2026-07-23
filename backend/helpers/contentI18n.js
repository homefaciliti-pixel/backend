/**
 * Content Localizer — adds multilingual columns to node_categories & node_services,
 * provides dictionary fallback for static data, and localizes category, service, and order items.
 *
 * Supported languages: en, hi
 */

const SUPPORTED_LANGS = ['hi'];

const CATEGORY_MAP = [
  { matchIds: ['plumber'], stdId: 'plumber', hi: 'प्लंबर', en: 'Plumber' },
  { matchIds: ['electrician'], stdId: 'electrician', hi: 'इलेक्ट्रीशियन', en: 'Electrician' },
  { matchIds: ['5', 'salon'], stdId: 'salon', hi: 'सैलून', en: 'Salon' },
  { matchIds: ['cleaning'], stdId: 'cleaning', hi: 'सफाई', en: 'Cleaning' },
  { matchIds: ['9', 'architect', 'architecture'], stdId: 'architect', hi: 'आर्किटेक्चर', en: 'Architect' },
  { matchIds: ['carpenter'], stdId: 'carpenter', hi: 'बढ़ई', en: 'Carpenter' },
  { matchIds: ['car_washing', 'carwashing', 'car washing'], stdId: 'car_washing', hi: 'कार धुलाई', en: 'Car Washing' },
  { matchIds: ['mechanic'], stdId: 'mechanic', hi: 'मैकेनिक', en: 'Mechanic' },
  { matchIds: ['37', 'spa'], stdId: 'spa', hi: 'स्पा', en: 'Spa' },
  { matchIds: ['ac_repair', 'acrepair', '38', 'ac repair'], stdId: 'ac_repair', hi: 'एसी सर्विस', en: 'AC Repair' },
  { matchIds: ['39', 'advocate', 'lawyer'], stdId: 'advocate', hi: 'वकील (एडवोकेट)', en: 'Advocate' },
  { matchIds: ['40', 'compounder'], stdId: 'compounder', hi: 'कम्पाउंडर', en: 'Compounder' },
  { matchIds: ['41', 'caters', 'catering', 'cater\'s'], stdId: 'caters', hi: 'कैटरर्स', en: "Cater's" },
  { matchIds: ['42', 'driver'], stdId: 'driver', hi: 'ड्राइवर', en: 'Driver' },
  { matchIds: ['43', 'doctor', 'doctors'], stdId: 'doctor', hi: 'डॉक्टर', en: 'Doctor' },
  { matchIds: ['45', 'interiordesign', 'interior design'], stdId: 'interior_design', hi: 'इंटीरियर डिजाइन', en: 'Interior Design' },
  { matchIds: ['46', 'pestcontrol', 'pest control', 'कीटनियंत्रण'], stdId: 'pest_control', hi: 'कीट नियंत्रण', en: 'Pest Control' },
  { matchIds: ['48', 'photographer'], stdId: 'photographer', hi: 'फोटोग्राफर', en: 'Photographer' },
  { matchIds: ['49', 'painter'], stdId: 'painter', hi: 'पेंटर', en: 'Painter' },
  { matchIds: ['50', 'repairing', 'repair', 'मरम्मत'], stdId: 'repairing', hi: 'मरम्मत', en: 'Repairing' },
  { matchIds: ['51', 'solar'], stdId: 'solar', hi: 'सोलर', en: 'Solar' },
  { matchIds: ['52', 'taxconsultancy', 'tax consultancy'], stdId: 'tax_consultancy', hi: 'टैक्स कंसल्टेंसी', en: 'Tax Consultancy' },
  { matchIds: ['57', 'contractor'], stdId: 'contractor', hi: 'ठेकेदार', en: 'Contractor' },
  { matchIds: ['58', 'pandit_ji', 'panditji', 'pandit ji'], stdId: 'pandit_ji', hi: 'पंडित जी', en: 'Pandit Ji' },
  { matchIds: ['60', 'ironworks', 'iron works'], stdId: 'iron_works', hi: 'आयरन वर्क्स', en: 'Iron Works' },
  { matchIds: ['salonandspa', 'salon and spa'], stdId: 'salon_and_spa', hi: 'सैलून और स्पा', en: 'Salon & Spa' },
  { matchIds: ['bikeservices', 'bike services'], stdId: 'bike_services', hi: 'बाइक सर्विस', en: 'Bike Services' },
  { matchIds: ['halwai'], stdId: 'halwai', hi: 'हलवाई', en: 'Halwai' }
];

const SERVICE_TRANSLATIONS = {
  'tap repair':               { hi: 'नल मरम्मत', mr: 'नळ दुरुस्ती', gu: 'નળ સમારકામ', bn: 'কল মেরামত', ta: 'குழாய் பழுது', te: 'నల్లా మరమ్మత్తు', dhi: 'लीक टैप और पानी की समस्याओं को ठीक करना' },
  'pipe fix':                 { hi: 'पाइप मरम्मत', mr: 'पाईप दुरुस्ती', gu: 'પાઇપ સમારકામ', bn: 'পাইপ মেরামত', ta: 'குழாய் பழுது', te: 'పైపు మరమ్మత్తు', dhi: 'टूटे पाइप की मरम्मत' },
  'fan repair':               { hi: 'पंखा मरम्मत', mr: 'पंखा दुरुस्ती', gu: 'પંખો સમારકામ', bn: 'ফ্যান মেরামত', ta: 'மின்விசிறி பழுது', te: 'ఫ్యాన్ మరమ్మత్తు', dhi: 'पंखे की समस्याएं ठीक करें' },
  'switch repair':            { hi: 'स्विच मरम्मत', mr: 'स्विच दुरुस्ती', gu: 'સ્વિચ સમારકામ', bn: 'সুইচ মেরামত', ta: 'சுவிட்ச் பழுது', te: 'స్విచ్ మరమ్మత్తు', dhi: 'स्विच और बोर्ड की मरम्मत' },
  'wiring work':              { hi: 'वायरिंग कार्य', mr: 'वायरिंग काम', gu: 'વાયરિંગ કામ', bn: 'তারের কাজ', ta: 'கம்பி வேலை', te: 'వైరింగ్ పని', dhi: 'पूरी वायरिंग सेटअप' },
  'home cleaning':            { hi: 'घर की सफाई', mr: 'घर साफसफाई', gu: 'ઘરની સફાઈ', bn: 'বাড়ি পরিষ্কার', ta: 'வீட்டு சுத்தம்', te: 'ఇంటి శుభ్రత', dhi: 'पूरे घर की सफाई सेवा' },
  'bathroom cleaning':        { hi: 'बाथरूम सफाई', mr: 'बाथरूम साफसफाई', gu: 'બાથરૂમ સફાઈ', bn: 'বাথরুম পরিষ্কার', ta: 'குளியலறை சுத்தம்', te: 'బాత్రూమ్ శుభ్రత', dhi: 'बाथरूम की गहरी सफाई' },
  'sofa & carpet cleaning':   { hi: 'सोफा और कार्पेट सफाई', mr: 'सोफा आणि कार्पेट साफसफाई', gu: 'સોફા અને કાર્પેટ સફાઈ', bn: 'সোফা ও কার্পেট পরিষ্কার', ta: 'சோஃபா மற்றும் கம்பளம் சுத்தம்', te: 'సోఫా మరియు కార్పెట్ శుభ్రత', dhi: 'सोफा और कालीन की भाप से सफाई' },
  'window cleaning':          { hi: 'खिड़की सफाई', mr: 'खिडकी साफसफाई', gu: 'બારી સફાઈ', bn: 'জানালা পরিষ্কার', ta: 'ஜன்னல் சுத்தம்', te: 'కిటికీ శుభ్రత', dhi: 'शीशे की अंदर-बाहर धुलाई' },
  'ac service':               { hi: 'एसी सर्विस', mr: 'एसी सर्व्हिस', gu: 'એ.સી. સર્વિસ', bn: 'এসি সার্ভিস', ta: 'ஏசி சேவை', te: 'ఏసీ సర్వీస్', dhi: 'एसी की पूरी सर्विसिंग' },
  'ac repair':                { hi: 'एसी मरम्मत', mr: 'एसी दुरुस्ती', gu: 'એ.સી. રિપેર', bn: 'এসি মেরামত', ta: 'ஏசி பழுது', te: 'ఏసీ మరమ్మత్తు', dhi: 'एसी की खराबी ठीक करें' },
  'ac installation':          { hi: 'एसी इंस्टॉलेशन', mr: 'एसी इन्स्टॉलेशन', gu: 'AC ઇન્સ્ટોલેશન', bn: 'এসি ইনস্টলেশন', ta: 'ஏசி நிறுவுதல்', te: 'ఏసీ ఇన్‌స్టాలేશન', dhi: 'नया एसी लगाएं' },
  'ac gas refill':            { hi: 'एसी गैस रिफिल', mr: 'एसी गॅस रिफिल', gu: 'AC ગેસ રિફિલ', bn: 'এসি গ্যাস রিফিল', ta: 'ஏசி வாயு நிரப்புதல்', te: 'ఏసీ గ్యాస్ రీఫિલ', dhi: 'एसी में गैस भरवाएं' },
  'wall painting':            { hi: 'दीवार पेंटिंग', mr: 'भिंत रंगकाम', gu: 'દીવાલ પેઈન્ટ', bn: 'দেওয়াল রং', ta: 'சுவர் வர்ணம்', te: 'గోడ పెయింటింగ్', dhi: 'घर की दीवारें पेंट करें' },
  'waterproofing':            { hi: 'वॉटरप्रूफिंग', mr: 'वॉटरप्रूफिंग', gu: 'વોટરપ્રૂફિંગ', bn: 'ওয়াটারপ্রুফિંગ', ta: 'நீர்ஊடுருவா பூச்சு', te: 'వాటర్‌પ્રૂફિંગ', dhi: 'पानी से दीवारों की सुरक्षा' },
  'furniture repair':         { hi: 'फर्नीचर मरम्मत', mr: 'फर्निचर दुरुस्ती', gu: 'ફર્નિચર સમારકામ', bn: 'આসবাবপত্র মেরামত', ta: 'தளவாட பழுது', te: 'ఫర్నిచర్ మరమ్మత్తు', dhi: 'टूटे फर्नीचर की मरम्मत' },
  'cockroach control':        { hi: 'तिलचट्टा नियंत्रण', mr: 'झुरळ नियंत्रण', gu: 'વંદો નિયંત્રણ', bn: 'তেলাপোকা নিয়ন্ত্রণ', ta: 'கரப்பான் பூச்சி கட்டுப்பாடு', te: 'బొద్దింక నియంత్రణ', dhi: 'घर में तिलचट्टों से छुटकारा' },
  'bed bug control':          { hi: 'खटमल नियंत्रण', mr: 'बेड बग नियंत्रण', gu: 'ખાટમલ નિયંત્રણ', bn: 'ছারপোকা নিয়ন্ত্রণ', ta: 'படுக்கை பூச்சி கட்டுப்பாடு', te: 'మంచం పురుగుల నియంత్రణ', dhi: 'खटमल का पूरा सफाया' },
  'termite control':          { hi: 'दीमक नियंत्रण', mr: 'वाळवी नियंत्रण', gu: 'ઉધઈ નિયંત્રણ', bn: 'ઉইপোকা নিয়ন্ত্রণ', ta: 'கரையான் கட்டுப்பாடு', te: 'చెదలు నియంత్రణ', dhi: 'दीमक का पूरा उपचार' },
  'haircut':                  { hi: 'बाल कटाई', mr: 'केस कापणे', gu: 'વાળ કાપવા', bn: 'চুল কাটা', ta: 'முடி வெட்டல்', te: 'హేర్‌కట్', dhi: 'पेशेवर बाल कटाई' },
  'facial':                   { hi: 'फेशियल', mr: 'फेशियल', gu: 'ફેશિયલ', bn: 'ফেসিয়াল', ta: 'முக சுத்தம்', te: 'ఫేషిયલ', dhi: 'चेहरे की देखभाल और सफाई' },
  'massage':                  { hi: 'मालिश', mr: 'मालिश', gu: 'માલિશ', bn: 'মালিশ', ta: 'மசாஜ்', te: 'మసాஜ்', dhi: 'पूरे शरीर की मालिश' },
  'bike repair':              { hi: 'बाइक मरम्मत', mr: 'बाइक दुरुस्ती', gu: 'બાઇક સમારકામ', bn: 'বাইક মেরামত', ta: 'இருசக்கர வாகன பழுது', te: 'బైక్ మరమ్మత్తు', dhi: 'बाइक की सभी समस्याएं ठीक' },
  'oil change':               { hi: 'ऑयल बदलाव', mr: 'ऑइल बदलणे', gu: 'ઓઇલ બદલવું', bn: 'તેલ পরিবর্তন', ta: 'எண்ணெய் மாற்றம்', te: 'ఆయిల్ మార్పు', dhi: 'गाड़ी का ऑयल बदलवाएं' },
  'car wash':                 { hi: 'कार धुलाई', mr: 'कार धुणे', gu: 'કાર ધોવા', bn: 'গাড়ি ধোয়া', ta: 'கார் கழுவுதல்', te: 'કાર્ వాష్', dhi: 'कार की पूरी धुलाई' },
  'interior cleaning':        { hi: 'इंटीरियर सफाई', mr: 'आतील भाग साफसफाई', gu: 'ઇન્ટીરિયર સફાઈ', bn: 'অভ্যন্তরীণ পরিষ্কার', ta: 'உட்புற சுத்தம்', te: 'ఇంటీరిયર ક્લીનિંગ', dhi: 'गाड़ी के अंदर की सफाई' },
};

function localizeField(row, field, lang) {
  if (!row || !field) return '';
  const normalizedLang = (lang || 'en').toLowerCase().trim();
  if (normalizedLang !== 'en' && SUPPORTED_LANGS.includes(normalizedLang)) {
    const localizedKey = `${field}_${normalizedLang}`;
    const localizedValue = row[localizedKey];
    if (localizedValue && String(localizedValue).trim() !== '') {
      return String(localizedValue).trim();
    }
  }
  return row[field] || '';
}

function localizeCategory(row, lang) {
  if (!row) return row;
  const normalizedLang = (lang || 'en').toLowerCase().trim();

  const rawId = String(row.id || '').trim().toLowerCase();
  const baseName = String(row.name || row.title || row.categoryName || row.category_name || '').trim();
  const cleanKey = baseName.toLowerCase().replace(/[\s\-_']/g, '');

  const match = CATEGORY_MAP.find(m => 
    m.matchIds.includes(rawId) || 
    m.matchIds.includes(cleanKey) || 
    m.matchIds.includes(baseName.toLowerCase().trim())
  );

  let finalId = row.id;
  let finalName = baseName;

  if (match) {
    finalId = match.stdId;
    finalName = match[normalizedLang] || match['en'] || baseName;
  } else {
    if (normalizedLang !== 'en') {
      finalName = row[`name_${normalizedLang}`] || row[`title_${normalizedLang}`] || baseName;
    }
  }

  return {
    ...row,
    id: finalId,
    name: finalName,
    title: finalName,
    categoryName: finalName,
    category_name: finalName
  };
}

function localizeService(row, lang) {
  if (!row) return row;
  const normalizedLang = (lang || 'en').toLowerCase().trim();

  const baseTitle = row.title || row.serviceName || row.productName || row.product_name || row.name || row.productId || '';
  const baseDesc = row.description || row.productDescription || row.product_description || '';

  let localizedTitle = '';
  let localizedDesc = '';

  if (normalizedLang !== 'en' && SUPPORTED_LANGS.includes(normalizedLang)) {
    // 1. Check direct properties on object
    localizedTitle = row[`title_${normalizedLang}`] || row[`name_${normalizedLang}`] || '';
    localizedDesc = row[`description_${normalizedLang}`] || '';

    // 2. Fallback dictionary search by title
    if (!localizedTitle && baseTitle) {
      const cleanKey = baseTitle.toLowerCase().trim();
      const trans = SERVICE_TRANSLATIONS[cleanKey];
      if (trans && trans[normalizedLang]) {
        localizedTitle = trans[normalizedLang];
      }
    }

    if (!localizedDesc && baseTitle) {
      const cleanKey = baseTitle.toLowerCase().trim();
      const trans = SERVICE_TRANSLATIONS[cleanKey];
      if (trans && trans[`d${normalizedLang}`]) {
        localizedDesc = trans[`d${normalizedLang}`];
      }
    }
  }

  const finalTitle = localizedTitle || baseTitle;
  const finalDesc = localizedDesc || baseDesc;

  return {
    ...row,
    title: finalTitle,
    name: finalTitle,
    productName: finalTitle,
    product_name: finalTitle,
    serviceName: finalTitle,
    productId: row.productId ? (localizedTitle ? localizedTitle : row.productId) : finalTitle,
    description: finalDesc,
    productDescription: finalDesc,
    product_description: finalDesc
  };
}

async function runContentI18nMigration(pool) {
  if (!pool) return;
  const tables = [
    { table: 'node_categories', fields: ['title', 'name'] },
    { table: 'node_services',   fields: ['title', 'description'] }
  ];

  for (const { table, fields } of tables) {
    try {
      const [tableCheck] = await pool.query(
        `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      if (!tableCheck[0] || tableCheck[0].cnt === 0) continue;
    } catch (e) {
      continue;
    }

    for (const field of fields) {
      for (const lang of SUPPORTED_LANGS) {
        const col = `${field}_${lang}`;
        try {
          const [colCheck] = await pool.query(
            `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
            [table, col]
          );
          if (colCheck[0] && colCheck[0].cnt === 0) {
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` TEXT NULL DEFAULT NULL`);
            console.log(`[i18n] Added column ${col} to ${table}`);
          }
        } catch (err) {
          // ignore
        }
      }
    }
  }
  console.log('[i18n] Content localization migration complete.');
}

module.exports = {
  localizeField,
  localizeCategory,
  localizeService,
  runContentI18nMigration,
  SUPPORTED_LANGS,
  CATEGORY_MAP,
  SERVICE_TRANSLATIONS
};
