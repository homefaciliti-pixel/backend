const { defaultSubCategoryPresets, defaultSubCatServicePresets, SERVICES_DATA, CATEGORIES_DATA } = require('../config/constants');
const { getHdFallbackServiceImageUrl, getLocalCategoryAssetUrl, sanitizeServiceDbObj, resolveServiceUrls, resolveDynamicCategoryImageUrl } = require('../utils/imageHelpers');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('./adminBackend.service');
const { readDataFromJsonDb, getCanonicalCategoryName, normalizeString } = require('../utils/helpers');
const { localizeCategory } = require('../helpers/contentI18n');
const { DbLayer } = require('./dbLayer');

function generateDefaultServicesForSubCategory(subCatTitle, categoryName, catId, subCatId) {
  const normTitle = String(subCatTitle || '').toLowerCase().trim();
  const presets = defaultSubCatServicePresets[normTitle] || [
    { title: `${subCatTitle} - Basic Service`, price: 399, cutPrice: 599 },
    { title: `${subCatTitle} - Advanced Service`, price: 699, cutPrice: 999 },
    { title: `${subCatTitle} - Complete Package`, price: 1199, cutPrice: 1599 }
  ];

  return presets.map((p, idx) => {
    const srvId = `${subCatId}_srv_${idx + 1}`;
    const price = p.price;
    const cutPrice = p.cutPrice;
    const discount = Math.round(((cutPrice - price) / cutPrice) * 100);
    const img = typeof getHdFallbackServiceImageUrl === 'function' 
      ? getHdFallbackServiceImageUrl(p.title, categoryName)
      : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80";
      
    return {
      id: srvId,
      serviceId: srvId,
      productDbId: srvId,
      productId: p.title,
      title: p.title,
      name: p.title,
      serviceName: p.title,
      description: `${p.title} by professional experts with 100% satisfaction guarantee.`,
      image: img,
      price: price,
      cutPrice: cutPrice,
      discount: discount,
      rating: 4.8,
      reviewsCount: 120 + idx * 17,
      category: String(catId),
      category_id: String(catId),
      categoryId: String(catId),
      subCategoryId: String(subCatId),
      sub_category_id: String(subCatId),
      subCategory: String(subCatTitle || ''),
      sub_category: String(subCatTitle || ''),
      status: "active",
      hasVariants: false,
      variants: []
    };
  });
}

function generateSubcategoriesForCategory(c) {
  const catIdStr = String(c.id || c.categoryId || '');
  const catNameStr = String(c.name || c.categoryName || c.title || '');
  const catKeyLower = catNameStr.toLowerCase().trim();

  const presets = defaultSubCategoryPresets[catKeyLower] || [
    { title: `${catNameStr} Standard Services`, key: 'standard' },
    { title: `${catNameStr} Premium Services`, key: 'premium' }
  ];

  const catServices = Array.isArray(c.services) ? c.services : [];
  const halfLen = Math.ceil(catServices.length / 2);

  let sub1Services = catServices.length > 1 ? catServices.slice(0, halfLen) : catServices;
  let sub2Services = catServices.length > 1 ? catServices.slice(halfLen) : catServices;

  const sub1Id = `${catIdStr}_sub_1`;
  const sub2Id = `${catIdStr}_sub_2`;

  if (!sub1Services || sub1Services.length < 2) {
    sub1Services = generateDefaultServicesForSubCategory(presets[0].title, catNameStr, catIdStr, sub1Id);
  }

  if (!sub2Services || sub2Services.length < 2) {
    sub2Services = generateDefaultServicesForSubCategory(presets[1].title, catNameStr, catIdStr, sub2Id);
  }

  const img = c.image || c.categoryImage || '';

  const sub1 = {
    id: sub1Id,
    subCategoryId: sub1Id,
    categoryId: catIdStr,
    name: presets[0].title,
    title: presets[0].title,
    subCategoryName: presets[0].title,
    categoryName: catNameStr,
    image: img,
    subCategoryImage: img,
    categoryImage: img,
    parent: catNameStr,
    status: "active",
    services: sub1Services
  };

  const sub2 = {
    id: sub2Id,
    subCategoryId: sub2Id,
    categoryId: catIdStr,
    name: presets[1].title,
    title: presets[1].title,
    subCategoryName: presets[1].title,
    categoryName: catNameStr,
    image: img,
    subCategoryImage: img,
    categoryImage: img,
    parent: catNameStr,
    status: "active",
    services: sub2Services
  };

  return [sub1, sub2];
}

