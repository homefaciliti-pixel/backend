const path = require('path');

const getLocalCategoryAssetUrl = (name, serverBaseUrl) => {
  const norm = (name || '').toLowerCase().trim();
  let file = '1_Plumber.png';
  
  if (norm.includes('plumb')) file = '1_Plumber.png';
  else if (norm.includes('electric')) file = '3_Electrician.png';
  else if (norm === 'salon' || norm.includes('salon')) file = '5_Salon.png';
  else if (norm.includes('clean')) file = '7_Cleaning.png';
  else if (norm.includes('architect') || norm.includes('arch')) file = '9_Architect.png';
  else if (norm.includes('carpen') || norm.includes('wood')) file = '11_Carpenter.png';
  else if (norm === 'car washing' || norm.includes('wash')) file = '27_Car_Washing.png';
  else if (norm.includes('mechanic')) file = '29_Mechanic.png';
  else if (norm.includes('spa')) file = '37_Spa.png';
  else if (norm.includes('ac repair') || norm.includes('air') || norm === 'ac' || norm.startsWith('ac ')) file = '38_AC_Repair.png';
  else if (norm.includes('advocate') || norm.includes('lawyer')) file = '39_Advocate.png';
  else if (norm.includes('compound') || norm.includes('nurse')) file = '40_Compounder.png';
  else if (norm.includes('halwai') || norm.includes('cater')) file = '41_Cater_s.png';
  else if (norm.includes('driver')) file = '42_Driver.png';
  else if (norm.includes('doctor') || norm.includes('doc')) file = '43_Doctor.png';
  else if (norm.includes('interior')) file = '45_Interior_Design.png';
  else if (norm.includes('pest')) file = '46_Pest_Control.png';
  else if (norm.includes('photo')) file = '48_Photographer.png';
  else if (norm.includes('paint')) file = '49_Painter.png';
  else if (norm.includes('repair')) file = '50_Repairing.png';
  else if (norm.includes('solar')) file = '51_Solar.png';
  else if (norm.includes('tax')) file = '52_Tax_Consultancy.png';
  else if (norm.includes('contract')) file = '57_Contractor.png';
  else if (norm.includes('pandit') || norm.includes('puja') || norm.includes('pooja')) file = '58_Pandit_Ji.jpg';
  else if (norm.includes('iron') || norm.includes('weld')) file = '60_Iron_Works.png';
  else if (norm.includes('bike') || norm.includes('motor')) file = '29_Mechanic.png'; // Fallback to mechanic for bikes
  
  return `${serverBaseUrl}/assets/categories/${file}`;
};

const getLocalBannerAssetUrl = (title, serverBaseUrl) => {
  const norm = (title || '').toLowerCase().trim();
  let file = 'refer_earn_banner.png';
  
  if (norm.includes('ac') || norm.includes('foam')) {
    file = 'ac_services_banner.png';
  } else if (norm.includes('clean') || norm.includes('home') || norm.includes('annual')) {
    file = 'amc_services_banner.png';
  } else {
    file = 'refer_earn_banner.png';
  }
  
  return `${serverBaseUrl}/assets/banners/${file}`;
};

