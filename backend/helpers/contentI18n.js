/**
 * Content Localizer — provides full multilingual translation for categories, services, checkout, orders, and products.
 *
 * Supported languages: en, hi
 */

const SUPPORTED_LANGS = ['hi'];

const CATEGORY_MAP = [
  { matchIds: ['1', 'plumber'], hi: 'प्लंबर', en: 'Plumber' },
  { matchIds: ['3', 'electrician'], hi: 'इलेक्ट्रीशियन', en: 'Electrician' },
  { matchIds: ['5', 'salon'], hi: 'सैलून', en: 'Salon' },
  { matchIds: ['7', 'cleaning'], hi: 'सफाई', en: 'Cleaning' },
  { matchIds: ['9', 'architect', 'architecture'], hi: 'आर्किटेक्चर', en: 'Architect' },
  { matchIds: ['11', 'carpenter'], hi: 'बढ़ई', en: 'Carpenter' },
  { matchIds: ['27', 'car_washing', 'carwashing', 'car washing'], hi: 'कार धुलाई', en: 'Car Washing' },
  { matchIds: ['29', 'mechanic'], hi: 'मैकेनिक', en: 'Mechanic' },
  { matchIds: ['37', 'spa'], hi: 'स्पा', en: 'Spa' },
  { matchIds: ['38', 'ac_repair', 'acrepair', 'ac repair'], hi: 'एसी सर्विस', en: 'AC Repair' },
  { matchIds: ['39', 'advocate', 'lawyer'], hi: 'वकील (एडवोकेट)', en: 'Advocate' },
  { matchIds: ['40', 'compounder'], hi: 'कम्पाउंडर', en: 'Compounder' },
  { matchIds: ['41', 'caters', 'catering', 'cater\'s'], hi: 'कैटरर्स', en: "Cater's" },
  { matchIds: ['42', 'driver'], hi: 'ड्राइवर', en: 'Driver' },
  { matchIds: ['43', 'doctor', 'doctors'], hi: 'डॉक्टर', en: 'Doctor' },
  { matchIds: ['45', 'interiordesign', 'interior design'], hi: 'इंटीरियर डिजाइन', en: 'Interior Design' },
  { matchIds: ['46', 'pestcontrol', 'pest control', 'कीटनियंत्रण'], hi: 'कीट नियंत्रण', en: 'Pest Control' },
  { matchIds: ['48', 'photographer'], hi: 'फोटोग्राफर', en: 'Photographer' },
  { matchIds: ['49', 'painter'], hi: 'पेंटर', en: 'Painter' },
  { matchIds: ['50', 'repairing', 'repair', 'मरम्मत'], hi: 'मरम्मत', en: 'Repairing' },
  { matchIds: ['51', 'solar'], hi: 'सोलर', en: 'Solar' },
  { matchIds: ['52', 'taxconsultancy', 'tax consultancy'], hi: 'टैक्स कंसल्टेंसी', en: 'Tax Consultancy' },
  { matchIds: ['57', 'contractor'], hi: 'ठेकेदार', en: 'Contractor' },
  { matchIds: ['58', 'pandit_ji', 'panditji', 'pandit ji'], hi: 'पंडित जी', en: 'Pandit Ji' },
  { matchIds: ['60', 'ironworks', 'iron works'], hi: 'आयरन वर्क्स', en: 'Iron Works' },
  { matchIds: ['salonandspa', 'salon and spa'], hi: 'सैलून और स्पा', en: 'Salon & Spa' },
  { matchIds: ['bikeservices', 'bike services'], hi: 'बाइक सर्विस', en: 'Bike Services' },
  { matchIds: ['halwai'], hi: 'हलवाई', en: 'Halwai' }
];