function collectAllSubcategories(adminSubcats, adminCats, dbCategories, serverBaseUrl) {
  const allSubs = [];
  const seen = new Set();

  function addSub(sub, parentCat) {
    const subId = String(sub.id || sub.subCategoryId || sub.sub_category_id || '').trim();
    const subTitle = String(sub.title || sub.name || sub.subCategoryName || '').trim();
    if (!subTitle) return;

    const catId = String(parentCat ? (parentCat.id || parentCat.categoryId) : (sub.category_id || sub.categoryId || sub.parent_id || sub.parent || '')).trim();
    const catName = String(parentCat ? (parentCat.name || parentCat.title || parentCat.categoryName) : (sub.categoryName || sub.category_name || sub.parent || '')).trim();

    const dedupKey = `${subId}_${subTitle}_${catId}`.toLowerCase();
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);

    let subImg = sub.image || sub.subCategoryImage || sub.photo || '';
    if (subImg && typeof subImg === 'string') {
      subImg = subImg.trim();
      if (!subImg.startsWith('http://') && !subImg.startsWith('https://')) {
        const clean = subImg.replace(/^\/+/, '').replace(/^uploads\//, '');
        subImg = `https://adminbackend-1-h03r.onrender.com/uploads/${clean}`;
      }
    }
    if (!subImg || subImg === '1') {
      subImg = parentCat ? resolveDynamicCategoryImageUrl(parentCat, serverBaseUrl) : `${serverBaseUrl}/assets/categories/1_Plumber.png`;
    }

    allSubs.push({
      id: subId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subCategoryId: subId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sub_category_id: subId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      categoryId: catId,
      category_id: isNaN(catId) ? catId : parseInt(catId),
      name: subTitle,
      title: subTitle,
      subCategoryName: subTitle,
      categoryName: catName || 'Category',
      image: String(subImg || ''),
      subCategoryImage: String(subImg || ''),
      categoryImage: parentCat ? resolveDynamicCategoryImageUrl(parentCat, serverBaseUrl) : String(subImg || ''),
      parent: catName || 'Main Category',
      status: (sub.status === 0 || sub.status === false || sub.status === 'inactive') ? 'inactive' : 'active',
      services: Array.isArray(sub.services) ? sub.services : []
    });
  }

  (adminSubcats || []).forEach(sub => addSub(sub));

  (adminCats || []).forEach(ac => {
    const nested = Array.isArray(ac.subcategories) ? ac.subcategories : (Array.isArray(ac.subCategories) ? ac.subCategories : (Array.isArray(ac.sub_categories) ? ac.sub_categories : []));
    nested.forEach(sub => addSub(sub, ac));
  });

  (dbCategories || []).forEach(c => {
    const parentVal = String(c.parent || '').trim();
    if (parentVal && parentVal !== 'Main Category' && parentVal !== 'null' && parentVal !== 'undefined') {
      addSub(c);
    }
  });

  return allSubs;
}

// GET /api/categories/:id - Single category with nested subcategories

const getCategoryIdByName = (catName) => {
  if (!catName) return "1";
  const loc = localizeCategory({ name: catName }, 'en');
  return String(loc.id || "1");
};

const getServiceCategoryDbOrStatic = async (productId) => {
  if (!productId) return null;
  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      const [srvRows] = await getMysqlPool().query(
        "SELECT category_id FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ?",
        [productId.toLowerCase(), productId.toLowerCase(), isNaN(productId) ? -1 : parseInt(productId)]
      );
      if (srvRows.length > 0 && srvRows[0].category_id) {
        const [catRows] = await getMysqlPool().query(
          "SELECT title FROM node_categories WHERE id = ?",
          [srvRows[0].category_id]
        );
        if (catRows.length > 0) {
          return getCanonicalCategoryName(catRows[0].title) || null;
        }
      }
    } catch (err) {
      console.warn("[getServiceCategoryDbOrStatic] Failed to query DB:", err.message);
    }
  }
  // Try to find category in database.json
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      const matched = data.services.find(s => s.title.toLowerCase() === productId.toLowerCase() || s.id.toString() === productId.toString());
      if (matched && matched.category) {
        const cats = data.categories || [];
        const catObj = cats.find(c => c.id.toString() === matched.category.toString());
        if (catObj) {
          return getCanonicalCategoryName(catObj.name) || null;
        }
      }
    }
  } catch (err) {
    console.warn("[getServiceCategoryDbOrStatic] JSON fallback read failed:", err.message);
  }
  for (const [catName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.some(s => s.title.toLowerCase() === productId.toLowerCase());
    if (match) return getCanonicalCategoryName(catName);
  }
  const normTitle = productId.toLowerCase();
  for (const cat of CATEGORIES_DATA) {
    if (normTitle.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normTitle)) {
      return getCanonicalCategoryName(cat);
    }
  }
  return null;
};


