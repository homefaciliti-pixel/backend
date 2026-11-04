const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { getLocalCategoryAssetUrl } = require('../utils/imageHelpers');

const amcStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'amc');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const amcUpload = multer({
  storage: amcStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP images and PDF files are allowed'));
  }
});

const generalUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const generalUpload = multer({ storage: generalUploadStorage });

const uploadsProxyMiddleware = async (req, res, next) => {
  const relPath = req.path.replace(/^\/+/, '');
  if (!relPath) return next();

  const baseDir = path.join(__dirname, '..');

  // 1. Check if uploaded file exists in backend/uploads/
  const uploadsPath = path.resolve(baseDir, 'uploads', relPath);
  if (fs.existsSync(uploadsPath) && fs.statSync(uploadsPath).size > 0) {
    return res.sendFile(uploadsPath);
  }

  // 2. Check if uploaded file exists in backend/assets/uploads/
  const assetsUploadsPath = path.resolve(baseDir, 'assets', 'uploads', relPath);
  if (fs.existsSync(assetsUploadsPath) && fs.statSync(assetsUploadsPath).size > 0) {
    return res.sendFile(assetsUploadsPath);
  }

  // 3. Direct match in assets/categories/, assets/banners/, or assets/services/
  const catPath = path.resolve(baseDir, 'assets', 'categories', relPath);
  if (fs.existsSync(catPath)) return res.sendFile(catPath);

  const bannerPath = path.resolve(baseDir, 'assets', 'banners', relPath);
  if (fs.existsSync(bannerPath)) return res.sendFile(bannerPath);

  const srvPath = path.resolve(baseDir, 'assets', 'services', relPath);
  if (fs.existsSync(srvPath)) return res.sendFile(srvPath);

  // 4. Instant 3D Category Asset Fallback check
  const norm = relPath.toLowerCase();

  function sendCategoryFile(res, targetFilename) {
    const catDir = path.resolve(baseDir, 'assets', 'categories');
    const targetLower = targetFilename.toLowerCase();
    try {
      const files = fs.readdirSync(catDir);
      const match = files.find(f => f.toLowerCase() === targetLower);
      if (match) {
        return res.sendFile(path.resolve(catDir, match));
      }
    } catch (e) {}
    return res.sendFile(path.resolve(catDir, 'plumber_3d.png'));
  }

    // Check known category timestamp IDs & names
  if (norm.includes('1786447188981') || norm.includes('car_wash') || norm.includes('carwashing') || (norm.includes('car') && norm.includes('wash'))) return sendCategoryFile(res, 'car_washing_3d.jpg');
  if (norm.includes('1786436206314') || norm.includes('plumb')) return sendCategoryFile(res, 'plumber_3d.png');
  if (norm.includes('1786436786199') || norm.includes('electr')) return sendCategoryFile(res, 'electrician_3d.png');
  if (norm.includes('1786435950565') || norm.includes('salon')) return sendCategoryFile(res, 'salon_3d.jpg');
  if (norm.includes('1786442488680') || norm.includes('spa')) return sendCategoryFile(res, 'spa_3d.png');
  if (norm.includes('1786435733935') || norm.includes('clean')) return sendCategoryFile(res, 'cleaning_3d.jpg');
  if (norm.includes('1786446437586') || norm.includes('architect')) return sendCategoryFile(res, 'architecture_3d.png');
  if (norm.includes('1786446696715') || norm.includes('carpen')) return sendCategoryFile(res, 'carpenter_3d.jpg');
  if (norm.includes('1786447506154') || norm.includes('mechanic')) return sendCategoryFile(res, 'mechanic_3d.png');
  if (norm.includes('1786443552623') || norm.includes('ac_repair') || norm.includes('ac-repair')) return sendCategoryFile(res, 'ac_repair_3d.jpg');
  if (norm.includes('1786443775719') || norm.includes('advocate')) return sendCategoryFile(res, 'advocate_3d.jpg');
  if (norm.includes('1786444894705') || norm.includes('compound')) return sendCategoryFile(res, 'compounder_3d.png');
  if (norm.includes('1786449409020') || norm.includes('doctor')) return sendCategoryFile(res, 'doctor_3d.png');
  if (norm.includes('1786448684632') || norm.includes('cater') || norm.includes('halwai')) return sendCategoryFile(res, 'caters_3d.jpg');
  if (norm.includes('1786449239057') || norm.includes('driver')) return sendCategoryFile(res, 'driver_3d.jpg');
  if (norm.includes('1786450010056') || norm.includes('interior')) return sendCategoryFile(res, 'interior_design_3d.png');
  if (norm.includes('1786450312316') || norm.includes('pest')) return sendCategoryFile(res, 'pest_control_3d.jpg');
  if (norm.includes('1786450771532') || norm.includes('photo')) return sendCategoryFile(res, 'photographer_3d.jpg');
  if (norm.includes('1786451019343') || norm.includes('paint')) return sendCategoryFile(res, 'painter_3d.jpg');
  if (norm.includes('1786451422502') || norm.includes('repair')) return sendCategoryFile(res, 'repairing_3d.jpg');
  if (norm.includes('1786451601583') || norm.includes('solar')) return sendCategoryFile(res, 'solar_3d.png');
  if (norm.includes('1786451938166') || norm.includes('tax')) return sendCategoryFile(res, 'tax_consultancy_3d.jpg');
  if (norm.includes('1786452243309') || norm.includes('contract')) return sendCategoryFile(res, 'contractor_3d.png');
  if (norm.includes('1786452463146') || norm.includes('pandit') || norm.includes('pandat')) return sendCategoryFile(res, 'pandat_ji_3d.png');
  if (norm.includes('1786452895272') || norm.includes('velding') || norm.includes('iron')) return sendCategoryFile(res, 'velding_icon_3d.png');

  // 5. Proxy check: Try fetching live uploaded file from Admin Backend if present
  try {
    const adminUrl = `https://adminbackend-1-h03r.onrender.com/uploads/${encodeURIComponent(relPath)}`;

    const proxied = await new Promise((resolve) => {
      const pReq = https.get(adminUrl, { timeout: 3500 }, (pRes) => {
        if (pRes.statusCode === 200) {
          res.setHeader('Content-Type', pRes.headers['content-type'] || 'image/jpeg');
          try {
            const dir = path.dirname(uploadsPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const fileStream = fs.createWriteStream(uploadsPath);
            pRes.pipe(fileStream);
          } catch (e) {}
          pRes.pipe(res);
          return resolve(true);
        }
        resolve(false);
      });
      pReq.on('error', () => resolve(false));
      pReq.on('timeout', () => { pReq.destroy(); resolve(false); });
    });

    if (proxied) return;
  } catch (e) {
    console.warn(`[Proxy uploads error for ${relPath}]:`, e.message);
  }

    // Contractor
  if (norm.includes('1786452243309') || norm.includes('contract')) {
    return sendCategoryFile(res, 'contractor_3d.png');
  }
  // Pandit Ji
  if (norm.includes('1786452463146') || norm.includes('pandit') || norm.includes('pooja') || norm.includes('puja')) {
    return sendCategoryFile(res, 'pandat_ji_3d.png');
  }
  // Cleaning
  if (norm.includes('1786435733935') || norm.includes('clean')) {
    return sendCategoryFile(res, 'cleaning_3d.jpg');
  }
  // Iron Works / Welding
  if (norm.includes('1788515844051') || norm.includes('1786452895272') || norm.includes('iron') || norm.includes('weld')) {
    return sendCategoryFile(res, 'velding_icon_3d.png');
  }

  // Banner Matches (Direct HTTP 200 OK Banner PNG files)
  if (norm.includes('1787722971478') || norm.includes('ganesh') || norm.includes('chaturthi') || (norm.includes('banner') && norm.includes('ac'))) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'ac_services_banner.png'));
  if (norm.includes('1787722479893') || norm.includes('amc') || norm.includes('home') || norm.includes('swayam')) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'amc_services_banner.png'));
  if (norm.includes('refer') || norm.includes('earn') || norm.includes('banner') || norm.includes('1788783070948')) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'refer_earn_banner.png'));

  // Default Fallback
  sendCategoryFile(res, 'plumber_3d.png');
};

module.exports = {
  amcUpload,
  generalUpload,
  uploadsProxyMiddleware
};
