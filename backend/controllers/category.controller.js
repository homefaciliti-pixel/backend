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
const updateBanner = async (req, res) => {
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
          subCategoryId: s.subCategoryId || s.sub_category_id ? String(s.subCategoryId || s.sub_category_id) : (s.subCategory || s.sub_category ? String(s.subCategory || s.sub_category) : null),
          sub_category_id: s.sub_category_id || s.subCategoryId ? String(s.sub_category_id || s.subCategoryId) : (s.sub_category || s.subCategory ? String(s.sub_category || s.subCategory) : null),
          subCategory: s.subCategory || s.sub_category || null,
          sub_category: s.sub_category || s.subCategory || null,
          status: s.status === 0 ? "inactive" : "active",
          rating: Number(s.rating || 4.5),
          reviewsCount: Number(s.reviewsCount || 0),
          discount: Number(s.discount || 0),
          cutPrice: Number(s.cutPrice || s.price || 0),
          price: Number(s.price || 0),
          hasVariants: varts.length > 0,
          variants: varts
      };

      const catName = String(s.categoryName || s.category_name || s.category || '').trim();
      const catKeyLower = catId.toLowerCase().trim();
      const catNameLower = catName.toLowerCase().trim();

      if (catId) {
        if (!servicesByCat[catId]) servicesByCat[catId] = [];
        servicesByCat[catId].push(mappedService);
        if (catKeyLower !== catId) {
          if (!servicesByCat[catKeyLower]) servicesByCat[catKeyLower] = [];
          servicesByCat[catKeyLower].push(mappedService);
        }
      }
      if (catName) {
        if (!servicesByCat[catName]) servicesByCat[catName] = [];
        servicesByCat[catName].push(mappedService);
        if (catNameLower !== catName) {
          if (!servicesByCat[catNameLower]) servicesByCat[catNameLower] = [];
          servicesByCat[catNameLower].push(mappedService);
        }
      }
    });

    // Centralize categories: combine adminCats and dbCategories
    const catMap = new Map();

    (dbCategories || []).forEach(c => {
      const idKey = String(c.id || c.categoryId || '').trim();
      if (idKey) catMap.set(idKey, { ...c });
    });

    (adminCats || []).forEach(ac => {
      const idKey = String(ac.id || ac.categoryId || '').trim();
      const titleKey = String(ac.title || ac.name || '').trim().toLowerCase();
      
      let existingKey = null;
      if (idKey && catMap.has(idKey)) {
        existingKey = idKey;
      } else {
        for (const [k, v] of catMap.entries()) {
          const vTitle = String(v.title || v.name || '').trim().toLowerCase();
          if (vTitle && vTitle === titleKey) {
            existingKey = k;
            break;
          }
        }
      }

      const adminNestedSubs = Array.isArray(ac.subcategories) ? ac.subcategories : (Array.isArray(ac.subCategories) ? ac.subCategories : (Array.isArray(ac.sub_categories) ? ac.sub_categories : []));

      if (existingKey) {
        const existing = catMap.get(existingKey);
        catMap.set(existingKey, {
          ...existing,
          ...ac,
          id: existing.id || ac.id,
          title: ac.title || ac.name || existing.title || existing.name,
          name: ac.title || ac.name || existing.title || existing.name,
          image: ac.image || ac.photo || existing.image,
          status: (ac.status === false || ac.status === 0 || ac.status === 'inactive') ? 'inactive' : 'active',
          adminSubcategories: adminNestedSubs
        });
      } else if (idKey || titleKey) {
        const newKey = idKey || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        catMap.set(newKey, {
          ...ac,
          id: newKey,
          title: ac.title || ac.name || '',
          name: ac.title || ac.name || '',
          image: ac.image || ac.photo || '',
          status: (ac.status === false || ac.status === 0 || ac.status === 'inactive') ? 'inactive' : 'active',
          parent: ac.parent || 'Main Category',
          adminSubcategories: adminNestedSubs
        });
      }
    });

    const combinedCategoriesList = Array.from(catMap.values());

    // Map subcategories from adminSubcats and dbCategories by parent key
    const subCatsByCatKey = {};

    function addSubCatToGroup(key, subObj) {
      if (!key) return;
      const k = String(key).toLowerCase().trim();
      if (!subCatsByCatKey[k]) subCatsByCatKey[k] = [];
      const exists = subCatsByCatKey[k].some(s => 
        String(s.id || s.subCategoryId).toLowerCase() === String(subObj.id || subObj.subCategoryId).toLowerCase() ||
        String(s.name || s.title).toLowerCase().trim() === String(subObj.name || subObj.title).toLowerCase().trim()
      );
      if (!exists) {
        subCatsByCatKey[k].push(subObj);
      }
    }

    (adminSubcats || []).forEach(sub => {
      const catId = String(sub.category_id || sub.categoryId || sub.parent_id || sub.parent || '').trim();
      const catName = String(sub.category_name || sub.categoryName || sub.parent || '').trim();
      if (catId) addSubCatToGroup(catId, sub);
      if (catName) addSubCatToGroup(catName, sub);
    });

    (dbCategories || []).forEach(c => {
      const parentVal = String(c.parent || '').trim();
      if (parentVal && parentVal !== 'Main Category' && parentVal !== 'null' && parentVal !== 'undefined') {
        addSubCatToGroup(parentVal, c);
      }
    });

    let categoriesList = combinedCategoriesList.map(c => {
      const img = resolveDynamicCategoryImageUrl(c, serverBaseUrl);
      const localizedObj = typeof localizeCategory === 'function' ? localizeCategory(c, req.lang) : c;

      const catIdStr = String(localizedObj.id || c.id || '');
      const catTitle = String(localizedObj.name || c.name || c.title || '');
      const catIdLower = catIdStr.toLowerCase().trim();
      const catTitleLower = catTitle.toLowerCase().trim();

      const catServices = servicesByCat[catIdStr] || servicesByCat[catIdLower] || servicesByCat[catTitle] || servicesByCat[catTitleLower] || [];

      return {
        ...c,
        id: catIdStr,
        name: catTitle,
        title: catTitle,
        image: String(img || ''),
        categoryId: catIdStr,
        categoryName: catTitle,
        categoryImage: String(img || ''),
        parent: c.parent || 'Main Category',
        status: c.status === 0 ? "inactive" : "active",
        services: catServices
      };
    });

    // Handle Subcategories nesting logic
    const subCategoriesByParent = {};
    const rootCategories = [];

    categoriesList.forEach(c => {
      const parentVal = String(c.parent || '').trim();

      if (parentVal && parentVal !== 'Main Category' && parentVal !== 'null' && parentVal !== 'undefined') {
        const parentKey = parentVal.toLowerCase();
        if (!subCategoriesByParent[parentKey]) subCategoriesByParent[parentKey] = [];
        
        const subCatObj = {
          ...c,
          subCategoryId: String(c.id || c.categoryId),
          subCategoryName: String(c.name || c.categoryName),
          subCategoryImage: String(c.image || c.categoryImage)
        };
        subCategoriesByParent[parentKey].push(subCatObj);
      } else {
        rootCategories.push(c);
      }
    });

    // Attach subCategories array to every category (ensuring 2 subcategories per category for checking)
    categoriesList.forEach(c => {
      const catIdStr = String(c.id || c.categoryId);
      const catNameStr = String(c.name || c.categoryName);
      const catIdLower = catIdStr.toLowerCase().trim();
      const catNameLower = catNameStr.toLowerCase().trim();

      let subCats = subCategoriesByParent[catIdStr] || 
                    subCategoriesByParent[catIdLower] || 
                    subCategoriesByParent[catNameStr] || 
                    subCategoriesByParent[catNameLower] || [];

      // Collect all subcategories from admin backend and DB
      let rawSubs = Array.isArray(c.adminSubcategories) && c.adminSubcategories.length > 0 ? [...c.adminSubcategories] : [];

      const groupedSubs = [
        ...(subCategoriesByParent[catIdStr] || []),
        ...(subCategoriesByParent[catIdLower] || []),
        ...(subCategoriesByParent[catNameStr] || []),
        ...(subCategoriesByParent[catNameLower] || []),
        ...(subCatsByCatKey[catIdStr] || []),
        ...(subCatsByCatKey[catIdLower] || []),
        ...(subCatsByCatKey[catNameStr] || []),
        ...(subCatsByCatKey[catNameLower] || [])
      ];

      groupedSubs.forEach(gs => {
        const already = rawSubs.some(r => 
          String(r.id || r.subCategoryId) === String(gs.id || gs.subCategoryId) ||
          String(r.name || r.title).toLowerCase().trim() === String(gs.name || gs.title).toLowerCase().trim()
        );
        if (!already) rawSubs.push(gs);
      });

      if (rawSubs.length > 0) {
        subCats = rawSubs.map((sub, idx) => {
          const subIdStr = String(sub.id || sub.subCategoryId || sub.sub_category_id || `${catIdStr}_sub_${idx + 1}`);
          const subTitle = String(sub.title || sub.name || sub.subCategoryName || '').trim();
          
          let subImg = sub.image || sub.subCategoryImage || sub.photo || '';
          if (subImg && typeof subImg === 'string') {
            subImg = subImg.trim();
            if (!subImg.startsWith('http://') && !subImg.startsWith('https://')) {
              const clean = subImg.replace(/^\/+/, '').replace(/^uploads\//, '');
              subImg = `https://adminbackend-1-h03r.onrender.com/uploads/${clean}`;
            }
          }
          if (!subImg || subImg === '1') {
            subImg = c.image || c.categoryImage || '';
          }

          const subNorm = subTitle.toLowerCase();
          let subServices = allServices.filter(s => {
            const sSubId = String(s.subCategoryId || s.sub_category_id || '');
            const sSubName = String(s.subCategory || s.sub_category || '').toLowerCase().trim();
            return (sSubId && sSubId === subIdStr) || (sSubName && sSubName === subNorm);
          });

          if (subServices.length === 0) {
            subServices = generateDefaultServicesForSubCategory(subTitle, catNameStr, catIdStr, subIdStr);
          }

          return {
            id: subIdStr,
            subCategoryId: subIdStr,
            sub_category_id: subIdStr,
            categoryId: catIdStr,
            category_id: isNaN(catIdStr) ? catIdStr : parseInt(catIdStr),
            name: subTitle,
            title: subTitle,
            subCategoryName: subTitle,
            categoryName: catNameStr,
            image: String(subImg || ''),
            subCategoryImage: String(subImg || ''),
            categoryImage: String(c.image || c.categoryImage || ''),
            parent: catNameStr,
            status: (sub.status === 0 || sub.status === false || sub.status === 'inactive') ? 'inactive' : 'active',
            services: subServices
          };
        });
      }

      if (subCats.length === 0) {
        subCats = generateSubcategoriesForCategory(c);
      }

      c.subCategories = subCats;
      c.subcategories = subCats;
      c.sub_categories = subCats;
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
    const parent = req.query.parent || req.query.category_id || req.query.categoryId || req.query.category;
    const adminCats = await fetchAdminBackendCategories();
    const adminSubcats = await fetchAdminBackendSubcategories();
    const dbCategories = await DbLayer.getCategories();
    
    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

    let subcats = collectAllSubcategories(adminSubcats, adminCats, dbCategories, serverBaseUrl);

    // If DB has no explicit subcategories, generate 2 per main category
    if (subcats.length === 0) {
      const rootCats = dbCategories.filter(c => !c.parent || c.parent === 'Main Category' || c.parent === '');
      rootCats.forEach(c => {
        const img = resolveDynamicCategoryImageUrl(c, serverBaseUrl);
        const generated = generateSubcategoriesForCategory({ ...c, image: img });
        subcats.push(...generated);
      });
    }

    if (parent) {
      const pNorm = String(parent).toLowerCase().trim();
      subcats = subcats.filter(s => 
        String(s.parent || '').toLowerCase().trim() === pNorm ||
        String(s.categoryId || s.category_id || '').toLowerCase().trim() === pNorm ||
        String(s.categoryName || '').toLowerCase().trim() === pNorm
      );
    }

    res.json({
      success: true,
      message: "Subcategories fetched successfully",
      total: subcats.length,
      subcategories: subcats,
    });
  } catch (err) {
    console.error("Fetch subcategories failed:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

    res.json({
      success: true,
      category: matchName,
      total: subcats.length,
      subcategories: subcats,
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
