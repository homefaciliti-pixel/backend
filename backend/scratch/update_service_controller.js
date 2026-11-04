const fs = require('fs');
const path = 'controllers/service.controller.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add getUnifiedServices import
if (!content.includes('getUnifiedServices')) {
  content = content.replace(
    "const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('../services/adminBackend.service');",
    "const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('../services/adminBackend.service');\nconst { getUnifiedServices } = require('../services/category.service');"
  );
}

// 2. Replace getTrendingServices with live admin primary
const newGetTrending = `const getTrendingServices = async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;

  // 1. Live Admin Services (Primary Source)
  try {
    const adminSrvs = await getUnifiedServices(serverBaseUrl);
    if (adminSrvs && adminSrvs.length > 0) {
      const highlighted = adminSrvs.filter(s => s.isHighlighted === 'true' || s.isHighlighted === true || s.isHighlighted === 1);
      const others = adminSrvs.filter(s => s.isHighlighted !== 'true' && s.isHighlighted !== true && s.isHighlighted !== 1);
      const trendingList = [...highlighted, ...others].slice(0, 20);
      return res.json({
        success: true,
        services: resolveServiceUrls(trendingList, serverBaseUrl).map(s => localizeService(s, req.lang))
      });
    }
  } catch (err) {
    console.warn("[getTrendingServices] Live admin fetch failed, falling back:", err.message);
  }

  let trendingList = [];`;