const resolveDynamicCategoryImageUrl = (c, serverBaseUrl) => {
  let img = c.image || c.categoryImage || c.photo || c.icon || '';
  if (img && typeof img === 'string') {
    img = img.trim();
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    if (img.startsWith('/assets/')) {
      return `${serverBaseUrl}${img}`;
    }
    if (img !== '1' && img !== 'null' && img !== 'undefined' && img.length > 2) {
      const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
      return `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
    }
  }
  // Static 3D icons fallback from assets/categories
  return getLocalCategoryAssetUrl(c.title || c.name || '', serverBaseUrl);
};

const resolveDynamicBannerImageUrl = (b, serverBaseUrl) => {
  let img = b.image || b.bannerImage || b.imageUrl || b.photo || b.url || b.rawImage || "";
  if (!img) return getLocalBannerAssetUrl(b.title || '', serverBaseUrl);
  
  if (img.includes('adminbackend-1-h03r.onrender.com')) {
    return img;
  }
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  if (img.startsWith('/assets/')) {
    return `${serverBaseUrl}${img}`;
  }
  const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
};

const sanitizeServiceDbObj = (r, serverBaseUrl) => {
  const dbPrice = parseFloat(r.price);
  const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
  let finalPrice = dbPrice;
  let cutPrice = dbPrice;
  let displayDiscount = 0;
  if (discountVal > 0) {
    finalPrice = Math.max(0, dbPrice - discountVal);
    displayDiscount = dbPrice > 0 ? Math.round((discountVal / dbPrice) * 100) : 0;
    displayDiscount = Math.min(100, displayDiscount);
  }

  let dbHighlights = [];
  if (r.highlights) {
    try {
      dbHighlights = typeof r.highlights === 'string' ? JSON.parse(r.highlights) : r.highlights;
    } catch (e) {
      console.warn("Failed to parse highlights:", e.message);
    }
  }
  if (!Array.isArray(dbHighlights)) {
    dbHighlights = [];
  }

  // Consistent rating resolution
  const finalRating = r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 4.8;

  // Consistent pseudo-random reviews count based on service ID
  const reviewsCount = 50 + (parseInt(r.id) * 17) % 250; 

  let resolvedImage = r.image || "";
  if (!resolvedImage || resolvedImage === "1" || resolvedImage.endsWith("/1") || resolvedImage.includes("blob:")) {
    resolvedImage = getHdFallbackServiceImageUrl(r.title || "", r.cat_name || r.category || "");
  } else {
    if (resolvedImage.startsWith('/assets/')) {
      resolvedImage = `${serverBaseUrl}${resolvedImage}`;
    } else if (!resolvedImage.startsWith('http') && !resolvedImage.startsWith('https')) {
      if (!resolvedImage.includes('/')) {
        resolvedImage = `https://adminbackend-1-h03r.onrender.com/uploads/${resolvedImage}`;
      } else {
        resolvedImage = `${serverBaseUrl.includes('localhost') || serverBaseUrl.includes('127.0.0.1') || serverBaseUrl.includes('10.0.2.2') ? 'https://homefaciliti.com' : serverBaseUrl}/uploads/services/${resolvedImage}`;
      }
    }
  }

  const defaultHighlights = [
    "Includes background-checked & certified partner",
    "30-day post-service warranty cover included",
    "Equipped with premium professional-grade tools",
    "100% safe, hygienic, and high-quality service execution"
  ];
  const finalHighlights = dbHighlights.length > 0 ? dbHighlights : defaultHighlights;

  const serviceObj = {
    id: r.id ? parseInt(r.id) : null,
    serviceId: r.id ? parseInt(r.id) : null,
    productDbId: r.id ? parseInt(r.id) : null,
    productId: r.title,
    title: r.title,
    name: r.title,
    productName: r.title,
    product_name: r.title,
    serviceName: r.title,
    price: finalPrice,
    description: r.description || "",
    productDescription: r.description || "",
    product_description: r.description || "",
    image: resolvedImage,
    discount: displayDiscount,
    rating: finalRating,
    reviewsCount: reviewsCount,
    cutPrice: cutPrice,
    isHighlighted: r.isHighlighted !== null && r.isHighlighted !== undefined ? String(r.isHighlighted) : "false",
    highlights: finalHighlights,
    category: r.category_id ? r.category_id.toString() : "",
    categoryId: r.category_id ? r.category_id.toString() : "",
    category_id: r.category_id ? r.category_id.toString() : "",
    subCategoryId: r.sub_category_id ? String(r.sub_category_id) : (r.subCategoryId ? String(r.subCategoryId) : (r.sub_category ? String(r.sub_category) : null)),
    sub_category_id: r.sub_category_id ? String(r.sub_category_id) : (r.subCategoryId ? String(r.subCategoryId) : (r.sub_category ? String(r.sub_category) : null)),
    subCategory: r.sub_category || r.subCategory || null,
    sub_category: r.sub_category || r.subCategory || null,
    duration: r.title.toLowerCase().includes("cleaning") || r.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
  };
  for (const lang of ['hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as']) {
    if (r[`title_${lang}`]) serviceObj[`title_${lang}`] = r[`title_${lang}`];
    if (r[`name_${lang}`]) serviceObj[`name_${lang}`] = r[`name_${lang}`];
    if (r[`description_${lang}`]) serviceObj[`description_${lang}`] = r[`description_${lang}`];
  }
  return serviceObj;
};

