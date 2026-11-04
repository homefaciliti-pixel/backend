const fs = require('fs');
const path = 'services/category.service.js';
let content = fs.readFileSync(path, 'utf8');

const unifiedFunc = `
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
          const cleanFilename = img.replace(/^\\/+/, '').replace(/^uploads\\//, '');
          img = \`https://adminbackend-1-h03r.onrender.com/uploads/\${cleanFilename}\`;
        }

        const price = parseFloat(as.price || 0);
        const discount = parseFloat(as.discount || 0);
        const finalPrice = discount > 0 ? Math.max(0, price - discount) : price;
        const displayDiscount = price > 0 && discount > 0 ? Math.min(100, Math.round((discount / price) * 100)) : 0;
        const catId = String(as.category_id || as.categoryId || as.category || '');
        const catName = as.categoryName || as.category_name || catMap[catId] || as.cat_name || as.category || '';
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
          imageUrl: img,
          price: finalPrice,
          cutPrice: price,
          discount: displayDiscount,
          rating: parseFloat(as.rating || 4.8),
          reviewsCount: 50 + (parseInt(srvId || 1) * 17) % 250,
          category: catId,
          category_id: catId,
          categoryId: catId,
          categoryName: catName,
          cat_name: catName,
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
`;

const adminCheck = `
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
`;

// Insert getUnifiedServices right before const resolveServiceDetails
content = content.replace('const resolveServiceDetails = async (productId) => {', unifiedFunc + '\nconst resolveServiceDetails = async (productId) => {');

// Insert adminCheck right after const normProduct = normalizeString(productId);
content = content.replace('const normProduct = normalizeString(productId);', 'const normProduct = normalizeString(productId);\n' + adminCheck);

// Add getUnifiedServices to exports
content = content.replace('module.exports = {', 'module.exports = {\n  getUnifiedServices,');

fs.writeFileSync(path, content, 'utf8');
console.log('Updated category.service.js successfully!');
