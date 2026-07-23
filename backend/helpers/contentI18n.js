/**
 * Content Localizer — adds multilingual columns to node_categories & node_services,
 * provides dictionary fallback for static data, and localizes category, service, and order items.
 *
 * Supported languages: en, hi, mr, gu, bn, ta, te
 */

const SUPPORTED_LANGS = ['hi'];

const CATEGORY_TRANSLATIONS = {
  'acrepair':      { hi: 'एसी सर्विस',       mr: 'एसी दुरुस्ती',       gu: 'એ.સી. રિપેર',         bn: 'এসি মেরামত',               ta: 'ஏசி பழுது',              te: 'ఏసీ మరమ్మత్తు' },
  'ac repair':     { hi: 'एसी सर्विस',       mr: 'एसी दुरुस्ती',       gu: 'એ.સી. રિપેર',         bn: 'এসি মেরামত',               ta: 'ஏசி பழுது',              te: 'ఏసీ మరమ్మత్తు' },
  'repairing':     { hi: 'मरम्मत',            mr: 'दुरुस्ती',            gu: 'રિપેરિંગ',             bn: 'মেরামত',                   ta: 'பழுது பார்த்தல்',        te: 'మరమ్మత్తు' },
  'carwashing':    { hi: 'कार धुलाई',         mr: 'कार वॉशिंग',          gu: 'કાર ધોવા',             bn: 'গাড়ি ধোয়া',               ta: 'கார் கழுவுதல்',          te: 'కార్ వాషింగ్' },
  'car washing':   { hi: 'कार धुलाई',         mr: 'कार वॉशिंग',          gu: 'કાર ધોવા',             bn: 'গাড়ি ধোয়া',               ta: 'கார் கழுவுதல்',          te: 'కార్ వాషింగ్' },
  'plumber':       { hi: 'प्लंबर',            mr: 'प्लंबर',              gu: 'પ્લમ્બર',              bn: 'প্লাম্বার',                ta: 'குழாய் பணியாளர்',        te: 'ప్లంబర్' },
  'cleaning':      { hi: 'सफाई',              mr: 'स्वच्छता',            gu: 'સફાઈ',                 bn: 'পরিষ্কার',                 ta: 'சுத்தம் செய்தல்',        te: 'శుభ్రత' },
  'electrician':   { hi: 'इलेक्ट्रीशियन',    mr: 'इलेक्ट्रिशियन',       gu: 'ઈલેક્ટ્રિશ્યન',       bn: 'ইলেকট্রিশিয়ান',           ta: 'மின்னோட்டவாளர்',         te: 'ఎలక్ట్రీషియన్' },
  'salonandspa':   { hi: 'सैलून और स्पा',     mr: 'सलून आणि स्पा',       gu: 'સેલૂન અને સ્પા',       bn: 'সেলুন ও স্পা',             ta: 'சலூன் மற்றும் ஸ்பா',    te: 'సెలూన్ మరియు સ્પા' },
  'salon and spa': { hi: 'सैलून और स्पा',     mr: 'सलून आणि स्पा',       gu: 'સેલૂન અને સ્પા',       bn: 'সেলুন ও স্পা',             ta: 'சலூன் மற்றும் ஸ்பா',    te: 'సెలూన్ మరియు સ્પા' },
  'painter':       { hi: 'पेंटर',             mr: 'पेंटर',               gu: 'પેઈન્ટર',              bn: 'চিত্রশিল্পী',              ta: 'ஓவியர்',                 te: 'పెయింటర్' },
  'carpenter':     { hi: 'बढ़ई',              mr: 'सुतार',               gu: 'સુથાર',                bn: 'ছুতার',                    ta: 'தச்சர்',                 te: 'వడ్రంగి' },
  'bikeservices':  { hi: 'बाइक सर्विस',       mr: 'बाइक सर्व्हिस',       gu: 'બાઇક સર્વિસ',          bn: 'বাইক সার্ভিস',             ta: 'இருசக்கர வாகன சேவை',     te: 'బైక్ సర్వీస్' },
  'bike services': { hi: 'बाइक सर्विस',       mr: 'बाइक सर्व्हिस',       gu: 'બાઇક સર્વિસ',          bn: 'বাইক সার্ভিস',             ta: 'இருசக்கர வாகன சேவை',     te: 'બાઇક સર્વિસ' },
  'architecture':  { hi: 'वास्तुकला',         mr: 'आर्किटेक्चर',         gu: 'આર્કિટેક્ચર',          bn: 'স্থাপত্য',                 ta: 'கட்டிடக்கலை',             te: 'వాస్తుశిల్పం' },
  'contractor':    { hi: 'ठेकेदार',           mr: 'कंत्राटदार',          gu: 'કોન્ટ્રેક્ટર',         bn: 'ঠিকাদার',                  ta: 'ஒப்பந்தக்காரர்',         te: 'కాంట్రాక్టర్' },
  'mechanic':      { hi: 'मैकेनिक',           mr: 'मेकॅनिक',             gu: 'મિકેનિક',              bn: 'মেকানিক',                  ta: 'இயந்திர நிபுணர்',        te: 'మెకానిక్' },
  'panditji':      { hi: 'पंडित जी',          mr: 'पंडितजी',             gu: 'પંડિત જી',             bn: 'পণ্ডিত জি',                ta: 'பண்டிட் ஜி',             te: 'పండిత్ జీ' },
  'pandit ji':     { hi: 'पंडित जी',          mr: 'पंडितजी',             gu: 'પંડિત જી',             bn: 'পণ্ডিত જી',                ta: 'பண்டிட் ஜி',             te: 'పండిత్ జీ' },
  'driver':        { hi: 'ड्राइवर',           mr: 'चालक',                gu: 'ડ્રાઇવર',              bn: 'চালক',                     ta: 'ஓட்டுநர்',               te: 'డ్రైవర్' },
  'photographer':  { hi: 'फोटोग्राफर',        mr: 'फोटोग्राफर',          gu: 'ફોટોગ્રાફર',           bn: 'ফটোগ্রাফার',               ta: 'புகைப்படக்காரர்',        te: 'ఫోటోగ્રાફર' },
  'doctors':       { hi: 'डॉक्टर',            mr: 'डॉक्टर',              gu: 'ડૉક્ટર',               bn: 'ডাক্তার',                  ta: 'மருத்துவர்',              te: 'వైద్యుడు' },
  'compounder':    { hi: 'कम्पाउंडर',         mr: 'कंपाऊंडर',            gu: 'કમ્પાઉન્ડર',           bn: 'কম্পাউন্ডার',              ta: 'கம்பவுண்டர்',             te: 'కంపౌંડర్' },
  'halwai':        { hi: 'हलवाई',             mr: 'हलवाई',               gu: 'હલવાઈ',                bn: 'হালওয়াই',                  ta: 'ஹல்வாய்',                te: 'హల్వాయ్' },
  'pestcontrol':   { hi: 'कीट नियंत्रण',      mr: 'कीड नियंत्रण',        gu: 'જીવાત નિયંત્રણ',       bn: 'কীটনাশক নিয়ন্ত্রণ',       ta: 'பூச்சி கட்டுப்பாடு',     te: 'పురుగుమందు నియంత్రణ' },
  'pest control':  { hi: 'कीट नियंत्रण',      mr: 'कीड नियंत्रण',        gu: 'જીવાત નિયંત્રણ',       bn: 'কীটনাশક নিয়ন্ত্রণ',       ta: 'பூச்சி கட்டுப்பாடு',     te: 'పురుగుమందు నియంత్రణ' },
};

