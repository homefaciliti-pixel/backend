const { DbLayer } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { SERVICES_DATA, CATEGORIES_DATA, DEFAULT_CATEGORIES } = require('../config/constants');
const { getLocalCategoryAssetUrl, getHdFallbackServiceImageUrl, sanitizeServiceDbObj, resolveServiceUrls } = require('../utils/imageHelpers');
const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('../services/adminBackend.service');
const { getUnifiedServices } = require('../services/category.service');
const { localizeService, localizeCategory } = require('../helpers/contentI18n');
const { translate } = require('../helpers/translate');
const { shuffleArray, readDataFromJsonDb } = require('../utils/helpers');

const getTrendingServices = async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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

  let trendingList = [];

  // 1. Try MySQL Database
  if (getMysqlReady()) {
    try {
      const [rows] = await getMysqlPool().query(
        "SELECT s.*, c.title as cat_name FROM node_services s LEFT JOIN node_categories c ON s.category_id = c.id WHERE s.status IN (0, 1) ORDER BY s.id ASC LIMIT 20"
      );
      if (rows && rows.length > 0) {
        trendingList = rows.map(r => {
          const sanitized = sanitizeServiceDbObj(r, serverBaseUrl);
          const catId = String(r.category_id || r.category || '1');
          const catName = String(r.cat_name || r.categoryName || r.category || 'Plumber');
          return {
            ...sanitized,
            categoryId: catId,
            category_id: catId,
            category: catId,
            categoryName: catName
          };
        });
      }
    } catch (err) {
      console.warn("[TrendingServices] MySQL query failed:", err.message);
    }
  }

  // 2. JSON Database Fallback
  if (trendingList.length === 0) {
    try {
      const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
      if (data && data.services && data.services.length > 0) {
        const cats = data.categories || [];
        const catMap = {};
        cats.forEach(c => { catMap[String(c.id)] = c.name || c.title; });

        trendingList = data.services.slice(0, 20).map(s => {
          const catId = String(s.category || s.categoryId || '1');
          const catName = String(s.categoryName || catMap[catId] || s.category || 'Service');
          return {
            ...s,
            id: String(s.id),
            serviceId: String(s.id),
            title: String(s.title || s.name || ''),
            name: String(s.name || s.title || ''),
            price: Number(s.price || 0),
            description: String(s.description || ''),
            categoryId: catId,
            category_id: catId,
            category: catId,
            categoryName: catName,
            image: s.image || "/uploads/1782367898826-830124248.jpg"
          };
        });
      }
    } catch (jsonErr) {
      console.warn("[TrendingServices] JSON fallback failed:", jsonErr.message);
    }
  }

  // 3. Guaranteed Static Fallback (Ensures backend NEVER returns 0 trending services)
  if (trendingList.length === 0) {
    trendingList = [
      { id: "101", serviceId: "101", title: "AC Foam Jet Service", price: 499, description: "Professional foam jet deep cleaning for your AC", category: "38", categoryId: "38", category_id: "38", categoryName: "AC Repair", image: "/uploads/1782370871985-653299335.jpg" },
      { id: "102", serviceId: "102", title: "2BHK Deep Cleaning", price: 999, description: "Complete home deep cleaning by verified professionals", category: "7", categoryId: "7", category_id: "7", categoryName: "Cleaning", image: "/uploads/1782379281899-302488180.jpg" },
      { id: "103", serviceId: "103", title: "House Wiring Electrician", price: 699, description: "Expert electrician for all electrical installation & repair", category: "3", categoryId: "3", category_id: "3", categoryName: "Electrician", image: "/uploads/1782368297524-943557893.jpg" },
      { id: "104", serviceId: "104", title: "professional Plumber", price: 499, description: "Fix pipe leakages, taps, and plumbing installations", category: "1", categoryId: "1", category_id: "1", categoryName: "Plumber", image: "/uploads/1782367898826-830124248.jpg" },
      { id: "105", serviceId: "105", title: "Women Haircut", price: 249, description: "Professional salon services at your doorstep", category: "5", categoryId: "5", category_id: "5", categoryName: "Salon", image: "/uploads/1782392839781-267721012.jpg" },
      { id: "106", serviceId: "106", title: "Basic Car Wash (Exterior Only)", price: 249, description: "Exterior car body wash with shampoo and tyre cleaning", category: "27", categoryId: "27", category_id: "27", categoryName: "Car Washing", image: "/uploads/1782369487901-215785215.jpg" }
    ];
  }

  const finalTrending = resolveServiceUrls(trendingList, serverBaseUrl).map(s => {
    const catId = String(s.categoryId || s.category_id || s.category || '1');
    return {
      ...s,
      categoryId: catId,
      category_id: catId,
      category: catId
    };
  });

  res.json({
    success: true,
    total: finalTrending.length,
    services: finalTrending,
    data: finalTrending
  });
};
const getCategoryServices = async (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const normCatStr = (s) => (s || '').toString().toLowerCase()
    .replace(/&/g, 'and')
    .replace(/cater'?s?/g, 'halwai')
    .replace(/[\s\-_']/g, '');

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
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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
  if (dbServices.length === 0 && getMysqlReady()) {
    try {
      const [catRows] = await getMysqlPool().query(
        "SELECT * FROM node_categories WHERE LOWER(title) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ? OR LOWER(title) = ?",
        [category.toLowerCase(), isNaN(category) ? -1 : parseInt(category), cleanCategory, mappedCatName.toLowerCase()]
      );

      if (catRows.length > 0) {
        const cat = catRows[0];
        let queryStr = "SELECT * FROM node_services WHERE category_id = ? AND status IN (0, 1)";
        const queryParams = [cat.id];

        if (search) {
          queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
          const term = `%${search.toString().toLowerCase()}%`;
          queryParams.push(term, term);
        }

        const [srvRows] = await getMysqlPool().query(queryStr, queryParams);
        dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
      }
    } catch (err) {
      console.warn("[DynamicServices] DB query failed:", err.message);
    }
  }

  // 2. Check database.json
  let jsonServices = [];
  matchedCatTitle = mappedCatName;

  try {
    const data = readDataFromJsonDb();
    if (data && data.categories && data.services) {
      const cats = data.categories || [];
      const catObj = cats.find(c => 
        c.id.toString() === category.toString() || 
        (c.name && c.name.toLowerCase() === category.toLowerCase()) ||
        (c.title && c.title.toLowerCase() === category.toLowerCase()) ||
        (c.name && normCatStr(c.name) === cleanCategory) ||
        (c.title && normCatStr(c.title) === cleanCategory) ||
        (c.name && normCatStr(c.name) === normCatStr(mappedCatName)) ||
        (c.name && (normCatStr(c.name).includes(cleanCategory) || cleanCategory.includes(normCatStr(c.name)))) ||
        c.id.toString() === cleanCategory
      );

      if (catObj) {
        matchedCatTitle = catObj.name || catObj.title || mappedCatName;
        const catIdStr = catObj.id.toString();
        const catNameClean = normCatStr(matchedCatTitle);
        jsonServices = data.services.filter(s => {
          if (!s || !s.category) return false;
          const sCatStr = s.category.toString();
          const sCatClean = normCatStr(sCatStr);
          return sCatStr === catIdStr || sCatClean === catNameClean || sCatClean === cleanCategory || sCatClean === normCatStr(mappedCatName);
        });
      }
    }
  } catch (err) {
    console.warn("Failed to load category services from JSON database fallback:", err.message);
  }

  // 3. Resolve static SERVICES_DATA
  const cleanMatchedCat = normCatStr(matchedCatTitle);
  const matchedCategoryKey = Object.keys(SERVICES_DATA).find(
    key => normCatStr(key) === cleanMatchedCat ||
           normCatStr(key) === cleanCategory ||
           normCatStr(key).includes(cleanCategory) ||
           cleanCategory.includes(normCatStr(key))
  );
  let staticServices = matchedCategoryKey ? SERVICES_DATA[matchedCategoryKey] : [];

  if (search) {
    const query = search.toString().toLowerCase();
    staticServices = staticServices.filter(
      s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
    jsonServices = jsonServices.filter(
      s => (s.title || s.name || '').toLowerCase().includes(query) || (s.description || '').toLowerCase().includes(query)
    );
  }

  // 4. Merge DB, JSON, and Static services avoiding duplicate titles
  const existingTitles = new Set(dbServices.map(s => (s.title || s.name || '').toLowerCase()));
  
  for (const js of jsonServices) {
    const titleKey = (js.title || js.name || '').toLowerCase();
    if (titleKey && !existingTitles.has(titleKey)) {
      existingTitles.add(titleKey);
      dbServices.push(js);
    }
  }

  for (const st of staticServices) {
    const titleKey = (st.title || st.name || '').toLowerCase();
    if (titleKey && !existingTitles.has(titleKey)) {
      existingTitles.add(titleKey);
      dbServices.push(st);
    }
  }

  if (dbServices.length === 0) {
    return res.status(404).json({
      success: false,
      error: `Category '${category}' not found`,
      availableCategories: CATEGORIES_DATA
    });
  }

  const finalServices = resolveServiceUrls(dbServices, serverBaseUrl).map(s => {
    if (isAmcMode) {
      return { ...s, price: 0, status: "AMC" };
    }
    return s;
  });

  const localizedFinalServices = finalServices.map(s => localizeService(s, req.lang));
  const catLocalized = localizeCategory({ id: category, name: matchedCatTitle, title: matchedCatTitle }, req.lang);

  res.json({
    success: true,
    category: catLocalized.name || catLocalized.title,
    status: isAmcMode ? "AMC" : "Regular",
    total: localizedFinalServices.length,
    services: localizedFinalServices
  });
};
const getAllServices = async (req, res) => {
  const category = req.query.category || req.query.category_id || req.query.categoryId;
  const subCategory = req.query.sub_category_id || req.query.subCategoryId || req.query.subcategory_id;
  const search = req.query.search;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  // 1. Fetch live unified services (Admin backend primary)
  try {
    const allUnified = await getUnifiedServices(serverBaseUrl);
    if (allUnified && allUnified.length > 0) {
      let filtered = allUnified;
      if (category) {
        const cleanCat = String(category).toLowerCase().replace(/[\s\-_]/g, '');
        filtered = filtered.filter(s => {
          const sCatId = String(s.category_id || s.categoryId || s.category || '').toLowerCase();
          const sCatName = String(s.categoryName || s.cat_name || s.category || '').toLowerCase().replace(/[\s\-_]/g, '');
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

  const cleanCategory = category ? category.toLowerCase().replace(/[\s\-_]/g, '') : "";

  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      let queryStr = "SELECT * FROM node_services WHERE status IN (0, 1)";
      const queryParams = [];

      if (category) {
        // Try to resolve category ID
        const [catRows] = await getMysqlPool().query(
          "SELECT id FROM node_categories WHERE LOWER(title) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ?",
          [category.toLowerCase(), isNaN(category) ? -1 : parseInt(category), cleanCategory]
        );
        if (catRows.length > 0) {
          queryStr += " AND category_id = ?";
          queryParams.push(catRows[0].id);
        } else {
          queryStr += " AND category_id = -1";
        }
      }

      if (subCategory) {
        queryStr += " AND (sub_category_id = ? OR sub_category = ?)";
        queryParams.push(String(subCategory), String(subCategory));
      }

      if (search) {
        queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
        const term = `%${search.toString().toLowerCase()}%`;
        queryParams.push(term, term);
      }

      let srvRows = [];
      try {
        const [rows] = await getMysqlPool().query(queryStr, queryParams);
        srvRows = rows;
      } catch (colErr) {
        // If sub_category_id column doesn't exist in MySQL table, query without it and filter in memory
        let fallbackQueryStr = "SELECT * FROM node_services WHERE status IN (0, 1)";
        const fallbackParams = [];
        if (category) {
          const [catRows] = await getMysqlPool().query(
            "SELECT id FROM node_categories WHERE LOWER(title) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ?",
            [category.toLowerCase(), isNaN(category) ? -1 : parseInt(category), cleanCategory]
          );
          if (catRows.length > 0) {
            fallbackQueryStr += " AND category_id = ?";
            fallbackParams.push(catRows[0].id);
          } else {
            fallbackQueryStr += " AND category_id = -1";
          }
        }
        if (search) {
          fallbackQueryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
          fallbackParams.push(`%${search.toString().toLowerCase()}%`, `%${search.toString().toLowerCase()}%`);
        }
        const [rows] = await getMysqlPool().query(fallbackQueryStr, fallbackParams);
        srvRows = rows;
      }
      let dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));

      // Merge with static services
      let staticList = [];
      if (category) {
        const matchedStaticCategory = Object.keys(SERVICES_DATA).find(
          key => key.toLowerCase().replace(/[\s\-_]/g, '') === cleanCategory
        );
        if (matchedStaticCategory) {
          staticList = SERVICES_DATA[matchedStaticCategory] || [];
        }
      } else {
        staticList = Object.values(SERVICES_DATA).flat();
      }

      if (search) {
        const query = search.toString().toLowerCase();
        staticList = staticList.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      }

      const dbTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
      const uniqueStatic = staticList.filter(s => !dbTitles.has(s.title.toLowerCase()));
      let mergedServices = [...dbServices, ...uniqueStatic];

      if (subCategory) {
        const subNorm = String(subCategory).toLowerCase().trim();
        mergedServices = mergedServices.filter(s =>
          String(s.sub_category_id || s.subCategoryId || s.subCategory || s.sub_category || s.id || '').toLowerCase().trim() === subNorm ||
          String(s.sub_category_id || s.subCategoryId || '').toLowerCase().includes(subNorm)
        );
      }

      return res.json({
        success: true,
        services: resolveServiceUrls(mergedServices, serverBaseUrl).map(s => localizeService(s, req.lang))
      });
    } catch (err) {
      console.warn("[DynamicServices] DB query all failed, falling back to static:", err.message);
    }
  }

  // FALLBACK: Load from database.json if available
  let list = [];
  let loadedFromDb = false;
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      list = data.services;
      loadedFromDb = true;
      
      // Filter by category
      if (category) {
        const cats = data.categories || [];
        const matchedCat = cats.find(c => 
          c.id.toString() === category.toString() || 
          c.name.toLowerCase() === category.toLowerCase() || 
          c.id.toString() === cleanCategory
        );
        if (matchedCat) {
          list = list.filter(s => s.category.toString() === matchedCat.id.toString());
        } else {
          list = list.filter(s => s.category.toString() === category.toString());
        }
      }
    }
  } catch (err) {
    console.warn("Failed to load fallback services from JSON file:", err.message);
  }

  if (!loadedFromDb) {
    if (category) {
      const matchedStaticCategory = Object.keys(SERVICES_DATA).find(
        key => key.toLowerCase().replace(/[\s\-_]/g, '') === cleanCategory
      );
      list = shuffleArray(matchedStaticCategory ? SERVICES_DATA[matchedStaticCategory] : []);
    } else {
      list = shuffleArray(Object.values(SERVICES_DATA).flat());
    }
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  if (subCategory) {
    const subNorm = String(subCategory).toLowerCase().trim();
    list = list.filter(s => 
      String(s.sub_category_id || s.subCategoryId || s.subCategory || s.sub_category || s.id || '').toLowerCase().trim() === subNorm ||
      String(s.sub_category_id || s.subCategoryId || '').toLowerCase().includes(subNorm)
    );
  }
  res.json({ success: true, services: resolveServiceUrls(list, serverBaseUrl).map(s => localizeService(s, req.lang)) });
};
const getTrendingServicesAlt = async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  // Default AC Foam Jet Service fallback object
  let acFreeService = {
    productId: 'AC Foam Jet Service',
    title: 'AC Foam Jet Service',
    price: 499,
    description: 'Deep clean your AC with professional foam jet technology. Removes dust, bacteria & improves cooling efficiency.',
    image: `${serverBaseUrl}/assets/categories/ac_repair.png`,
    discount: 0,
    rating: 4.9,
    reviewsCount: 240,
    cutPrice: 499,
    category: 'AcRepair',
    highlights: []
  };

  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      // 1. Fetch dynamic details for "AC Foam Jet Service" if it exists in the database
      const [acRows] = await getMysqlPool().query("SELECT * FROM node_services WHERE title = 'AC Foam Jet Service' LIMIT 1");
      if (acRows.length > 0) {
        acFreeService = sanitizeServiceDbObj(acRows[0], serverBaseUrl);
      }

      // 2. Fetch 4 random other services
      const [srvRows] = await getMysqlPool().query("SELECT * FROM node_services WHERE status IN (0, 1) AND title != 'AC Foam Jet Service' ORDER BY RAND() LIMIT 4");
      const dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));

      // If less than 4 from DB, fill with static services
      if (dbServices.length < 4) {
        const allStatic = Object.values(SERVICES_DATA).flat();
        const shuffledStatic = shuffleArray(allStatic);
        const dbTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
        dbTitles.add('ac foam jet service');
        for (const s of shuffledStatic) {
          if (dbServices.length >= 4) break;
          if (!dbTitles.has(s.title.toLowerCase())) {
            dbServices.push(s);
            dbTitles.add(s.title.toLowerCase());
          }
        }
      }

      return res.json({ success: true, services: resolveServiceUrls([acFreeService, ...dbServices], serverBaseUrl).map(s => localizeService(s, req.lang)) });
    } catch (err) {
      console.warn("[DynamicServices] DB trending failed, falling back static:", err.message);
    }
  }

 const handleServiceDetail = async (req, res) => {
  try {
    const identifier =
      req.params.serviceId ||
      req.params.id ||
      req.params.title ||
      req.query.serviceId ||
      req.query.id ||
      req.query.title;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Service ID or title is required",
      });
    }

    const title = decodeURIComponent(
      String(identifier).trim()
    );

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]/g, "");

    const normalizedTitle = normalize(title);

    const isNumericId = /^\d+$/.test(title);

    const matchesService = (service) => {
      if (!service) return false;

      const fields = [
        service.id,
        service.serviceId,
        service.service_id,
        service.productId,
        service.product_id,
        service.title,
        service.name,
        service.slug,
      ];

      return fields.some((field) => {
        if (field === undefined || field === null) {
          return false;
        }

        return (
          String(field).trim() === title ||
          normalize(field) === normalizedTitle
        );
      });
    };

    const host = req.get("host");
    const protocol = req.protocol;

    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("10.0.2.2");

    const serverBaseUrl =
      `${isLocal ? protocol : "https"}://${host}`;

    const statusParam =
      req.query.status || req.body?.status;

    const isAmcMode = statusParam === "AMC";

    let foundService = null;

    // 1. Admin Backend
    try {
      const allServices =
        await getUnifiedServices(serverBaseUrl);

      if (Array.isArray(allServices)) {
        foundService =
          allServices.find(matchesService) || null;
      }
    } catch (err) {
      console.warn(
        "[ServiceDetail] Admin error:",
        err.message
      );
    }

    // 2. MySQL Database
    if (!foundService && getMysqlReady()) {
      try {
        let query = `
          SELECT *
          FROM node_services
          WHERE status IN (0, 1)
        `;

        let params = [];

        if (isNumericId) {
          query += " AND id = ?";
          params.push(Number(title));
        } else {
          query += `
            AND (
              LOWER(title) = ?
              OR LOWER(title_hi) = ?
              OR REPLACE(
                REPLACE(
                  REPLACE(LOWER(title), ' ', ''),
                  '-', ''
                ),
                '_', ''
              ) = ?
            )
          `;

          params.push(
            title.toLowerCase(),
            title.toLowerCase(),
            normalizedTitle
          );
        }

        query += " LIMIT 1";

        const [rows] =
          await getMysqlPool().query(query, params);

        if (rows.length > 0) {
          foundService = sanitizeServiceDbObj(
            rows[0],
            serverBaseUrl
          );
        }
      } catch (err) {
        console.warn(
          "[ServiceDetail] MySQL error:",
          err.message
        );
      }
    }

    // 3. JSON Database
    if (!foundService) {
      try {
        const data = readDataFromJsonDb();

        if (data && Array.isArray(data.services)) {
          foundService =
            data.services.find(matchesService) || null;

          if (foundService) {
            const categoryId =
              foundService.categoryId ||
              foundService.category_id ||
              foundService.category;

            const category = (
              data.categories || []
            ).find(
              (c) =>
                String(c.id) === String(categoryId)
            );

            foundService = {
              ...foundService,
              categoryId,
              categoryName:
                foundService.categoryName ||
                category?.name ||
                category?.title ||
                "",
            };
          }
        }
      } catch (err) {
        console.warn(
          "[ServiceDetail] JSON error:",
          err.message
        );
      }
    }

    // 4. Static Services
    if (!foundService) {
      for (const [categoryName, services] of Object.entries(
        SERVICES_DATA
      )) {
        const matched = services.find(matchesService);

        if (matched) {
          foundService = {
            ...matched,
            category: categoryName,
            categoryName,
          };

          break;
        }
      }
    }

    // 5. Not Found
    if (!foundService) {
      return res.status(404).json({
        success: false,
        message: "Service data not found",
        error: `Service '${title}' not found`,
      });
    }

    // 6. Prepare Response
    let service = {
      ...foundService,
    };

    if (isAmcMode) {
      service.price = 0;
      service.status = "AMC";
    } else {
      service.status =
        service.status || "Regular";
    }

    service = resolveServiceUrls(
      [service],
      serverBaseUrl
    )[0];

    const localizedService = localizeService(
      service,
      req.lang
    );

    return res.status(200).json({
      success: true,
      message: translate(
        "service_details_retrieved",
        req.lang
      ),
      status: isAmcMode ? "AMC" : "Regular",
      service: localizedService,
      data: localizedService,
    });

  } catch (err) {
    console.error(
      "[ServiceDetail] Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service details",
      error: err.message,
    });
  }
};

    // Try to find closest matching service in unified list (partial title match)
    try {
      const allUnifiedSrvs = await getUnifiedServices(serverBaseUrl);
      const partialMatch = allUnifiedSrvs.find(s => {
        const sTitle = String(s.title || s.name || '').toLowerCase();
        return sTitle.includes(titleLower.substring(0, Math.min(5, titleLower.length))) ||
               titleLower.includes(sTitle.substring(0, Math.min(5, sTitle.length)));
      });
      if (partialMatch) {
        const enriched = { ...partialMatch, title: title, productId: title };
        if (isAmcMode) { enriched.price = 0; enriched.status = 'AMC'; }
        console.log(`[handleServiceDetail] Partial match fallback for '${title}' -> '${partialMatch.title}'`);
        return res.json({ success: true, service: localizeService(enriched, req.lang), status: isAmcMode ? 'AMC' : 'Regular', message: translate('service_details_retrieved', req.lang) });
      }
    } catch(e) {}

    // Final dynamic fallback: build a realistic service response from title keywords
    const dynamicService = {
      productId: title,
      title: title,
      name: title,
      serviceName: title,
      price: isAmcMode ? 0 : inferredPrice,
      cutPrice: Math.round(inferredPrice * 1.2),
      discount: 17,
      description: `${title} by trained and certified professionals. 100% satisfaction guaranteed with top-quality tools and products.`,
      image: inferredImage,
      category: inferredCategory,
      categoryId: inferredCategory,
      duration: inferredDuration,
      rating: 4.7,
      reviewsCount: 89,
      status: isAmcMode ? 'AMC' : 'Regular',
      highlights: [
        'Includes background-checked & certified partner',
        '30-day post-service warranty cover included',
        'Equipped with premium professional-grade tools',
        '100% safe, hygienic, and high-quality service execution'
      ]
    };
    console.log(`[handleServiceDetail] Dynamic fallback for unknown service '${title}' in category '${inferredCategory}' at Rs.${inferredPrice}`);
    return res.json({ success: true, service: localizeService(dynamicService, req.lang), status: isAmcMode ? 'AMC' : 'Regular', message: translate('service_details_retrieved', req.lang) });
  }

  // Resolve relative URLs if needed
  let resolvedImage = foundService.image;
  if (resolvedImage && resolvedImage.startsWith('/assets/')) {
    resolvedImage = `${serverBaseUrl}${resolvedImage}`;
  }

  hasActiveAmc = statusParam === "AMC";

  // Add rich mock metadata for details
  const enrichedService = {
    productId: foundService.title || foundService.productId,
    title: foundService.title,
    price: hasActiveAmc ? 0 : Number(foundService.price),
    status: hasActiveAmc ? "AMC" : "Regular",
    description: foundService.description || foundService.productDescription || "",
    image: resolvedImage,
    category: foundCategory,
    categoryId: foundService.categoryId || foundService.category,
    duration: foundService.duration || (foundService.title.toLowerCase().includes("cleaning") || foundService.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours"),
    rating: foundService.rating !== undefined ? parseFloat(foundService.rating) : 4.8,
    reviewsCount: foundService.reviewsCount !== undefined ? parseInt(foundService.reviewsCount) : 124,
    discount: foundService.discount !== undefined ? parseFloat(foundService.discount) : 0,
    cutPrice: foundService.cutPrice !== undefined ? parseFloat(foundService.cutPrice) : Number(foundService.price),
    highlights: foundService.highlights || [
      "Includes background-checked & certified partner",
      "30-day post-service warranty cover included",
      "Equipped with premium professional-grade tools",
      "100% safe, hygienic, and high-quality service execution"
    ]
  };

  res.json({
    success: true,
    service: localizeService(enrichedService, req.lang),
    status: hasActiveAmc ? "AMC" : "Regular",
    message: translate("service_details_retrieved", req.lang)
  });
};