function getHdFallbackServiceImageUrl(title, categoryName) {
  const t = (title || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();

  if (t.includes('plumb') || t.includes('tap') || t.includes('pipe') || t.includes('drain') || t.includes('leak') || t.includes('basin') || t.includes('toilet') || t.includes('tank')) {
    return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('electric') || t.includes('wire') || t.includes('switch') || t.includes('fan') || t.includes('light') || t.includes('fuse') || t.includes('mcb') || t.includes('inverter') || t.includes('meter') || t.includes('wiring')) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('ac') || t.includes('air condition') || t.includes('cool') || t.includes('foam') || t.includes('gas charging') || t.includes('compressor')) {
    return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('car wash') || t.includes('car spa') || t.includes('car detail') || t.includes('foam wash') || t.includes('auto wash') || c.includes('car')) {
    return "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('clean') || t.includes('scrub') || t.includes('sofa') || t.includes('bathroom') || t.includes('kitchen') || t.includes('carpet') || t.includes('deep')) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('salon') || t.includes('hair') || t.includes('facial') || t.includes('makeup') || t.includes('waxing') || t.includes('manicure') || t.includes('pedicure') || t.includes('threading') || c.includes('salon')) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('spa') || t.includes('massage') || t.includes('therapy') || c.includes('spa')) {
    return "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('paint') || t.includes('wall') || t.includes('texture') || t.includes('putty') || c.includes('paint')) {
    return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('carpent') || t.includes('wood') || t.includes('furniture') || t.includes('door') || t.includes('window') || t.includes('lock') || c.includes('carpent')) {
    return "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('mechanic') || t.includes('bike') || t.includes('engine') || t.includes('brake') || t.includes('clutch') || t.includes('oil') || c.includes('mechanic')) {
    return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('pest') || t.includes('termite') || t.includes('cockroach') || t.includes('bedbug') || c.includes('pest')) {
    return "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('photo') || t.includes('camera') || t.includes('shoot') || t.includes('wedding') || c.includes('photo')) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('pandit') || t.includes('puja') || t.includes('pooja') || t.includes('hawan') || c.includes('pandit')) {
    return "https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('doctor') || t.includes('consultation') || t.includes('medical') || t.includes('health') || c.includes('doctor')) {
    return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('driver') || t.includes('ride') || t.includes('trip') || c.includes('driver')) {
    return "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('solar') || t.includes('panel') || t.includes('sun') || c.includes('solar')) {
    return "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('architect') || t.includes('interior') || t.includes('design') || t.includes('space') || t.includes('commercial') || c.includes('architect')) {
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('contractor') || t.includes('renovation') || t.includes('building') || t.includes('civil') || c.includes('contractor')) {
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('cater') || t.includes('halwai') || t.includes('food') || t.includes('chef') || c.includes('cater')) {
    return "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=500&auto=format&fit=crop";
  }

  return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=500&auto=format&fit=crop";
};

// Helper: Resolve relative service image URLs dynamically
function resolveServiceUrls(services, serverBaseUrl) {
  if (!Array.isArray(services)) return [];
  return services.map(s => {
    let img = s.image || s.serviceImage || s.productImage || s.photo || "";
    if (!img || img.endsWith('/uploads/1') || img === '1') {
      img = getHdFallbackServiceImageUrl(s.title || s.name || '', s.category || '');
    } else if (img.startsWith('http://') || img.startsWith('https://')) {
      // Valid HTTP/HTTPS image URL
    } else if (img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    } else {
      const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
      img = `https://adminbackend-1-h03r.onrender.com/uploads/${cleanFilename}`;
    }
    const catIdVal = s.categoryId || s.category_id || s.category || "";
    const subCatIdVal = s.subCategoryId || s.sub_category_id || null;
    const subCatNameVal = s.subCategory || s.sub_category || null;
    return {
      ...s,
      image: img,
      categoryId: catIdVal ? String(catIdVal) : "",
      category_id: catIdVal ? String(catIdVal) : "",
      category: catIdVal ? String(catIdVal) : "",
      subCategoryId: subCatIdVal ? String(subCatIdVal) : (subCatNameVal ? String(subCatNameVal) : null),
      sub_category_id: subCatIdVal ? String(subCatIdVal) : (subCatNameVal ? String(subCatNameVal) : null),
      subCategory: subCatNameVal || (subCatIdVal ? String(subCatIdVal) : null),
      sub_category: subCatNameVal || (subCatIdVal ? String(subCatIdVal) : null)
    };
  });
}

function resolveDynamicServiceImageUrl(svc, serverBaseUrl) {
  if (!svc) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop";
  const resolved = resolveServiceUrls([svc], serverBaseUrl);
  return (resolved && resolved[0] && resolved[0].image) ? resolved[0].image : (svc.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop");
}

module.exports = {
  getLocalCategoryAssetUrl,
  getLocalBannerAssetUrl,
  resolveDynamicCategoryImageUrl,
  resolveDynamicBannerImageUrl,
  sanitizeServiceDbObj,
  getHdFallbackServiceImageUrl,
  resolveServiceUrls,
  resolveDynamicServiceImageUrl
};