const SERVICE_TRANSLATIONS = {
  'tap repair':               { hi: 'नल मरम्मत', mr: 'नळ दुरुस्ती', gu: 'નળ સમારકામ', bn: 'কল মেরামত', ta: 'குழாய் பழுது', te: 'నల్లా మరమ్మత్తు', dhi: 'लीक टैप और पानी की समस्याओं को ठीक करना', dmr: 'गळती नळ आणि पाण्याच्या समस्या', dgu: 'લીક નળ ઠીક', dbn: 'লিক কল সমাধান', dta: 'கசியும் குழாய் சரிசெய்தல்', dte: 'లీక్ నల్లాలు మరమ్మత్తు' },
  'pipe fix':                 { hi: 'पाइप मरम्मत', mr: 'पाईप दुरुस्ती', gu: 'પાઇપ સમારકામ', bn: 'পাইপ মেরামত', ta: 'குழாய் பழுது', te: 'పైపు మరమ్మత్తు', dhi: 'टूटे पाइप की मरम्मत', dmr: 'खराब पाईप दुरुस्त', dgu: 'ક્ષતિગ્રસ્ત પાઇપ ઠીક', dbn: 'ক্ষতিগ্রস্ত পাইপ মেরামত', dta: 'சேதமடைந்த குழாய் சரிசெய்தல்', dte: 'దెబ్బతిన్న పైపులు మరమ్మత్తు' },
  'fan repair':               { hi: 'पंखा मरम्मत', mr: 'पंखा दुरुस्ती', gu: 'પંખો સમારકામ', bn: 'ফ্যান মেরামত', ta: 'மின்விசிறி பழுது', te: 'ఫ్యాన్ మరమ్మత్తు', dhi: 'पंखे की समस्याएं ठीक करें', dmr: 'पंख्याच्या समस्या', dgu: 'પંખાની સમસ્યા', dbn: 'ফ্যানের সমস্যা', dta: 'விசிறி சிக்கல் சரிசெய்தல்', dte: 'ఫ్యాన్ సమస్యలు' },
  'switch repair':            { hi: 'स्विच मरम्मत', mr: 'स्विच दुरुस्ती', gu: 'સ્વિચ સમારકામ', bn: 'সুইচ মেরামত', ta: 'சுவிட்ச் பழுது', te: 'స్విచ్ మరమ్మత్తు', dhi: 'स्विच और बोर्ड की मरम्मत', dmr: 'स्विच आणि बोर्ड', dgu: 'સ્વિચ ઠીક', dbn: 'সুইচ ও বোর্ড মেরামত', dta: 'சுவிட்ச் சரிசெய்தல்', dte: 'స్విచ్చులు మరమ్మత్తు' },
  'wiring work':              { hi: 'वायरिंग कार्य', mr: 'वायरिंग काम', gu: 'વાયરિંગ કામ', bn: 'তারের কাজ', ta: 'கம்பி வேலை', te: 'వైరింగ్ పని', dhi: 'पूरी वायरिंग सेटअप', dmr: 'संपूर्ण वायरिंग', dgu: 'સંપૂર્ણ વાયરિંગ', dbn: 'সম্পূর্ণ তারের সংযোগ', dta: 'முழுமையான கம்பி', dte: 'పూర్తి వైరింగ్ సెటప్' },
  'home cleaning':            { hi: 'घर की सफाई', mr: 'घर साफसफाई', gu: 'ઘરની સફાઈ', bn: 'বাড়ি পরিষ্কার', ta: 'வீட்டு சுத்தம்', te: 'ఇంటి శుభ్రత', dhi: 'पूरे घर की सफाई सेवा', dmr: 'संपूर्ण घर साफसफाई', dgu: 'સંપૂર્ણ ઘર સફાઈ', dbn: 'সম্পূর্ণ বাড়ি পরিষ্কার', dta: 'முழு வீட்டு சுத்தம்', dte: 'మొత్తం ఇంటి శుభ్రత' },
  'bathroom cleaning':        { hi: 'बाथरूम सफाई', mr: 'बाथरूम साफसफाई', gu: 'બાથરૂમ સફાઈ', bn: 'বাথরুম পরিষ্কার', ta: 'குளியலறை சுத்தம்', te: 'బాత్రూమ్ శుభ్రత', dhi: 'बाथरूम की गहरी सफाई', dmr: 'बाथरूमची खोल साफसफाई', dgu: 'ઊંડી સફાઈ', dbn: 'গভীর বাথরুম পরিষ্কার', dta: 'ஆழமான குளியலறை சுத்தம்', dte: 'లోతైన బాత్రూమ్ శుభ్రత' },
  'sofa & carpet cleaning':   { hi: 'सोफा और कार्पेट सफाई', mr: 'सोफा आणि कार्पेट साफसफाई', gu: 'સોફા અને કાર્પેટ સફાઈ', bn: 'সোফা ও কার্পেট পরিষ্কার', ta: 'சோஃபா மற்றும் கம்பளம் சுத்தம்', te: 'సోఫా మరియు కార్పెట్ శుభ్రత', dhi: 'सोफा और कालीन की भाप से सफाई', dmr: 'स्टीम क्लिनिंग', dgu: 'સ્ટીમ સફાઈ', dbn: 'স্টিম ক্লিনিং', dta: 'நீராவி சுத்தம்', dte: 'స్టీమ్ క్లీనింగ్' },
  'window cleaning':          { hi: 'खिड़की सफाई', mr: 'खिडकी साफसफाई', gu: 'બારી સફાઈ', bn: 'জানালা পরিষ্কার', ta: 'ஜன்னல் சுத்தம்', te: 'కిటికీ శుభ્રత', dhi: 'शीशे की अंदर-बाहर धुलाई', dmr: 'काच धुणे', dgu: 'કાચ ધોવા', dbn: 'কাচ ধোয়া', dta: 'கண்ணாடி சுத்தம்', dte: 'அద్దాలు శుభ్రత' },
  'ac service':               { hi: 'एसी सर्विस', mr: 'एसी सर्व्हिस', gu: 'એ.સી. સર્વિસ', bn: 'এসি সার্ভিস', ta: 'ஏசி சேவை', te: 'ఏసీ సర్వీస్', dhi: 'एसी की पूरी सर्विसिंग', dmr: 'एसीची संपूर्ण सर्व्हिसिंग', dgu: 'AC ની સંપૂર્ણ સર્વિસ', dbn: 'এসির সম্পূর্ণ সার্ভিসিং', dta: 'ஏசியின் முழுமையான சேவை', dte: 'ఏసీ పూర్తి సర్వీసింగ్' },
  'ac repair':                { hi: 'एसी मरम्मत', mr: 'एसी दुरुस्ती', gu: 'એ.સી. રિપેર', bn: 'এসি মেরামত', ta: 'ஏசி பழுது', te: 'ఏసీ మరమ్మత్తు', dhi: 'एसी की खराबी ठीक करें', dmr: 'एसी दुरुस्त', dgu: 'AC ખામી ઠીક', dbn: 'এসির ত্রুটি সমাধান', dta: 'ஏசி கோளாறு சரிசெய்தல்', dte: 'ఏసీ లోపాలు సరిచేయడం' },
  'ac installation':          { hi: 'एसी इंस्टॉलेशन', mr: 'एसी इन्स्टॉलेशन', gu: 'AC ઇન્સ્ટોલેશન', bn: 'এসি ইনস্টলেশন', ta: 'ஏசி நிறுவுதல்', te: 'ఏసీ ఇన్‌స్టాలేషన్', dhi: 'नया एसी लगाएं', dmr: 'नवीन एसी लावणे', dgu: 'નવું AC લગાડવું', dbn: 'নতুন এসি লাগানো', dta: 'புதிய ஏசி நிறுவுதல்', dte: 'కొత్త ఏసీ అమర్చడం' },
  'ac gas refill':            { hi: 'एसी गैस रिफिल', mr: 'एसी गॅस रिफिल', gu: 'AC ગેસ રિફિલ', bn: 'এসি গ্যাস রিফিল', ta: 'ஏசி வாயு நிரப்புதல்', te: 'ఏసీ గ్యాస్ రీఫિલ', dhi: 'एसी में गैस भरवाएं', dmr: 'एसीमध्ये गॅस भरणे', dgu: 'AC ગેસ ભરો', dbn: 'এসিতে গ্যাস ভরা', dta: 'ஏசியில் வாயு நிரப்புதல்', dte: 'ఏసీలో గ్యాస్ నింపడం' },
  'wall painting':            { hi: 'दीवार पेंटिंग', mr: 'भिंत रंगकाम', gu: 'દીવાલ પેઈન્ટ', bn: 'দেওয়াল রং', ta: 'சுவர் வர்ணம்', te: 'గోడ పెయింటిંગ', dhi: 'घर की दीवारें पेंट करें', dmr: 'घराच्या भिंती रंगवणे', dgu: 'ઘરની દીવાલ રંગ', dbn: 'বাড়ির দেওয়াল রং', dta: 'வீட்டு சுவர் வர்ணிக்கவும்', dte: 'ఇంటి గోడలు రంగు వేయడం' },
  'waterproofing':            { hi: 'वॉटरप्रूफिंग', mr: 'वॉटरप्रूफिंग', gu: 'વોટરપ્રૂફિંગ', bn: 'ওয়াটারপ্রুফিং', ta: 'நீர்ஊடுருவா பூச்சு', te: 'వాటర్‌ప్రూఫింగ్', dhi: 'पानी से दीवारों की सुरक्षा', dmr: 'पाण्यापासून संरक्षण', dgu: 'પાણીથી સુરક્ષા', dbn: 'জল থেকে সুরক্ষা', dta: 'சுவர்களை தண்ணீரிலிருந்து பாதுகாத்தல்', dte: 'నీటి నుండి గోడలను రక్షించడం' },
  'furniture repair':         { hi: 'फर्नीचर मरम्मत', mr: 'फर्निचर दुरुस्ती', gu: 'ફર્નિચર સમારકામ', bn: 'আসবাবপত্র মেরামত', ta: 'தளவாட பழுது', te: 'ఫర్నిచర్ మరమ్మత్తు', dhi: 'टूटे फर्नीचर की मरम्मत', dmr: 'तुटलेले फर्निचर', dgu: 'તૂટેલ ફર્નિચર', dbn: 'ভাঙা আসবাব ঠিক', dta: 'உடைந்த தளவாடங்கள் சரிசெய்தல்', dte: 'విరిగిన ఫర్నిచర్ మరమ్మత్తు' },
  'cockroach control':        { hi: 'तिलचट्टा नियंत्रण', mr: 'झुरळ नियंत्रण', gu: 'વંદો નિયંત્રણ', bn: 'তেলাপোকা নিয়ন্ত্রণ', ta: 'கரப்பான் பூச்சி கட்டுப்பாடு', te: 'బొద్దింక నియంత్రణ', dhi: 'घर में तिलचट्टों से छुटकारा', dmr: 'झुरळांपासून मुक्ती', dgu: 'વંદોથી છુટકારો', dbn: 'তেলাপোকામુક્ત ঘর', dta: 'கரப்பான் பூச்சிகள் அகற்றுதல்', dte: 'బొద్దింకల నుండి విముక్తి' },
  'bed bug control':          { hi: 'खटमल नियंत्रण', mr: 'बेड बग नियंत्रण', gu: 'ખાટમલ નિયંત્રણ', bn: 'ছারপোকা নিয়ন্ত্রণ', ta: 'படுக்கை பூச்சி கட்டுப்பாடு', te: 'మంచం పురుగుల నియంత్రణ', dhi: 'खटमल का पूरा सफाया', dmr: 'बेड बगचे निर्मूलन', dgu: 'ખાટમલ સફાયા', dbn: 'ছারপোকা নির্মূল', dta: 'படுக்கை பூச்சிகளை அகற்றுதல்', dte: 'మంచం పురుగులను నిర్మూలించడం' },
  'termite control':          { hi: 'दीमक नियंत्रण', mr: 'वाळवी नियंत्रण', gu: 'ઉધઈ નિયંત્રણ', bn: 'উইপোকা নিয়ন্ত্রণ', ta: 'கரையான் கட்டுப்பாடு', te: 'చెదలు నియంత్రణ', dhi: 'दीमक का पूरा उपचार', dmr: 'वाळवीचे उपचार', dgu: 'ઉધઈ ઉપચાર', dbn: 'উইপোকার সম্পূর্ণ চিকিৎসা', dta: 'கரையான் சிகிச்சை', dte: 'చెదల సంపూర్ణ చికిత్స' },
  'haircut':                  { hi: 'बाल कटाई', mr: 'केस कापणे', gu: 'વાળ કાપવા', bn: 'চুল কাটা', ta: 'முடி வெட்டல்', te: 'హేర్‌కట్', dhi: 'पेशेवर बाल कटाई', dmr: 'व्यावसायिक केस कापणे', dgu: 'વ્યાવસાયિક વાળ કાપવા', dbn: 'পেশাদার চুল কাটা', dta: 'தொழில்முறை முடி வெட்டல்', dte: 'వృత్తిపర హేర్‌కట్' },
  'facial':                   { hi: 'फेशियल', mr: 'फेशियल', gu: 'ફેશિયલ', bn: 'ফেসিয়াল', ta: 'முக சுத்தம்', te: 'ఫేషియల్', dhi: 'चेहरे की देखभाल और सफाई', dmr: 'चेहऱ्याची काळजी', dgu: 'ચહેરાની સંભાળ', dbn: 'মুখের যত্ন', dta: 'முகம் பராமரிப்பு', dte: 'ముఖ సంరక్షణ' },
  'massage':                  { hi: 'मालिश', mr: 'मालिश', gu: 'માલિશ', bn: 'মালিশ', ta: 'மசாஜ்', te: 'మసాஜ்', dhi: 'पूरे शरीर की मालिश', dmr: 'संपूर्ण शरीर मालिश', dgu: 'સંપૂર્ણ શરીર માલિશ', dbn: 'সম্পૂર્ણ শরীরের মালিশ', dta: 'முழு உடல் மசாஜ்', dte: 'పూర్తి శరీర మసాజ్' },
  'bike repair':              { hi: 'बाइक मरम्मत', mr: 'बाइक दुरुस्ती', gu: 'બાઇક સમારકામ', bn: 'বাইક মেরামত', ta: 'இருசக்கர வாகன பழுது', te: 'బైక్ మరమ్మత్తు', dhi: 'बाइक की सभी समस्याएं ठीक', dmr: 'बाइकच्या समस्या', dgu: 'બાઇકની સમસ્યાઓ', dbn: 'বাইকের সব সমস্যা', dta: 'இருசக்கர வாகன சிக்கல்கள்', dte: 'బైక్ అన్ని సమస్యలు' },
  'oil change':               { hi: 'ऑयल बदलाव', mr: 'ऑइल बदलणे', gu: 'ઓઇલ બદલવું', bn: 'তেল পরিবর্তন', ta: 'எண்ணெய் மாற்றம்', te: 'ఆయిల్ మార్పు', dhi: 'गाड़ी का ऑयल बदलवाएं', dmr: 'गाडीचे ऑइल बदलणे', dgu: 'ગાડીનું ઓઇલ બદલો', dbn: 'গাড়ির তেল পরিবর্তন', dta: 'வாகன எண்ணெய் மாற்றம்', dte: 'వాహనం ఆయిల్ మార్పు' },
  'car wash':                 { hi: 'कार धुलाई', mr: 'कार धुणे', gu: 'કાર ધોવા', bn: 'গাড়ি ধোয়া', ta: 'கார் கழுவுதல்', te: 'કાર્ వాష్', dhi: 'कार की पूरी धुलाई', dmr: 'कार संपूर्ण धुणे', dgu: 'કાર ધોવી', dbn: 'গাড়ির সম্পূর্ণ পরিষ্কার', dta: 'கார் முழு கழுவுதல்', dte: 'కార్ పూర్తి కడగడం' },
  'interior cleaning':        { hi: 'इंटीरियर सफाई', mr: 'आतील भाग साफसफाई', gu: 'ઇન્ટીરિયર સફાઈ', bn: 'অভ্যন্তরীণ পরিষ্কার', ta: 'உட்புற சுத்தம்', te: 'ఇంటీరిયર క్లీనిંગ', dhi: 'गाड़ी के अंदर की सफाई', dmr: 'गाडीच्या आतील भागाची साफसफाई', dgu: 'કારની અંદરની સફાઈ', dbn: 'গাড়ির ভেতর পরিষ্কার', dta: 'வாகனத்தின் உட்புறம் சுத்தம்', dte: 'కార్ లోపల శుభ్రత' },
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
  const baseName = row.name || row.title || row.categoryName || row.category_name || '';
  let localizedName = '';

  if (normalizedLang !== 'en' && SUPPORTED_LANGS.includes(normalizedLang)) {
    localizedName = row[`name_${normalizedLang}`] || row[`title_${normalizedLang}`] || '';
    if (!localizedName && baseName) {
      const cleanKey = baseName.toLowerCase().replace(/[\s\-_]/g, '');
      const trans = CATEGORY_TRANSLATIONS[cleanKey] || CATEGORY_TRANSLATIONS[baseName.toLowerCase().trim()];
      if (trans && trans[normalizedLang]) {
        localizedName = trans[normalizedLang];
      }
    }
  }

  const finalName = localizedName || baseName;
  return {
    ...row,
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
  CATEGORY_TRANSLATIONS,
  SERVICE_TRANSLATIONS
};
