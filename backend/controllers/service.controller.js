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
  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = [acFreeService, ...shuffleArray(allServices).slice(0, 4)];
  res.json({ success: true, services: resolveServiceUrls(trending, serverBaseUrl).map(s => localizeService(s, req.lang)) });
};

const formatServiceDetailResponse = (s, req, serverBaseUrl, isAmcMode) => {
  const srvPrice = isAmcMode ? 0 : Math.round(Number(s.price || 0));
  const srvCutPrice = isAmcMode ? 0 : Math.round(Number(s.cutPrice || srvPrice || 0));

  let srvHighlights = s.highlights;
  if (typeof srvHighlights === 'string') {
    try {
      srvHighlights = JSON.parse(srvHighlights);
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
  srvHighlights = srvHighlights.map(h => String(h));

  let img = String(s.image || s.imageUrl || s.photo || '').trim();
  if (!img || img === '1' || img.endsWith('/1') || img.includes('blob:')) {
    img = getHdFallbackServiceImageUrl(s.title || s.name || '', s.categoryName || s.category || '');
  } else if (!img.startsWith('http://') && !img.startsWith('https://')) {
    const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
    img = `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
  }

  const srvTitle = String(s.title || s.name || s.serviceName || req.params.title || 'Home Service').trim();

  // Normalize duration and prevent duplicate units.
  // Example: "2-3 hours Hours" -> "2-3 hours"
  // Example: "45 min Hours" -> "45 min"
  // Example: "3-4" -> "3-4 Hours"
  let normalizedDuration = String(
    s.duration || s.time || "1-2 Hours"
  ).trim().replace(/\s+/g, ' ');

  if (!normalizedDuration || normalizedDuration === 'null' || normalizedDuration === 'undefined') {
    normalizedDuration = '1-2 Hours';
  }

  const durationUnitPattern =
    /\b(hours?|hrs?|hr|minutes?|mins?|min)\b/i;

  const duplicateDurationUnitPattern =
    /\b(hours?|hrs?|hr|minutes?|mins?|min)\b\s+(?:and\s+)?\1\b\s*$/i;

  while (duplicateDurationUnitPattern.test(normalizedDuration)) {
    normalizedDuration = normalizedDuration.replace(
      duplicateDurationUnitPattern,
      '$1'
    );
  }

  if (!durationUnitPattern.test(normalizedDuration)) {
    normalizedDuration = `${normalizedDuration} Hours`;
  }

  const sanitized = {
    ...s,
    id: parseInt(s.id || s.serviceId || 1),
    serviceId: parseInt(s.serviceId || s.id || 1),
    productDbId: parseInt(s.productDbId || s.id || 1),
    productId: String(s.productId || srvTitle),
    title: srvTitle,
    name: srvTitle,
    serviceName: srvTitle,
    productName: srvTitle,
    product_name: srvTitle,
    price: srvPrice,
    cutPrice: srvCutPrice,
    discount: Math.round(Number(s.discount || 0)),
    description: String(s.description || s.productDescription || `${srvTitle} provided by trusted, verified home service experts.`),
    image: img,
    imageUrl: img,
    category: String(s.category || s.categoryId || s.category_id || '1'),
    categoryId: String(s.categoryId || s.category_id || s.category || '1'),
    category_id: String(s.category_id || s.categoryId || s.category || '1'),
    duration: normalizedDuration,
    rating: parseFloat(s.rating || 4.8),
    reviewsCount: parseInt(s.reviewsCount || 120),
    highlights: srvHighlights,
    status: isAmcMode ? "AMC" : "Regular"
  };

  const localized = localizeService(sanitized, req.lang);

  // Guarantee exact Dart types: price must be int, highlights must be List<String>
  localized.price = srvPrice;
  localized.highlights = srvHighlights;
  localized.productId = String(localized.productId || sanitized.productId);
  localized.category = String(localized.category || sanitized.category);

  // Keep normalized duration after localization as well.
  localized.duration = normalizedDuration;

  localized.image = img;

  return localized;
};

const handleServiceDetail = async (req, res) => {
  const title = req.params.title || req.query.title;
  if (!title) {
    return res.status(400).json({ success: false, error: "Service title is required" });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const statusParam = req.query.status || req.body.status;
  const isAmcMode = statusParam === "AMC";

  const normProduct = String(title).toLowerCase().replace(/[\s\-_]/g, '');
  const prodStr = String(title).trim().toLowerCase();

  // 1. Try Live Admin Services First
  try {
    const allServices = await getUnifiedServices(serverBaseUrl);

    // Exact match first
    let matched = allServices.find(s => {
      const sId = String(s.id || s.serviceId || '');
      const sTitle = String(s.title || s.name || '').trim().toLowerCase();
      const sNorm = sTitle.replace(/[\s\-_]/g, '');
      return sId === String(title) || sTitle === prodStr || sNorm === normProduct;
    });

    // Partial/fuzzy match if no exact match
    if (!matched) {
      matched = allServices.find(s => {
        const sTitle = String(s.title || s.name || '').trim().toLowerCase();
        const sNorm = sTitle.replace(/[\s\-_]/g, '');
        return sNorm.includes(normProduct) || normProduct.includes(sNorm);
      });
    }

    if (matched) {
      const finalService = formatServiceDetailResponse(matched, req, serverBaseUrl, isAmcMode);
      return res.json({
        success: true,
        data: finalService,
        service: finalService,
        status: isAmcMode ? "AMC" : "Regular",
        message: translate("service_details_retrieved", req.lang)
      });
    }
  } catch (err) {
    console.warn("[handleServiceDetail] Live admin search failed:", err.message);
  }

  let hasActiveAmc = isAmcMode;

  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      const cleanTitle = title.toLowerCase().replace(/[\s\-_]/g, '');
      const [srvRows] = await getMysqlPool().query(
        "SELECT * FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ? OR REPLACE(REPLACE(REPLACE(LOWER(title_hi), ' ', ''), '-', ''), '_', '') = ?",
        [title.toLowerCase(), title.toLowerCase(), isNaN(title) ? -1 : parseInt(title), cleanTitle, cleanTitle]
      );
      if (srvRows.length > 0) {
        const r = srvRows[0];
        const enriched = sanitizeServiceDbObj(r, serverBaseUrl);
        const finalService = formatServiceDetailResponse(enriched, req, serverBaseUrl, isAmcMode);
        return res.json({
          success: true,
          data: finalService,
          service: finalService,
          status: isAmcMode ? "AMC" : "Regular",
          message: translate("service_details_retrieved", req.lang)
        });
      }
    } catch (err) {
      console.warn("[DynamicServices] DB detail failed, falling back static:", err.message);
    }
  }

  let foundService = null;
  let foundCategory = null;

  // Try loading from database.json first
  try {
    const data = readDataFromJsonDb();
    if (data && data.services && data.services.length > 0) {
      const cleanTitle = title.toLowerCase().replace(/[\s\-_]/g, '');
      const match = data.services.find(s =>
        s.title.toLowerCase() === title.toLowerCase() ||
        s.id.toString() === title.toString() ||
        s.title.toLowerCase().replace(/[\s\-_]/g, '') === cleanTitle
      );
      if (match) {
        foundService = match;
        const cats = data.categories || [];
        const catObj = cats.find(c => c.id.toString() === match.category.toString());
        foundCategory = catObj ? catObj.name : match.category;
      }
    }
  } catch (err) {
    console.warn("Failed to load service detail from JSON fallback:", err.message);
  }

  // Fallback to static SERVICES_DATA if not found in database.json
  if (!foundService) {
    for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
      const match = services.find(s => s.title.toLowerCase() === title.toLowerCase());
      if (match) {
        foundService = match;
        foundCategory = categoryName;
        break;
      }
    }
  }

  if (foundService) {
    let resolvedImage = foundService.image;
    if (resolvedImage && resolvedImage.startsWith('/assets/')) {
      resolvedImage = `${serverBaseUrl}${resolvedImage}`;
    }

    const finalService = formatServiceDetailResponse({
      ...foundService,
      image: resolvedImage,
      category: foundCategory || foundService.category
    }, req, serverBaseUrl, isAmcMode);

    return res.json({
      success: true,
      data: finalService,
      service: finalService,
      status: isAmcMode ? "AMC" : "Regular",
      message: translate("service_details_retrieved", req.lang)
    });
  }

  // --- SMART DYNAMIC FALLBACK: NEVER RETURN 404 ---
  // Infer category, price, duration, and high-definition image from title keywords
  const titleLower = title.toLowerCase();
  let inferredCategory = 'Home Services';
  let inferredPrice = 499;
  let inferredDuration = '1-2 Hours';
  let inferredImage = getHdFallbackServiceImageUrl(title, 'Home Services');

  if (titleLower.includes('bhk') || titleLower.includes('clean') || titleLower.includes('house') || titleLower.includes('sofa') || titleLower.includes('carpet')) {
    inferredCategory = 'Cleaning';
    inferredPrice = titleLower.includes('1 bhk') ? 799 : (titleLower.includes('2 bhk') ? 1499 : (titleLower.includes('3 bhk') ? 2199 : 699));
    inferredDuration = '3-4 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Cleaning');
  } else if (titleLower.includes('plumb') || titleLower.includes('tap') || titleLower.includes('pipe') || titleLower.includes('drain') || titleLower.includes('basin') || titleLower.includes('sink')) {
    inferredCategory = 'Plumber';
    inferredPrice = 299;
    inferredDuration = '1-2 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Plumber');
  } else if (titleLower.includes('ac') || titleLower.includes('cool') || titleLower.includes('air')) {
    inferredCategory = 'AC Repair';
    inferredPrice = 499;
    inferredDuration = '1-2 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'AC Repair');
  } else if (titleLower.includes('electric') || titleLower.includes('fan') || titleLower.includes('switch') || titleLower.includes('wiring') || titleLower.includes('light')) {
    inferredCategory = 'Electrician';
    inferredPrice = 199;
    inferredDuration = '1-2 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Electrician');
  } else if (titleLower.includes('car') || titleLower.includes('wash')) {
    inferredCategory = 'Car Washing';
    inferredPrice = 399;
    inferredDuration = '1-2 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Car Washing');
  } else if (titleLower.includes('paint')) {
    inferredCategory = 'Painter';
    inferredPrice = 1499;
    inferredDuration = '3-5 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Painter');
  } else if (titleLower.includes('salon') || titleLower.includes('hair') || titleLower.includes('facial') || titleLower.includes('spa')) {
    inferredCategory = 'Salon';
    inferredPrice = 399;
    inferredDuration = '1-2 Hours';
    inferredImage = getHdFallbackServiceImageUrl(title, 'Salon');
  }

  const dynamicFallback = {
    productId: title,
    title: title,
    name: title,
    serviceName: title,
    price: inferredPrice,
    cutPrice: Math.round(inferredPrice * 1.3),
    discount: 20,
    description: `${title} by certified, background-verified professionals with 100% service guarantee.`,
    image: inferredImage,
    category: inferredCategory,
    duration: inferredDuration,
    rating: 4.8,
    reviewsCount: 110,
    highlights: [
      "Includes background-checked & certified partner",
      "30-day post-service warranty cover included",
      "Equipped with premium professional-grade tools",
      "100% safe, hygienic, and high-quality service execution"
    ]
  };

  const finalFallback = formatServiceDetailResponse(dynamicFallback, req, serverBaseUrl, isAmcMode);
  return res.json({
    success: true,
    data: finalFallback,
    service: finalFallback,
    status: isAmcMode ? "AMC" : "Regular",
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

      const uniqueStaticCats = staticCategories
        .filter(cat => !catNames.has(cat.toLowerCase()))
        .map(cat => {
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