const SERVICE_TRANSLATIONS = {
  'professional plumber': { hi: 'प्रोफेशनल प्लंबर', dhi: 'अनुभवी प्लंबर द्वारा घर पर प्लंबिंग सेवाएं' },
  'plumber': { hi: 'प्लंबर सर्विस', dhi: 'घर पर प्लंबिंग की सेवाएं' },
  'tap / faucet repair & replacement': { hi: 'नल मरम्मत और बदलाव', dhi: 'नल के रिसाव और खराबी को ठीक करें' },
  'sink / wash-basin installation': { hi: 'सिंक / वॉश-बेसिन इंस्टॉलेशन', dhi: 'किचन और बाथरूम सिंक की फिटिंग' },
  'sink / wash-basin  installation': { hi: 'सिंक / वॉश-बेसिन इंस्टॉलेशन', dhi: 'किचन और बाथरूम सिंक की फिटिंग' },
  'pipe leakage repair / small pipe replacement': { hi: 'पाइप रिसाव मरम्मत और बदलाव', dhi: 'पाइप लीकेज ठीक करना और नए पाइप लगाना' },
  'blocked drain / floor trap cleaning': { hi: 'ड्रेन और नाली सफाई', dhi: 'जाम नाली और ड्रेन की सफाई' },
  'bathroom plumbing / full bathroom setup': { hi: 'बाथरूम प्लंबिंग और सेटअप', dhi: 'पूरे बाथरूम की प्लंबिंग और फिटिंग' },
  'water tank/motor/geyser plumbing': { hi: 'वाटर टैंक / मोटर / गीजर', dhi: 'पानी की टंकी, मोटर और गीजर की मरम्मत व सर्विस' },
  'water tank/motor/geyser': { hi: 'वाटर टैंक / मोटर / गीजर', dhi: 'पानी की टंकी, मोटर और गीजर की मरम्मत व सर्विस' },
  'basic repair': { hi: 'बेसिक मरम्मत', dhi: 'सामान्य खराबी और लीकेज की मरम्मत' },
  'flush repair': { hi: 'फ्लश मरम्मत', dhi: 'टॉयलेट फ्लश टैंक की मरम्मत' },
  'basin repair': { hi: 'बेसिन मरम्मत', dhi: 'वॉश बेसिन की लीकेज और मरम्मत' },
  'pipe fix': { hi: 'पाइप मरम्मत', dhi: 'टूटे पाइप की मरम्मत' },
  'tap repair': { hi: 'नल मरम्मत', dhi: 'लीक टैप और पानी की समस्याओं को ठीक करना' },
  'fan repair': { hi: 'पंखा मरम्मत', dhi: 'पंखे की समस्याएं ठीक करें' },
  'switch repair': { hi: 'स्विच मरम्मत', dhi: 'स्विच और बोर्ड की मरम्मत' },
  'wiring work': { hi: 'वायरिंग कार्य', dhi: 'पूरी वायरिंग सेटअप' },
  'full house wiring': { hi: 'पूरे घर की वायरिंग', dhi: 'नए घर की वायरिंग और इलेक्ट्रिकल वर्क' },
  'home cleaning': { hi: 'घर की सफाई', dhi: 'पूरे घर की गहरी सफाई' },
  'bathroom cleaning': { hi: 'बाथरूम सफाई', dhi: 'बाथरूम की गहरी सफाई और कीटाणुशोधन' },
  'bathroom cleaning (deep cleaning)': { hi: 'बाथरूम गहरी सफाई', dhi: 'दाग-धब्बे हटाना और बाथरूम की गहरी सफाई' },
  'sofa & carpet cleaning': { hi: 'सोफा और कार्पेट सफाई', dhi: 'सोफा और कालीन की वैक्यूम व स्टीम सफाई' },
  'window cleaning': { hi: 'खिड़की सफाई', dhi: 'कांच और खिड़कियों की सफाई' },
  'ac service': { hi: 'एसी सर्विस', dhi: 'एसी की पूरी सर्विसिंग और सफाई' },
  'ac foam jet service': { hi: 'एसी फोम जेट सर्विस', dhi: 'फोम जेट तकनीक से एसी की गहरी सफाई' },
  'standard jet wash service': { hi: 'स्टैंडर्ड जेट वाश सर्विस', dhi: 'हाई प्रेशर जेट वाश एसी सर्विस' },
  'anti-rust / monsoon special service (ac)': { hi: 'एंटी-रस्ट एसी सर्विस', dhi: 'जंग रोधी और मानसून विशेष एसी सर्विस' },
  'deep ac repair': { hi: 'डीप एसी मरम्मत', dhi: 'एसी की गंभीर खराबी और गैस चार्जिंग' },
  'ac repair': { hi: 'एसी मरम्मत', dhi: 'एसी की खराबी ठीक करें' },
  'ac installation(split ac)': { hi: 'स्प्लिट एसी इंस्टॉलेशन', dhi: 'नया स्प्लिट एसी लगाएं' },
  'ac installation(window ac)': { hi: 'विंडो एसी इंस्टॉलेशन', dhi: 'नया विंडो एसी लगाएं' },
  'ac uninstallation(split/window)': { hi: 'एसी अनइंस्टॉलेशन', dhi: 'एसी को सुरक्षित रूप से निकालें' },
  'ac gas refill': { hi: 'एसी गैस रिफिल', dhi: 'एसी में ठंडक के लिए गैस भरवाएं' },
  'ac condenser replacement': { hi: 'एसी कंडेनसर बदलाव', dhi: 'नया कॉपर कंडेनसर लगाएं' },
  'ac condenser repair': { hi: 'एसी कंडेनसर मरम्मत', dhi: 'कंडेनसर की खराबी ठीक करें' },
  'wall paint': { hi: 'दीवार पेंटिंग', dhi: 'कमरे की दीवारों की पेंटिंग' },
  'wall painting': { hi: 'दीवार पेंटिंग', dhi: 'घर की दीवारें पेंट करें' },
  'furniture repair': { hi: 'फर्नीचर मरम्मत', dhi: 'टूटे फर्नीचर की मरम्मत' },
  'general pest control': { hi: 'सामान्य कीट नियंत्रण', dhi: 'कीड़े-मकोड़ों से घर का बचाव' },
  'termite treatment': { hi: 'दीमक उपचार', dhi: 'दीमक का स्थायी इलाज' },
  'facial & grooming': { hi: 'फेशियल और ग्रूमिंग', dhi: 'चेहरे की सफाई और देखभाल' },
  'massage therapy': { hi: 'मसाज थेरेपी', dhi: 'शरीर की आरामदायी मालिश' },
  'pedicure & manicure': { hi: 'पेडीक्योर और मेनीक्योर', dhi: 'हाथ और पैरों की सफाई व ब्यूटी केयर' },
  'children hair cut': { hi: 'बच्चों की बाल कटाई', dhi: 'बच्चों के लिए सुरक्षित हेयरकट' },
  'haircut': { hi: 'बाल कटाई', dhi: 'पेशेवर बाल कटाई' },
  'mehndi(shahnaz)': { hi: 'शहनाज़ मेहंदी', dhi: 'सुंदर और आकर्षक मेहंदी डिजाइन' },
  'bike repair': { hi: 'बाइक मरम्मत', dhi: 'बाइक की पूरी सर्विस और मरम्मत' },
  'car wash deep': { hi: 'कार डीप वाश', dhi: 'कार के अंदर व बाहर की सफाई' },
  'exterior shine': { hi: 'कार एक्सटीरियर शाइन', dhi: 'कार की बाहरी धुलाई और पॉलिश' },
  'pooja service': { hi: 'पूजा सेवा', dhi: 'पंडित जी द्वारा विधि-विधान से पूजा' },
  'one-way trip': { hi: 'ड्राइवर सर्विस', dhi: 'शहर में सुरक्षित यात्रा के लिए ड्राइवर' },
  'general consultation': { hi: 'डॉक्टर परामर्श', dhi: 'स्वास्थ्य संबंधी परामर्श और दवाइयां' },
  'dressing & injection': { hi: 'ड्रेसिंग और इंजेक्शन', dhi: 'पट्टी और इंजेक्शन सेवा' },
  'catering service': { hi: 'कैटरिंग सेवा', dhi: 'स्वादिष्ट भोजन और कैटरिंग व्यवस्था' },
  'ro installation': { hi: 'आरओ इंस्टॉलेशन', dhi: 'नया वाटर प्यूरीफायर लगाएं' },
  'ro service': { hi: 'आरओ सर्विस', dhi: 'वाटर प्यूरीफायर फिल्टर सफाई' },
  'ro repair': { hi: 'आरओ मरम्मत', dhi: 'आरओ वाटर प्यूरीफायर की मरम्मत' },
  'filter replacement': { hi: 'फिल्टर बदलाव', dhi: 'आरओ के पुराने फिल्टर बदलें' },
  'legal consultation (general)': { hi: 'कानूनी सलाह', dhi: 'अनुभवी वकील से कानूनी परामर्श' },
  'solar pannel new installation 3kw to 20kw': { hi: 'सोलर पैनल इंस्टॉलेशन (3KW-20KW)', dhi: 'घर और व्यावसायिक उपयोग के लिए सोलर सिस्टम' },
  'solar inverter maintenance 3kw to 8kw': { hi: 'सोलर इनवर्टर रखरखाव (3KW-8KW)', dhi: 'सोलर इनवर्टर की देखभाल व सर्विस' },
  'solar inverter maintenance 10kw to 20kw': { hi: 'सोलर इनवर्टर रखरखाव (10KW-20KW)', dhi: 'बड़े सोलर इनवर्टर की मेंटेनेंस' },
  'solar services 3kw to 8kw': { hi: 'सोलर सर्विस (3KW-8KW)', dhi: 'सोलर सिस्टम की पूरी देखभाल' },
  'solar services 10kw to 20kw': { hi: 'सोलर सर्विस (10KW-20KW)', dhi: 'व्यावसायिक सोलर सिस्टम सर्विस' },
  'tax consultancy services': { hi: 'टैक्स कंसल्टेंसी सर्विस', dhi: 'इनकम टैक्स और जीएसटी संबंधी सलाह' },
  '1bhk deep cleaning': { hi: '1BHK डीप क्लीनिंग', dhi: '1BHK घर की पूरी गहरी सफाई' },
  '4bhk deep cleaning': { hi: '4BHK डीप क्लीनिंग', dhi: '4BHK घर की पूरी गहरी सफाई' },
  '1bhk essential cleaning': { hi: '1BHK बेसिक सफाई', dhi: '1BHK घर की सामान्य सफाई' },
  '4bhk essential cleaning': { hi: '4BHK बेसिक सफाई', dhi: '4BHK घर की सामान्य सफाई' },
  'space planning': { hi: 'स्पेस प्लानिंग परामर्श', dhi: 'घर के इंटीरियर स्पेस की योजना' },
  'modular kitchen': { hi: 'मॉड्यूलर किचन परामर्श', dhi: 'आधुनिक मॉड्यूलर किचन डिजाइन' },
  'residential interiors': { hi: 'रेजिडेंशियल इंटीरियर', dhi: 'घर की अंदरूनी सजावट और डिजाइन' },
  'commercial interiors': { hi: 'कमर्शियल इंटीरियर', dhi: 'दुकान और ऑफिस की सजावट' },
  'helper': { hi: 'हेल्पर / सहायक', dhi: 'काम में सहायता के लिए सहायक' }
};

