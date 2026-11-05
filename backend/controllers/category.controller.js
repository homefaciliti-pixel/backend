const { DbLayer } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { getLocalCategoryAssetUrl, getLocalBannerAssetUrl, resolveDynamicCategoryImageUrl, resolveDynamicBannerImageUrl, sanitizeServiceDbObj, getHdFallbackServiceImageUrl } = require('../utils/imageHelpers');
const { fetchAdminBackendCategories, fetchAdminBackendSubcategories, fetchAdminBackendServices } = require('../services/adminBackend.service');
const { generateSubcategoriesForCategory, collectAllSubcategories, generateDefaultServicesForSubCategory } = require('../services/category.service');
const { localizeCategory, localizeService } = require('../helpers/contentI18n');
const { translate } = require('../helpers/translate');
const { BANNERS_DATA } = require('../config/constants');
const { readDataFromJsonDb } = require('../utils/helpers');

const createCategory = async (req, res) => {
  const { name, title, id, image } = req.body;
  const categoryName = title || name;
  if (!categoryName) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const category = await DbLayer.addCategory({ name: categoryName, title: categoryName, id, image });
    console.log(`[Admin] Category created/updated: ${categoryName}`);
    res.json({ success: true, category, data: category, message: "Category created successfully" });
  } catch (err) {
    console.error("Add category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateCategory = async (req, res) => {
const updateBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await DbLayer.updateCategory(id, req.body);
    console.log(`[Admin] Category ${id} updated:`, req.body.name || req.body.title);
    res.json({ success: true, category, data: category, message: "Category updated successfully" });
  } catch (err) {
    console.error("Update category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteCategory(id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createBanner = async (req, res) => {
  try {
    const banner = await DbLayer.addBanner(req.body);
    console.log(`[Admin] Banner created:`, req.body.title);
    res.json({ success: true, banner, data: banner, message: "Banner created successfully" });
  } catch (err) {
    console.error("Add banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
  const { id } = req.params;
  try {
    const banner = await DbLayer.updateBanner(id, req.body);
    console.log(`[Admin] Banner ${id} updated:`, req.body.title);
    res.json({ success: true, banner, data: banner, message: "Banner updated successfully" });
  } catch (err) {
    console.error("Update banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteBanner(id);
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (err) {
    console.error("Delete banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createService = async (req, res) => {
  try {
    const service = await DbLayer.addService(req.body);
    console.log(`[Admin] Service created:`, req.body.title || req.body.name);
    res.json({ success: true, service, data: service, message: "Service created successfully" });
  } catch (err) {
    console.error("Add service failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateService = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await DbLayer.updateService(id, req.body);
    console.log(`[Admin] Service ${id} updated:`, req.body.title || req.body.name);
    res.json({ success: true, service, data: service, message: "Service updated successfully" });
  } catch (err) {
    console.error("Update service failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteService(id);
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    console.error("Delete service failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const adminCats = await fetchAdminBackendCategories();
    const adminSubcats = await fetchAdminBackendSubcategories();
    const dbCategories = await DbLayer.getCategories();

    // Determine the base URL dynamically based on the incoming request headers
    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

    // --------------------------------------------------------
    // STEP 1: Fetch services - Admin Backend is PRIMARY source
    // --------------------------------------------------------
    let allServices = [];
    let allVariants = [];

    // 1a. Try Admin Backend first (primary source of truth)
    try {
      const adminSrvs = await fetchAdminBackendServices();
      if (adminSrvs && adminSrvs.length > 0) {
        allServices = adminSrvs.map(as => {
          // Resolve image: use admin image if present, otherwise HD fallback
          let img = String(as.image || as.photo || '').trim();
          if (!img || img === '1') {
            img = getHdFallbackServiceImageUrl(as.title || as.name || '', '');
          } else if (img.startsWith('http://') || img.startsWith('https://')) {
            // valid URL, keep as is
          } else {
            const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
            img = `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
          }

          const price = parseFloat(as.price || 0);
          const discount = parseFloat(as.discount || 0);
          const finalPrice = discount > 0 ? Math.max(0, price - discount) : price;
          const displayDiscount = price > 0 && discount > 0 ? Math.min(100, Math.round((discount / price) * 100)) : 0;
          const catId = String(as.category_id || as.categoryId || as.category || '');
          const srvId = String(as.id || as.serviceId || '');

          return {
            ...as,
            id: srvId,
            serviceId: srvId,
            productDbId: srvId,
            productId: as.title || as.name || '',
            title: String(as.title || as.name || ''),
            name: String(as.title || as.name || ''),
            serviceName: String(as.title || as.name || ''),
            description: String(as.description || ''),
            image: img,
            price: finalPrice,
            cutPrice: price,
            discount: displayDiscount,
            rating: parseFloat(as.rating || 4.8),
            reviewsCount: 50 + (parseInt(srvId) * 17) % 250,
            category: catId,
            category_id: catId,
            categoryId: catId,
            subCategoryId: as.subCategoryId || as.sub_category_id ? String(as.subCategoryId || as.sub_category_id) : (as.subCategory || as.sub_category ? String(as.subCategory || as.sub_category) : null),
            sub_category_id: as.sub_category_id || as.subCategoryId ? String(as.sub_category_id || as.subCategoryId) : (as.sub_category || as.subCategory ? String(as.sub_category || as.subCategory) : null),
            subCategory: as.subCategory || as.sub_category || null,
            sub_category: as.sub_category || as.subCategory || null,
            status: (as.status === true || as.status === 1 || as.status === '1') ? 1 : 0,
            hasVariants: false,
            variants: []
          };
        });
      }
    } catch(e) {
      console.warn("Admin backend services fetch failed:", e.message);
    }

    // 1b. Fallback to MySQL if admin fetch returned nothing
    if (allServices.length === 0 && getMysqlReady()) {
      try {
        const [srvRows] = await getMysqlPool().query("SELECT * FROM node_services WHERE status IN (0, 1)");
        allServices = srvRows.map(r => {
          let s = sanitizeServiceDbObj(r, serverBaseUrl);
          // Fix empty image
          if (!s.image || s.image.endsWith('/uploads/1') || s.image === '1') {
            s.image = getHdFallbackServiceImageUrl(s.title || '', '');
          }
          return typeof localizeService === 'function' ? localizeService(s, req.lang) : s;
        });
        try {
          const [varRows] = await getMysqlPool().query("SELECT * FROM service_variants");
          allVariants = varRows;
        } catch(e) {}
      } catch (err) {
        console.warn("MySQL services fetch also failed:", err.message);
      }
    }

    // 1c. Final fallback to JSON db
    if (allServices.length === 0) {
      try {
        const data = readDataFromJsonDb();
        if (data && data.services) {
          allServices = data.services.filter(s => s.status === 1 || s.status === 0 || s.status === undefined).map(s => {
            return typeof localizeService === 'function' ? localizeService(s, req.lang) : s;
          });
        }
      } catch(e) {}
    }

    // Localize all admin services
    if (typeof localizeService === 'function') {
      allServices = allServices.map(s => localizeService(s, req.lang));
    }

    // Group variants by service_id
    const variantsBySrv = {};
    allVariants.forEach(v => {
      const sId = String(v.service_id || '');
      if (sId) {
        if (!variantsBySrv[sId]) variantsBySrv[sId] = [];
        variantsBySrv[sId].push({
           variantId: String(v.id),
           name: String(v.title || v.name || ''),
           description: String(v.description || ''),
           price: Number(v.price || 0),
           cutPrice: Number(v.cutPrice || v.price || 0),
           discount: Number(v.discount || 0),
           duration: Number(v.duration || 60),
           status: v.status === 0 ? "inactive" : "active"
        });
      }
    });

    // Group services by category
    const servicesByCat = {};
    allServices.forEach(s => {
      const catId = String(s.category_id || s.categoryId || s.category || '');
      const srvIdStr = String(s.id || s.serviceId || '');
      const varts = variantsBySrv[srvIdStr] || [];

      const mappedService = {
          ...s,
          serviceId: srvIdStr,
          productDbId: srvIdStr,
          title: String(s.title || s.name || ''),
          name: String(s.title || s.name || ''),
          subtitle: String(s.subtitle || ''),
          description: String(s.description || ''),
          image: String(s.image || ''),
          categoryId: catId,
          category_id: catId,
          variants: varts,
          hasVariants: varts.length > 0
      };

      if (!servicesByCat[catId]) servicesByCat[catId] = [];
      servicesByCat[catId].push(mappedService);
    });

    const allCategories = [...(adminCats || []), ...(dbCategories || [])];
    const categoryMap = new Map();
    allCategories.forEach(category => {
      const id = String(category.id || category.categoryId || '');
      const name = String(category.name || category.title || '');
      const key = id || name.toLowerCase();
      if (!key || categoryMap.has(key)) return;

      const image = resolveDynamicCategoryImageUrl(category, serverBaseUrl);
      categoryMap.set(key, {
        ...category,
        id: id || name,
        name,
        title: String(category.title || name),
        image: String(image || ''),
        services: servicesByCat[id] || [],
        parent: category.parent || 'Main Category'
      });
    });

    const categoriesList = Array.from(categoryMap.values());
    const rootCategories = categoriesList.filter(category => {
      const parent = String(category.parent || '').trim().toLowerCase();
      return !parent || parent === 'main category' || parent === 'null' || parent === 'undefined';
    });

    const isFlat = req.query.flat === 'true' || req.query.includeAll === 'true';
    let categories = isFlat ? categoriesList : (rootCategories.length > 0 ? rootCategories : categoriesList);

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    if (page && limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedCategories = categories.slice(startIndex, endIndex);

      return res.json({ 
        success: true, 
        categories: paginatedCategories,
        data: { categories: paginatedCategories },
        currentPage: page,
        totalPages: Math.ceil(categories.length / limit),
        totalCategories: categories.length
      });
    }

    res.json({
      success: true,
      categories: categories,
      data: { categories: categories }
    });
  } catch (err) {
    console.error("Fetch categories failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createCategoryAlt = async (req, res) => {
  const { name, id, image, parent } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    cachedAdminCategories = null;
    lastAdminCatFetchTime = 0;
    const category = await DbLayer.addCategory({ name, id, image, parent });
    console.log(`Added new category: ${category.name}`);
    res.json({ success: true, category: category, message: "Category created successfully" });
  } catch (err) {
    console.error("Add category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createSubcategory = async (req, res) => {
  const { name, image } = req.body;
  const parent = req.body.parent || req.body.category_id || req.body.categoryId;
  cachedAdminSubcategories = null;
  cachedAdminCategories = null;
  lastAdminSubcatFetchTime = 0;
  lastAdminCatFetchTime = 0;
  if (!name || !parent) {
    return res.status(400).json({ error: "Both name and parent are required for a subcategory" });
  }
  try {
    const category = await DbLayer.addCategory({ name, image, parent });
    console.log(`Added new subcategory: ${category.name} under ${parent}`);
    res.json({ success: true, subcategory: category, message: "Subcategory created successfully" });
  } catch (err) {
    console.error("Add subcategory failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCats = await fetchAdminBackendCategories();
    const adminSubcats = await fetchAdminBackendSubcategories();
    const dbCategories = await DbLayer.getCategories();

    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = (isLocal ? protocol : 'https') + '://' + host;

    const idNorm = String(id).toLowerCase().trim();
    const allCats = [...(adminCats || []), ...(dbCategories || [])];
    const found = allCats.find(c =>
      String(c.id).toLowerCase().trim() === idNorm ||
      String(c.title || c.name || '').toLowerCase().trim() === idNorm
    );

    if (!found) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const localizedObj = typeof localizeCategory === 'function' ? localizeCategory(found, req.lang) : found;
    const img = resolveDynamicCategoryImageUrl(found, serverBaseUrl);
    const catIdStr = String(localizedObj.id || found.id || '');
    const catTitle = String(localizedObj.name || found.name || found.title || '');

    const allSubs = collectAllSubcategories(adminSubcats, adminCats, dbCategories, serverBaseUrl);

    let subcats = allSubs.filter(s => {
      const pNorm = String(s.parent || '').toLowerCase().trim();
      const cId = String(s.categoryId || s.category_id || '').toLowerCase().trim();
      const cName = String(s.categoryName || '').toLowerCase().trim();
      return pNorm === idNorm || pNorm === catTitle.toLowerCase().trim() || cId === catIdStr.toLowerCase().trim() || cName === catTitle.toLowerCase().trim();
    });

    if (subcats.length === 0) {
      const dbSubs = dbCategories
        .filter(c => {
          if (!c.parent || c.parent === 'Main Category') return false;
          const pNorm = String(c.parent).toLowerCase().trim();
          return pNorm === idNorm || pNorm === catTitle.toLowerCase().trim() || pNorm === catIdStr.toLowerCase().trim();
        })
        .map(c => {
          const subImg = resolveDynamicCategoryImageUrl(c, serverBaseUrl);
          return {
            id: String(c.id),
            subCategoryId: String(c.id),
            categoryId: catIdStr,
            category_id: isNaN(catIdStr) ? catIdStr : parseInt(catIdStr),
            name: c.title || c.name || '',
            title: c.title || c.name || '',
            subCategoryName: c.title || c.name || '',
            categoryName: catTitle,
            image: String(subImg || ''),
            subCategoryImage: String(subImg || ''),
            categoryImage: String(subImg || ''),
            parent: c.parent,
            status: c.status === 0 ? 'inactive' : 'active',
            services: []
          };
        });
      subcats = dbSubs.length > 0 ? dbSubs : generateSubcategoriesForCategory({ ...found, image: img });
    }

    const categoryData = {
      ...found,
      id: isNaN(catIdStr) ? catIdStr : parseInt(catIdStr),
      title: catTitle,
      name: catTitle,
      image: String(img || ''),
      status: found.status === 0 ? false : true,
      parent: found.parent || 'Main Category',
      subcategories: subcats,
      sub_categories: subcats,
      subCategories: subcats
    };

    res.json({
      success: true,
      data: categoryData,
      category: categoryData
    });
  } catch (err) {
    console.error('Fetch single category failed:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const getSubcategories = async (req, res) => {
  try {
    // 1. Read parent/category filter
    const parent =
      req.query.parent ||
      req.query.category_id ||
      req.query.categoryId ||
      req.query.category ||
      null;

    // 2. Fetch data from all available sources
    const adminCats = await fetchAdminBackendCategories();
    const adminSubcats = await fetchAdminBackendSubcategories();
    const dbCategories = await DbLayer.getCategories();

    // 3. Build request-based image URL
    const host = req.get("host") || "";
    const protocol = req.protocol || "https";
    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("10.0.2.2");

    const serverBaseUrl = `${isLocal ? protocol : "https"}://${host}`;

    // 4. Collect subcategories
    let subcategories = collectAllSubcategories(
      adminSubcats || [],
      adminCats || [],
      dbCategories || [],
      serverBaseUrl
    );

    if (!Array.isArray(subcategories)) {
      subcategories = [];
    }

    // 5. Fallback: generate subcategories if none exist
    if (subcategories.length === 0) {
      const rootCategories = (dbCategories || []).filter((category) => {
        const categoryParent = String(category.parent || "")
          .trim()
          .toLowerCase();

        return (
          !categoryParent ||
          categoryParent === "main category" ||
          categoryParent === "null" ||
          categoryParent === "undefined"
        );
      });

      rootCategories.forEach((category) => {
        const image = resolveDynamicCategoryImageUrl(
          category,
          serverBaseUrl
        );

        const generatedSubcategories = generateSubcategoriesForCategory({
          ...category,
          image,
        });

        if (Array.isArray(generatedSubcategories)) {
          subcategories.push(...generatedSubcategories);
        }
      });
    }

    // Normalize values for matching
    const normalize = (value) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    // 6. Filter by requested parent/category
    if (parent !== null && String(parent).trim() !== "") {
      const requestedParent = normalize(parent);

      subcategories = subcategories.filter((subcategory) => {
        const possibleParentValues = [
          subcategory.parent,
          subcategory.categoryId,
          subcategory.category_id,
          subcategory.categoryName,
          subcategory.category_name,
          subcategory.parent_id,
        ];

        return possibleParentValues.some(
          (value) => normalize(value) === requestedParent
        );
      });
    }

    // 7. Remove duplicates by parent + normalized subcategory name
    const uniqueSubcategories = new Map();

    subcategories.forEach((subcategory) => {
      if (!subcategory || typeof subcategory !== "object") {
        return;
      }

      const subcategoryId = String(
        subcategory.id ||
          subcategory.subCategoryId ||
          subcategory.subcategory_id ||
          subcategory.sub_category_id ||
          ""
      ).trim();

      const subcategoryName = normalize(
        subcategory.name ||
          subcategory.title ||
          subcategory.subCategoryName ||
          subcategory.subcategory_name ||
          ""
      );

      const parentKey = normalize(
        subcategory.parent ||
          subcategory.categoryId ||
          subcategory.category_id ||
          subcategory.categoryName ||
          subcategory.category_name ||
          ""
      );

      let uniqueKey;

      if (subcategoryName) {
        uniqueKey = `parent:${parentKey}|name:${subcategoryName}`;
      } else if (subcategoryId) {
        uniqueKey = `parent:${parentKey}|id:${subcategoryId}`;
      } else {
        return;
      }

      if (!uniqueSubcategories.has(uniqueKey)) {
        uniqueSubcategories.set(uniqueKey, { ...subcategory });
      }
    });

    const finalSubcategories = Array.from(uniqueSubcategories.values());

    // 8. Return response
    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      total: finalSubcategories.length,
      subcategories: finalSubcategories,
    });
  } catch (err) {
    console.error("Fetch subcategories failed:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCategorySubcategories = async (req, res) => {
  try {
    const { category } = req.params;
    const adminCats = await fetchAdminBackendCategories();
    const adminSubcats = await fetchAdminBackendSubcategories();
    const dbCategories = await DbLayer.getCategories();

    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

    const catNorm = String(category).toLowerCase().trim();

    const allCats = [...(adminCats || []), ...(dbCategories || [])];
    const targetCat = allCats.find(c => 
      String(c.id).toLowerCase().trim() === catNorm || 
      String(c.name || c.title || '').toLowerCase().trim() === catNorm
    );

    const matchName = targetCat ? (targetCat.name || targetCat.title) : category;
    const matchId = targetCat ? String(targetCat.id || targetCat.categoryId) : category;
    const allSubs = collectAllSubcategories(adminSubcats, adminCats, dbCategories, serverBaseUrl);

    let subcats = dbCategories
      .filter(c => {
        if (!c.parent || c.parent === 'Main Category') return false;
        const pNorm = String(c.parent).toLowerCase().trim();
        return pNorm === catNorm || pNorm === matchName.toLowerCase().trim() || pNorm === matchId.toLowerCase().trim();
      })
      .map(c => {
        const img = resolveDynamicCategoryImageUrl(c, serverBaseUrl);
        return {
          subCategoryId: String(c.id),
          categoryId: String(c.id),
          subCategoryName: c.title || c.name || '',
          categoryName: c.title || c.name || '',
          subCategoryImage: String(img || ''),
          categoryImage: String(img || ''),
          parent: c.parent,
          status: c.status === 0 ? "inactive" : "active"
        };
      });

    const matchedAdminSubs = allSubs.filter(s => {
      const pNorm = String(s.parent || '').toLowerCase().trim();
      const cId = String(s.categoryId || s.category_id || '').toLowerCase().trim();
      const cName = String(s.categoryName || '').toLowerCase().trim();
      return pNorm === catNorm || pNorm === matchName.toLowerCase().trim() || cId === matchId.toLowerCase().trim() || cName === matchName.toLowerCase().trim() || cId === catNorm;
    });

    if (matchedAdminSubs.length > 0) {
      subcats = matchedAdminSubs;
    }

    if (subcats.length === 0 && targetCat) {
      const img = resolveDynamicCategoryImageUrl(targetCat, serverBaseUrl);
      subcats = generateSubcategoriesForCategory({ ...targetCat, image: img });
    }

    // Strict deduplication by subCategoryId and subCategoryName
    const dedupedMap = new Map();
    (subcats || []).forEach(sub => {
      if (!sub) return;
      const subId = String(sub.id || sub.subCategoryId || sub.sub_category_id || '').trim();
      const subName = String(sub.title || sub.name || sub.subCategoryName || '').toLowerCase().trim();
      const key = subId && !subId.startsWith('sub_') ? ('id_' + subId) : ('name_' + subName);
      
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, { ...sub });
      } else {
        const existing = dedupedMap.get(key);
        if ((!existing.services || existing.services.length === 0) && Array.isArray(sub.services) && sub.services.length > 0) {
          existing.services = sub.services;
        }
      }
    });

    const finalSubcats = Array.from(dedupedMap.values());

    res.json({
      success: true,
      category: matchName,
      total: finalSubcats.length,
      subcategories: finalSubcats,
    });
  } catch (err) {
    console.error("Fetch category subcategories failed:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getBanners = async (req, res) => {
  let dbBanners = [];
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  try {
    if (getMysqlReady()) {
      const [rows] = await getMysqlPool().query("SELECT * FROM node_banners ORDER BY id ASC");
      if (rows && rows.length > 0) {
        dbBanners = rows.map(r => {
          const img = resolveDynamicBannerImageUrl(r, serverBaseUrl);

          return {
            id: String(r.id),
            image: img,
            bannerImage: img,
            imageUrl: img,
            photo: img,
            url: img,
            rawImage: r.image || "",
            title: r.title || "",
            category: r.category || "",
            badge: r.badge || "",
            subtitle: r.subtitle || "",
            buttonText: r.buttonText || "Book Now"
          };
        });
      }
    } else {
      // JSON fallback: load from database.json
      try {
        const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
        if (data && data.banners && data.banners.length > 0) {
          dbBanners = data.banners.map(b => {
            const img = resolveDynamicBannerImageUrl(b, serverBaseUrl);
            return {
              ...b,
              image: img,
              bannerImage: img,
              imageUrl: img,
              photo: img,
              url: img
            };
          });
        }
      } catch (jsonErr) {
        console.warn("[DynamicBanners] JSON fallback read failed:", jsonErr.message);
      }
    }
  } catch (err) {
    console.warn("[DynamicBanners] DB query failed:", err.message);
  }

  if (dbBanners.length === 0) {
    dbBanners = BANNERS_DATA.map(b => ({
      ...b,
      bannerImage: b.image,
      imageUrl: b.image,
      photo: b.image,
      url: b.image
    }));
  }



  res.json({
    success: true,
    banners: dbBanners,
    data: dbBanners,
    message: translate("banners_retrieved", req.lang)
  });
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  createBanner,
  updateBanner,
  deleteBanner,
  createService,
  updateService,
  deleteService,
  getCategories,
  createCategoryAlt,
  createSubcategory,
  getCategoryById,
  getSubcategories,
  getCategorySubcategories,
  getBanners
};