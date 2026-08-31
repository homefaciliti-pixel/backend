const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_FILE = path.join(__dirname, 'database.json');

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

  const finalRating = r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 4.8;
  const reviewsCount = 50 + (parseInt(r.id) * 17) % 250; 

  let resolvedImage = r.image || "";
  if (resolvedImage) {
    if (resolvedImage.startsWith('/assets/')) {
      resolvedImage = `${serverBaseUrl}${resolvedImage}`;
    } else if (!resolvedImage.startsWith('http') && !resolvedImage.startsWith('https')) {
      if (!resolvedImage.includes('/')) {
        resolvedImage = `https://adminbackend-1-h03r.onrender.com/uploads/${resolvedImage}`;
      } else {
        resolvedImage = `https://homefaciliti.com/uploads/services/${resolvedImage}`;
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
    duration: r.title.toLowerCase().includes("cleaning") || r.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
  };
  for (const lang of ['hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as']) {
    if (r[`title_${lang}`]) serviceObj[`title_${lang}`] = r[`title_${lang}`];
    if (r[`name_${lang}`]) serviceObj[`name_${lang}`] = r[`name_${lang}`];
    if (r[`description_${lang}`]) serviceObj[`description_${lang}`] = r[`description_${lang}`];
  }
  return serviceObj;
};

async function run() {
  console.log("Connecting to MySQL at:", process.env.MYSQL_HOST);
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || 3306),
      connectTimeout: 15000
    });

    console.log("Connected successfully to MySQL database.");

    // 1. Fetch categories
    const [catRows] = await connection.query("SELECT * FROM node_categories WHERE status = 1");
    const categories = catRows.map(r => {
      let img = r.image || "";
      if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
        img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
      }
      return {
        ...r,
        id: String(r.id),
        name: r.title,
        image: img
      };
    });
    console.log(`Fetched ${categories.length} categories.`);

    // 2. Fetch services
    const [srvRows] = await connection.query("SELECT * FROM node_services WHERE status IN (0, 1)");
    const services = srvRows.map(r => sanitizeServiceDbObj(r, 'https://backend-1-ux3b.onrender.com'));
    console.log(`Fetched ${services.length} services.`);

    // 3. Fetch banners
    const [bannerRows] = await connection.query("SELECT * FROM node_banners ORDER BY id ASC");
    const banners = bannerRows.map(r => {
      let img = r.image || "";
      if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
        img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
      }
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
    console.log(`Fetched ${banners.length} banners.`);

    // Read existing database.json or create new empty db
    let db = { users: {}, orders: [], referralsApplied: {}, categories: [], addresses: [], contacts: [], cart: [], services: [], banners: [] };
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        db = JSON.parse(fileContent);
      } catch (err) {
        console.warn("Failed to parse existing database.json, starting with empty database.");
      }
    }

    // Merge categories, services and banners
    db.categories = categories;
    db.services = services;
    db.banners = banners;

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log("Successfully wrote updated data to database.json.");
    process.exit(0);
  } catch (err) {
    console.error("Error during database sync:", err);
    process.exit(1);
  }
}

run();