const WORD_MAP = {
  'professional': 'प्रोफेशनल',
  'plumber': 'प्लंबर',
  'plumbing': 'प्लंबिंग',
  'electrician': 'इलेक्ट्रीशियन',
  'carpenter': 'बढ़ई',
  'cleaning': 'सफाई',
  'clean': 'सफाई',
  'repair': 'मरम्मत',
  'fix': 'मरम्मत',
  'installation': 'इंस्टॉलेशन',
  'uninstallation': 'अनइंस्टॉलेशन',
  'replacement': 'बदलाव',
  'replace': 'बदलाव',
  'service': 'सर्विस',
  'services': 'सेवाएं',
  'setup': 'सेटअप',
  'leakage': 'रिसाव',
  'leak': 'लीकेज',
  'tap': 'नल',
  'faucet': 'नल',
  'pipe': 'पाइप',
  'sink': 'सिंक',
  'wash-basin': 'वॉश बेसिन',
  'basin': 'बेसिन',
  'drain': 'नाली/ड्रेन',
  'trap': 'ट्रैप',
  'bathroom': 'बाथरूम',
  'home': 'घर',
  'house': 'घर',
  'water': 'पानी',
  'tank': 'टंकी',
  'motor': 'मोटर',
  'geyser': 'गीजर',
  'basic': 'बेसिक',
  'flush': 'फ्लश',
  'fan': 'पंखा',
  'switch': 'स्विच',
  'wiring': 'वायरिंग',
  'painter': 'पेंटर',
  'paint': 'पेंटिंग',
  'wall': 'दीवार',
  'sofa': 'सोफा',
  'carpet': 'कार्पेट',
  'window': 'खिड़की',
  'foam': 'फोम',
  'jet': 'जेट',
  'wash': 'धुलाई',
  'anti-rust': 'एंटी-रस्ट',
  'deep': 'डीप',
  'split': 'स्प्लिट',
  'condenser': 'कंडेनसर',
  'grooming': 'ग्रूमिंग',
  'massage': 'मसाज',
  'therapy': 'थेरेपी',
  'pedicure': 'पेडीक्योर',
  'manicure': 'मेनीक्योर',
  'children': 'बच्चों का',
  'haircut': 'बाल कटाई',
  'hair': 'बाल',
  'cut': 'कटाई',
  'bike': 'बाइक',
  'car': 'कार',
  'exterior': 'एक्सटीरियर',
  'shine': 'शाइन',
  'pooja': 'पूजा',
  'one-way': 'वन-वे',
  'trip': 'ट्रिप',
  'general': 'सामान्य',
  'consultation': 'परामर्श',
  'dressing': 'ड्रेसिंग',
  'injection': 'इंजेक्शन',
  'catering': 'कैटरिंग',
  'filter': 'फिल्टर',
  'legal': 'कानूनी',
  'solar': 'सोलर',
  'panel': 'पैनल',
  'inverter': 'इनवर्टर',
  'maintenance': 'रखरखाव',
  'tax': 'टैक्स',
  'consultancy': 'कंसल्टेंसी',
  'essential': 'आवश्यक',
  'space': 'स्पेस',
  'planning': 'प्लानिंग',
  'modular': 'मॉड्यूलर',
  'kitchen': 'किचन',
  'residential': 'आवासीय',
  'interiors': 'इंटीरियर',
  'commercial': 'व्यावसायिक',
  'helper': 'हेल्पर',
  'ro': 'आरओ',
  'inspection': 'जांच/निरीक्षण',
  'diagnosis': 'निदान',
  'fitting': 'फिटिंग',
  'toilet': 'टॉयलेट',
  'garbage': 'कचरा',
  'disposal': 'निपटान'
};