async function getUnifiedServices(serverBaseUrl = 'https://backend-1-ux3b.onrender.com') {
  // 1. Primary: Fetch all live services from Admin Backend
  try {
    const adminSrvs = await fetchAdminBackendServices();
    const adminCats = await fetchAdminBackendCategories();
    const catMap = {};
    (adminCats || []).forEach(c => {
      catMap[String(c.id)] = c.name || c.title || '';
    });

    if (adminSrvs && adminSrvs.length > 0) {
      return adminSrvs.map(as => {
        let img = String(as.image || as.photo || '').trim();
        if (!img || img === '1' || img.endsWith('/1') || img.includes('blob:')) {
          img = getHdFallbackServiceImageUrl(as.title || as.name || '', as.categoryName || catMap[String(as.category_id || as.categoryId)] || '');
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          // valid URL
        } else {
          const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
          img = `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
        }

        const price = Math.round(parseFloat(as.price || 0));
        const discount = Math.round(parseFloat(as.discount || 0));
        const finalPrice = discount > 0 ? Math.max(0, price - discount) : price;
        const displayDiscount = price > 0 && discount > 0 ? Math.min(100, Math.round((discount / price) * 100)) : 0;
        const catId = String(as.category_id || as.categoryId || as.category || '');
        const catName = as.categoryName || as.category_name || catMap[catId] || as.cat_name || as.category || '';
        const srvId = String(as.id || as.serviceId || '');

        // Standardize highlights to always be an Array of strings (Flutter crashes if highlights is a String)
        let srvHighlights = [];
        if (as.highlights) {
          try {
            srvHighlights = typeof as.highlights === 'string' ? JSON.parse(as.highlights) : as.highlights;
          } catch (e) {
            srvHighlights = [];
          }
        }
        if (!Array.isArray(srvHighlights) || srvHighlights.length === 0) {
          srvHighlights = [
            "Includes background-checked & certified partner",
            "30-day post-service warranty cover included",
            "Equipped with premium professional-grade tools",
            "100% safe, hygienic, and high-quality service execution"
          ];
        }

        const resolvedDuration = as.duration || (as.time ? `${as.time} Hours` : "1-2 Hours");

        return {
          ...as,
          id: srvId,
          serviceId: srvId,
          productDbId: srvId,
          productId: String(as.title || as.name || srvId),
          title: String(as.title || as.name || ''),
          name: String(as.title || as.name || ''),
          serviceName: String(as.title || as.name || ''),
          description: String(as.description || ''),
          image: img,
          imageUrl: img,
          price: Math.round(finalPrice),
          cutPrice: Math.round(price),
          discount: displayDiscount,
          rating: parseFloat(as.rating || 4.8),
          reviewsCount: 50 + (parseInt(srvId || 1) * 17) % 250,
          category: catId,
          category_id: catId,
          categoryId: catId,
          categoryName: catName,
          cat_name: catName,
          duration: resolvedDuration,
          highlights: srvHighlights,
          subCategoryId: as.subCategoryId || as.sub_category_id ? String(as.subCategoryId || as.sub_category_id) : (as.subCategory || as.sub_category ? String(as.subCategory || as.sub_category) : null),
          sub_category_id: as.sub_category_id || as.subCategoryId ? String(as.sub_category_id || as.subCategoryId) : (as.sub_category || as.subCategory ? String(as.sub_category || as.subCategory) : null),
          subCategory: as.subCategory || as.sub_category || null,
          sub_category: as.sub_category || as.subCategory || null,
          status: (as.status === true || as.status === 1 || as.status === '1' || as.status === 'active') ? 1 : 0,
          hasVariants: false,
          variants: []
        };
      });
    }
  } catch (err) {
    console.warn("[getUnifiedServices] Admin backend services fetch failed:", err.message);
  }

  // 2. Fallback to MySQL if available
  if (getMysqlReady()) {
    try {
      const [srvRows] = await getMysqlPool().query("SELECT s.*, c.title as cat_name FROM node_services s LEFT JOIN node_categories c ON s.category_id = c.id WHERE s.status IN (0, 1)");
      if (srvRows && srvRows.length > 0) {
        return srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
      }
    } catch (err) {
      console.warn("[getUnifiedServices] MySQL fallback failed:", err.message);
    }
  }

  // 3. Fallback to database.json
  try {
    const data = readDataFromJsonDb();
    if (data && data.services && data.services.length > 0) {
      return data.services;
    }
  } catch (e) {}

  // 4. Static fallback
  return Object.values(SERVICES_DATA).flat();
}

const resolveServiceDetails = async (productId) => {
  if (!productId) {
    return {
      productId: "professional Plumber",
      serviceName: "professional Plumber",
      title: "professional Plumber",
      price: 499,
      description: "Professional Plumber Home Service",
      image: ""
    };
  }

  const normProduct = normalizeString(productId);

  // STEP 0: Check Live Admin Services First
  try {
    const liveServices = await getUnifiedServices();
    if (liveServices && liveServices.length > 0) {
      const prodStr = String(productId).trim().toLowerCase();
      const matched = liveServices.find(s => {
        const sId = String(s.id || s.serviceId || '');
        const sTitle = String(s.title || s.name || '').trim().toLowerCase();
        const sNorm = normalizeString(sTitle);
        return sId === String(productId) || sTitle === prodStr || sNorm === normProduct;
      });
      if (matched) {
        return {
          productId: matched.title || matched.name,
          serviceName: matched.title || matched.name,
          title: matched.title || matched.name,
          price: matched.price,
          cutPrice: matched.cutPrice || matched.price,
          description: matched.description,
          image: matched.image,
          category: matched.categoryName || matched.category,
          categoryId: String(matched.categoryId || matched.category_id || '')
        };
      }
    }
  } catch (adminErr) {
    console.warn("[resolveServiceDetails] Admin services check failed:", adminErr.message);
  }


  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      // STEP 1: Try EXACT title match first (case-insensitive)
      // This is the safest match - prevents wrong service substitution
      const [exactRows] = await getMysqlPool().query(
        "SELECT * FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ? LIMIT 1",
        [String(productId).toLowerCase(), String(productId).toLowerCase(), isNaN(productId) ? -1 : parseInt(productId)]
      );
      if (exactRows.length > 0) {
        const r = exactRows[0];
        const dbPrice = parseFloat(r.price);
        const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
        let finalPrice = dbPrice;
        if (discountVal > 0) {
          finalPrice = Math.max(0, dbPrice - discountVal);
        }
        let dbCategoryName = null;
        try {
          const [catRows] = await getMysqlPool().query("SELECT title FROM node_categories WHERE id = ?", [r.category_id]);
          if (catRows.length > 0) dbCategoryName = catRows[0].title;
        } catch (catErr) { /* ignore */ }
        return {
          productId: r.title,
          serviceName: r.title,
          title: r.title,
          price: finalPrice,
          description: r.description,
          image: r.image,
          category: dbCategoryName,
          categoryId: r.category_id ? r.category_id.toString() : ""
        };
      }

      // STEP 2: Only if exact match failed, try normalized fuzzy match
      // Use a narrower normalized query to reduce wrong-service risk
      const [fuzzyRows] = await getMysqlPool().query(
        "SELECT * FROM node_services WHERE REPLACE(REPLACE(REPLACE(LOWER(title), '-', ''), '_', ''), ' ', '') = ? OR REPLACE(REPLACE(REPLACE(LOWER(title_hi), '-', ''), '_', ''), ' ', '') = ? LIMIT 1",
        [normProduct, normProduct]
      );
      if (fuzzyRows.length > 0) {
        const r = fuzzyRows[0];
        const dbPrice = parseFloat(r.price);
        const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
        let finalPrice = dbPrice;
        if (discountVal > 0) {
          finalPrice = Math.max(0, dbPrice - discountVal);
        }
        let dbCategoryName = null;
        try {
          const [catRows] = await getMysqlPool().query("SELECT title FROM node_categories WHERE id = ?", [r.category_id]);
          if (catRows.length > 0) dbCategoryName = catRows[0].title;
        } catch (catErr) { /* ignore */ }
        return {
          productId: r.title,
          serviceName: r.title,
          title: r.title,
          price: finalPrice,
          description: r.description,
          image: r.image,
          category: dbCategoryName,
          categoryId: r.category_id ? r.category_id.toString() : ""
        };
      }
    } catch (err) {
      console.warn("[resolveServiceDetails] DB query failed, falling back static:", err.message);
    }
  }

  // Try matching in database.json
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      const exactMatch = data.services.find(s => 
        s.title.toLowerCase() === String(productId).toLowerCase() || 
        s.id.toString() === productId.toString()
      );
      if (exactMatch) {
        return {
          productId: exactMatch.title,
          serviceName: exactMatch.title,
          title: exactMatch.title,
          price: Number(exactMatch.price),
          description: exactMatch.description,
          image: exactMatch.image,
          category: exactMatch.category,
          categoryId: exactMatch.categoryId || exactMatch.category
        };
      }

      const looseMatch = data.services.find(s => 
        normalizeString(s.title) === normProduct
      );
      if (looseMatch) {
        return {
          productId: looseMatch.title,
          serviceName: looseMatch.title,
          title: looseMatch.title,
          price: Number(looseMatch.price),
          description: looseMatch.description,
          image: looseMatch.image,
          category: looseMatch.category,
          categoryId: looseMatch.categoryId || looseMatch.category
        };
      }
    }
  } catch (err) {
    console.warn("[resolveServiceDetails] JSON fallback read failed:", err.message);
  }

  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.find(s => normalizeString(s.title) === normProduct);
    if (match) {
      return {
        productId: match.title,
        serviceName: match.title,
        title: match.title,
        price: Number(match.price),
        description: match.description,
        image: match.image
      };
    }
  }

  // If no service matches, check if the productId is one of the category names
  const matchedCategory = CATEGORIES_DATA.find(
    cat => cat.toLowerCase() === productId.toLowerCase() || 
           normalizeString(cat) === normProduct
  );
  if (matchedCategory) {
    return {
      productId: matchedCategory,
      serviceName: matchedCategory,
      title: matchedCategory,
      price: 0.00,
      description: `${matchedCategory} Service under AMC`,
      image: ""
    };
  }

  // Return the requested productId dynamically instead of hardcoded Tap Repair
  const fallbackName = productId && productId.trim() !== '' ? productId.trim() : "professional Plumber";
  return {
    productId: fallbackName,
    serviceName: fallbackName,
    title: fallbackName,
    price: 499,
    description: `${fallbackName} service`,
    image: "",
    category: getServiceCategory(fallbackName),
    categoryId: ""
  };
};

// Helper to determine category for a given service title

function getServiceCategory(serviceTitle) {
  if (!serviceTitle) return "Plumber";
  
  const cleanTitle = serviceTitle.toLowerCase().replace(/[\s\-_]/g, '');

  for (const cat of Object.keys(SERVICES_DATA)) {
    const found = SERVICES_DATA[cat].some(s => s.title.toLowerCase().replace(/[\s\-_]/g, '') === cleanTitle);
    if (found) return cat;
  }
  
  for (const cat of CATEGORIES_DATA) {
    const cleanCat = cat.toLowerCase().replace(/[\s\-_]/g, '');
    if (cleanTitle.includes(cleanCat) || cleanCat.includes(cleanTitle)) {
      return cat;
    }
  }

  if (cleanTitle.includes("ac") || cleanTitle.includes("aircondition")) {
    return "AcRepair";
  }

  return "Plumber";
}

// Checkout: Retrieve Checkout Summary (Get details)

module.exports = {
  getUnifiedServices,
  generateDefaultServicesForSubCategory,
  generateSubcategoriesForCategory,
  collectAllSubcategories,
  getCategoryIdByName,
  getServiceCategoryDbOrStatic,
  resolveServiceDetails,
  getServiceCategory
};