const searchServices = async (req, res) => {
  const searchTerm = req.query.q || req.query.search || req.query.query;
  if (!searchTerm || searchTerm.trim() === '') {
    return res.json({ success: true, services: [], categories: [] });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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

  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      // 1. Search categories in DB
      const [catRows] = await getMysqlPool().query(
        "SELECT * FROM node_categories WHERE status = 1 AND LOWER(title) LIKE ?",
        [`%${lowerTerm}%`]
      );
      const dbCategories = catRows.map(c => {
        const cleanName = c.title.toLowerCase().replace(/[\s\-_]/g, '');
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => {
          const cleanDcId = dc.id.toLowerCase().replace(/[\s\-_]/g, '');
          const cleanDcName = dc.name.toLowerCase().replace(/[\s\-_]/g, '');
          return cleanDcId === cleanName || cleanDcName === cleanName || String(c.id) === String(dc.id);
        });
        let img = c.image || "";
        if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
          img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
        }
        let name = c.title;
        let id = String(c.id);
        if (defaultMatch) {
          id = defaultMatch.id;
          name = defaultMatch.name;
          if (!img || img.trim() === '') {
            img = defaultMatch.image;
          }
        }
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return { id, name, image: img };
      });

      // 2. Search services in DB
      const [srvRows] = await getMysqlPool().query(
        `SELECT s.*, c.title as category_title 
         FROM node_services s 
         LEFT JOIN node_categories c ON s.category_id = c.id 
         WHERE s.status IN (0, 1) AND (LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ? OR LOWER(c.title) LIKE ?)`,
        [`%${lowerTerm}%`, `%${lowerTerm}%`, `%${lowerTerm}%`]
      );
      const dbServices = srvRows.map(r => {
        const srv = sanitizeServiceDbObj(r, serverBaseUrl);
        return {
          ...srv,
          category: r.category_title || ""
        };
      });

      // Merge with static search results
      const staticCategories = CATEGORIES_DATA.filter(cat => cat.toLowerCase().includes(lowerTerm));
      const staticServices = [];
      for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
        for (const service of services) {
          if (
            service.title.toLowerCase().includes(lowerTerm) ||
            service.description.toLowerCase().includes(lowerTerm) ||
            categoryName.toLowerCase().includes(lowerTerm)
          ) {
            staticServices.push({
              ...service,
              category: categoryName
            });
          }
        }
      }

      // Merge categories
      const catNames = new Set(dbCategories.map(c => c.name.toLowerCase()));
      const uniqueStaticCats = staticCategories.filter(cat => !catNames.has(cat.toLowerCase())).map(cat => {
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === cat.toLowerCase());
        let img = defaultMatch ? defaultMatch.image : "";
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return {
          id: defaultMatch ? defaultMatch.id : cat.toLowerCase().replace(/\s+/g, '_'),
          name: cat,
          image: img
        };
      });
      const finalCategories = [...dbCategories, ...uniqueStaticCats];

      // Merge services
      const srvTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
      const uniqueStaticSrvs = staticServices.filter(s => !srvTitles.has(s.title.toLowerCase()));
      const finalServices = [...dbServices, ...uniqueStaticSrvs];

      return res.json({
        success: true,
        query: searchTerm,
        results: {
          categories: finalCategories,
          services: resolveServiceUrls(finalServices, serverBaseUrl),
          totalCategories: finalCategories.length,
          totalServices: finalServices.length
        }
      });
    } catch (err) {
      console.warn("[Search] DB search failed, falling back static:", err.message);
    }
  }

  // Search across categories
  const matchedCategories = CATEGORIES_DATA.filter(
    cat => cat.toLowerCase().includes(lowerTerm)
  );

  // Search across all services (include category context)
  const matchedServices = [];
  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    for (const service of services) {
      if (
        service.title.toLowerCase().includes(lowerTerm) ||
        service.description.toLowerCase().includes(lowerTerm) ||
        categoryName.toLowerCase().includes(lowerTerm)
      ) {
        matchedServices.push({
          ...service,
          category: categoryName
        });
      }
    }
  }

  res.json({
    success: true,
    query: searchTerm,
    results: {
      categories: matchedCategories.map(cat => {
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === cat.toLowerCase());
        let img = defaultMatch ? defaultMatch.image : "";
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return {
          id: defaultMatch ? defaultMatch.id : cat.toLowerCase().replace(/\s+/g, '_'),
          name: cat,
          image: img
        };
      }),
      services: resolveServiceUrls(matchedServices, serverBaseUrl),
      totalCategories: matchedCategories.length,
      totalServices: matchedServices.length
    }
  });
};

module.exports = {
  getTrendingServices,
  getCategoryServices,
  getAllServices,
  getTrendingServicesAlt,
  handleServiceDetail,
  searchServices
};