content = content.replace(/const getTrendingServices = async \(req, res\) => {[\s\S]*?let trendingList = \[\];/, newGetTrending);

// 3. Update getCategoryServices with live admin primary
const newGetCategoryServices = `const getCategoryServices = async (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const normCatStr = (s) => (s || '').toString().toLowerCase()
    .replace(/&/g, 'and')
    .replace(/cater'?s?/g, 'halwai')
    .replace(/[\\s\\-_']/g, '');

  const cleanCategory = normCatStr(category);

  const STATIC_CAT_ID_MAP = {
    '1': 'Plumber',
    '3': 'Electrician',
    '5': 'Salon',
    '7': 'Cleaning',
    '9': 'Architect',
    '11': 'Carpenter',
    '27': 'Car Washing',
    '29': 'Mechanic',
    '37': 'Spa',
    '38': 'AC Repair',
    '40': 'Compounder',
    '41': "Cater's",
    '42': 'Driver',
    '43': 'Doctor',
    '46': 'Pest Control',
    '48': 'Photographer',
    '49': 'Painter',
    '50': 'Repairing',
    '57': 'Contractor',
    '58': 'Pandit Ji',
    '60': 'Iron Works',
    '61': 'Plumber'
  };

  let mappedCatName = STATIC_CAT_ID_MAP[category.trim()] || category;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;

  const statusParam = req.query.status || req.body.status;
  const isAmcMode = statusParam === "AMC";

  let dbServices = [];
  let matchedCatTitle = mappedCatName;

  // 1. Live Admin Backend Services (Primary source of truth)
  try {
    const allUnified = await getUnifiedServices(serverBaseUrl);
    const adminCats = await fetchAdminBackendCategories();
    const catMap = {};
    (adminCats || []).forEach(c => { catMap[String(c.id)] = c.name || c.title || ''; });

    const matchedAdminCat = (adminCats || []).find(c => {
      const cId = String(c.id);
      const cName = normCatStr(c.name || c.title);
      return cId === category || cName === cleanCategory || cName === normCatStr(mappedCatName);
    });

    const targetCatId = matchedAdminCat ? String(matchedAdminCat.id) : category;
    const targetCatName = matchedAdminCat ? (matchedAdminCat.name || matchedAdminCat.title) : mappedCatName;

    const matchedAdminServices = allUnified.filter(s => {
      const sCatId = String(s.category_id || s.categoryId || s.category || '');
      const sCatName = normCatStr(s.categoryName || s.cat_name || catMap[sCatId] || s.category || '');
      return sCatId === targetCatId || sCatId === category || sCatName === cleanCategory || sCatName === normCatStr(targetCatName) || sCatName === normCatStr(mappedCatName);
    });

    if (matchedAdminServices.length > 0) {
      dbServices = matchedAdminServices;
      matchedCatTitle = targetCatName;
    }
  } catch (err) {
    console.warn("[getCategoryServices] Admin fetch failed, falling back:", err.message);
  }

  // 2. Check MySQL if available and admin returned nothing
  if (dbServices.length === 0 && getMysqlReady()) {`;

content = content.replace(/const getCategoryServices = async \(req, res\) => {[\s\S]*?\/\/ 1\. Check MySQL if available[\s\S]*?if \(getMysqlReady\(\)\) {/, newGetCategoryServices);

// 4. Update getAllServices with live admin primary
const newGetAllServices = `const getAllServices = async (req, res) => {
  const category = req.query.category || req.query.category_id || req.query.categoryId;
  const subCategory = req.query.sub_category_id || req.query.subCategoryId || req.query.subcategory_id;
  const search = req.query.search;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;

  // 1. Fetch live unified services (Admin backend primary)
  try {
    const allUnified = await getUnifiedServices(serverBaseUrl);
    if (allUnified && allUnified.length > 0) {
      let filtered = allUnified;
      if (category) {
        const cleanCat = String(category).toLowerCase().replace(/[\\s\\-_]/g, '');
        filtered = filtered.filter(s => {
          const sCatId = String(s.category_id || s.categoryId || s.category || '').toLowerCase();
          const sCatName = String(s.categoryName || s.cat_name || s.category || '').toLowerCase().replace(/[\\s\\-_]/g, '');
          return sCatId === String(category).toLowerCase() || sCatName === cleanCat || sCatName.includes(cleanCat) || cleanCat.includes(sCatName);
        });
      }
      if (subCategory) {
        const subNorm = String(subCategory).toLowerCase().trim();
        filtered = filtered.filter(s =>
          String(s.sub_category_id || s.subCategoryId || s.subCategory || s.sub_category || s.id || '').toLowerCase().trim() === subNorm ||
          String(s.sub_category_id || s.subCategoryId || '').toLowerCase().includes(subNorm)
        );
      }
      if (search) {
        const query = search.toString().toLowerCase();
        filtered = filtered.filter(s =>
          (s.title || s.name || '').toLowerCase().includes(query) ||
          (s.description || '').toLowerCase().includes(query)
        );
      }
      return res.json({
        success: true,
        services: resolveServiceUrls(filtered, serverBaseUrl).map(s => localizeService(s, req.lang))
      });
    }
  } catch (err) {
    console.warn("[getAllServices] Live admin fetch failed, falling back:", err.message);
  }

  const cleanCategory = category ? category.toLowerCase().replace(/[\\s\\-_]/g, '') : "";`;

content = content.replace(/const getAllServices = async \(req, res\) => {[\s\S]*?const cleanCategory = category \? category\.toLowerCase\(\)\.replace\(\/\[\\s\\-_\]\/g, ''\) : "";/, newGetAllServices);

// 5. Update handleServiceDetail with live admin primary
const newHandleServiceDetail = `const handleServiceDetail = async (req, res) => {
  const title = req.params.title || req.query.title;
  if (!title) {
    return res.status(400).json({ success: false, error: "Service title is required" });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;

  const statusParam = req.query.status || req.body.status;
  const isAmcMode = statusParam === "AMC";

  const normProduct = String(title).toLowerCase().replace(/[\\s\\-_]/g, '');
  const prodStr = String(title).trim().toLowerCase();

  // 1. Try Live Admin Services First
  try {
    const allServices = await getUnifiedServices(serverBaseUrl);
    const matched = allServices.find(s => {
      const sId = String(s.id || s.serviceId || '');
      const sTitle = String(s.title || s.name || '').trim().toLowerCase();
      const sNorm = sTitle.replace(/[\\s\\-_]/g, '');
      return sId === String(title) || sTitle === prodStr || sNorm === normProduct;
    });

    if (matched) {
      const enrichedService = { ...matched };
      if (isAmcMode) {
        enrichedService.price = 0;
        enrichedService.status = "AMC";
      }
      return res.json({
        success: true,
        data: localizeService(enrichedService, req.lang),
        service: localizeService(enrichedService, req.lang),
        status: isAmcMode ? "AMC" : "Regular",
        message: translate("service_details_retrieved", req.lang)
      });
    }
  } catch (err) {
    console.warn("[handleServiceDetail] Live admin search failed:", err.message);
  }

  let hasActiveAmc = false;
  let detectedCategory = null;`;

content = content.replace(/const handleServiceDetail = async \(req, res\) => {[\s\S]*?let hasActiveAmc = false;\s*let detectedCategory = null;/, newHandleServiceDetail);

// 6. Update searchServices with live admin primary
const newSearchServices = `const searchServices = async (req, res) => {
  const searchTerm = req.query.q || req.query.search || req.query.query;
  if (!searchTerm || searchTerm.trim() === '') {
    return res.json({ success: true, services: [], categories: [] });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;

  const lowerTerm = searchTerm.toLowerCase().trim();

  // 1. Live Admin Backend Search (Primary)
  try {
    const allServices = await getUnifiedServices(serverBaseUrl);
    const adminCats = await fetchAdminBackendCategories();

    const matchedServices = allServices.filter(s =>
      (s.title || s.name || '').toLowerCase().includes(lowerTerm) ||
      (s.description || '').toLowerCase().includes(lowerTerm) ||
      (s.categoryName || '').toLowerCase().includes(lowerTerm) ||
      (s.subCategory || '').toLowerCase().includes(lowerTerm)
    );

    const matchedCategories = (adminCats || []).filter(c =>
      (c.title || c.name || '').toLowerCase().includes(lowerTerm)
    ).map(c => ({
      id: String(c.id),
      name: c.title || c.name,
      image: c.image || ''
    }));

    if (matchedServices.length > 0 || matchedCategories.length > 0) {
      return res.json({
        success: true,
        query: searchTerm,
        results: {
          categories: matchedCategories,
          services: resolveServiceUrls(matchedServices, serverBaseUrl).map(s => localizeService(s, req.lang)),
          totalCategories: matchedCategories.length,
          totalServices: matchedServices.length
        },
        services: resolveServiceUrls(matchedServices, serverBaseUrl).map(s => localizeService(s, req.lang)),
        categories: matchedCategories
      });
    }
  } catch (err) {
    console.warn("[searchServices] Live admin search failed, falling back:", err.message);
  }

  if (getDbMode() === "mysql" && getMysqlReady()) {`;

content = content.replace(/const searchServices = async \(req, res\) => {[\s\S]*?if \(getDbMode\(\) === "mysql" && getMysqlReady\(\)\) {/, newSearchServices);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated service.controller.js successfully!');