function autoTranslateTitleToHindi(text) {
  if (!text) return '';
  let words = text.split(/(\s+|\/|&|-|\(|\))/);
  let res = words.map(w => {
    let lower = w.toLowerCase().trim();
    if (WORD_MAP[lower]) return WORD_MAP[lower];
    return w;
  }).join('');
  return res;
}

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

  let finalName = baseName;

  if (match) {
    finalName = match[normalizedLang] || match['en'] || baseName;
  } else {
    if (normalizedLang !== 'en') {
      finalName = row[`name_${normalizedLang}`] || row[`title_${normalizedLang}`] || baseName;
    }
  }

  return {
    ...row,
    id: row.id !== undefined && row.id !== null ? (typeof row.id === 'number' ? row.id : String(row.id)) : (match ? match.matchIds[0] : rawId),
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

  if (normalizedLang === 'hi') {
    // 1. Check direct properties
    localizedTitle = row.title_hi || row.name_hi || '';
    localizedDesc = row.description_hi || '';

    // 2. Search in SERVICE_TRANSLATIONS dictionary (fuzzy clean key)
    if (baseTitle) {
      const cleanKey = baseTitle.toLowerCase().trim().replace(/\s+/g, ' ');
      const match = SERVICE_TRANSLATIONS[cleanKey];
      if (match) {
        if (!localizedTitle && match.hi) localizedTitle = match.hi;
        if (!localizedDesc && match.dhi) localizedDesc = match.dhi;
      }
    }

    // 3. Fallback automatic Hindi translator for titles and descriptions if still missing or English
    if (!localizedTitle || /[a-zA-Z]/.test(localizedTitle)) {
      localizedTitle = autoTranslateTitleToHindi(baseTitle);
    }
    if (!localizedDesc || /[a-zA-Z]{5,}/.test(localizedDesc)) {
      localizedDesc = `${localizedTitle} की पेशेवर और गुणवत्तापूर्ण सेवा`;
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
    productId: finalTitle,
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
