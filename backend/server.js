require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ----------------------------------------
// MONGOOSE SCHEMAS & MODELS
// ----------------------------------------

const mongooseUserSchema = new mongoose.Schema({
  name: { type: String, default: "Hira" },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: "hira@hmail.com" },
  location: { type: String, default: "" },
  locality: { type: String, default: "" },
  gender: { type: String, default: "Male" },
  referralCode: { type: String, required: true },
  walletBalance: { type: Number, default: 0.0 },
  countryCode: { type: String, default: "+91" }
});
const MongoUser = mongoose.model('User', mongooseUserSchema);

const mongooseOrderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userPhone: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, default: "Pending" },
  bookingStatus: { type: String, default: "searching" },
  partnerName: { type: String, default: null },
  partnerDistance: { type: String, default: null },
  createdAt: { type: Number, default: () => Date.now() }
});
const MongoOrder = mongoose.model('Order', mongooseOrderSchema);

const mongooseReferralAppliedSchema = new mongoose.Schema({
  userPhone: { type: String, required: true, unique: true },
  referrerPhone: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
});
const MongoReferralApplied = mongoose.model('ReferralApplied', mongooseReferralAppliedSchema);

const mongooseCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  image: { type: String, default: "" }
});
const MongoCategory = mongoose.model('Category', mongooseCategorySchema);

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (MongoDB)
// ----------------------------------------
const MongoDbLayer = {
  // --- USER METHODS ---
  async getUserByPhone(phone) {
    return await MongoUser.findOne({ phone: phone }).lean();
  },

  async getUserByReferralCode(code) {
    return await MongoUser.findOne({ referralCode: code }).lean();
  },

  async createUser(user) {
    const newUser = new MongoUser(user);
    await newUser.save();
    return newUser.toObject();
  },

  async updateUser(phone, updates) {
    return await MongoUser.findOneAndUpdate({ phone: phone }, { $set: updates }, { new: true }).lean();
  },

  async countUsers() {
    return await MongoUser.countDocuments();
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    return await MongoOrder.findOne({ id: id }).lean();
  },

  async getOrdersByUserPhone(phone) {
    return await MongoOrder.find({ userPhone: phone }).sort({ id: -1 }).lean();
  },

  async createOrder(order) {
    const newOrder = new MongoOrder(order);
    await newOrder.save();
    return newOrder.toObject();
  },

  async updateOrder(id, updates) {
    return await MongoOrder.findOneAndUpdate({ id: id }, { $set: updates }, { new: true }).lean();
  },

  async getLastOrderId() {
    const last = await MongoOrder.findOne().sort({ id: -1 }).lean();
    return last ? last.id : 0;
  },

  async countOrders() {
    return await MongoOrder.countDocuments();
  },

  // --- REFERRAL METHODS ---
  async getReferralApplied(phone) {
    return await MongoReferralApplied.findOne({ userPhone: phone }).lean();
  },

  async createReferralApplied(referralApplied) {
    const newRef = new MongoReferralApplied(referralApplied);
    await newRef.save();
    return newRef.toObject();
  },

  // --- CATEGORY METHODS ---
  async getCategories() {
    const list = await MongoCategory.find().lean();
    return list.map(c => ({
      id: c.id,
      name: c.name,
      image: c.image || ""
    }));
  },

  async addCategory(categoryData) {
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    const existing = await MongoCategory.findOne({ $or: [{ name: name }, { id: finalId }] }).lean();
    if (existing) return existing;
    const newCat = new MongoCategory({ id: finalId, name: name, image: image || "" });
    await newCat.save();
    return newCat.toObject();
  }
};

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (JSON File Database fallback)
// ----------------------------------------
const DB_FILE = path.join(__dirname, 'database.json');

const DEFAULT_CATEGORIES = [
  { id: "plumber", name: "Plumber", image: "https://cdn-icons-png.flaticon.com/512/3095/3095147.png" },
  { id: "electrician", name: "Electrician", image: "https://cdn-icons-png.flaticon.com/512/1904/1904065.png" },
  { id: "cleaning", name: "Cleaning", image: "https://cdn-icons-png.flaticon.com/512/995/995053.png" },
  { id: "ac_repair", name: "AcRepair", image: "https://raw.githubusercontent.com/homefaciliti-pixel/backend/main/backend/assets/categories/ac_repair.png" },
  { id: "salon_and_spa", name: "Salon And Spa", image: "https://cdn-icons-png.flaticon.com/512/2842/2842912.png" },
  { id: "painter", name: "Painter", image: "https://cdn-icons-png.flaticon.com/512/3125/3125749.png" },
  { id: "carpenter", name: "Carpenter", image: "https://cdn-icons-png.flaticon.com/512/2313/2313580.png" },
  { id: "bike_services", name: "Bike Services", image: "https://raw.githubusercontent.com/homefaciliti-pixel/backend/main/backend/assets/categories/bike_services.png" },
  { id: "architecture", name: "Architecture", image: "https://raw.githubusercontent.com/homefaciliti-pixel/backend/main/backend/assets/categories/architecture.jpg" },
  { id: "car_washing", name: "Car Washing", image: "https://raw.githubusercontent.com/homefaciliti-pixel/backend/main/backend/assets/categories/car_washing.png" },
  { id: "contractor", name: "Contractor", image: "https://cdn-icons-png.flaticon.com/512/4232/4232145.png" },
  { id: "mechanic", name: "Mechanic", image: "https://raw.githubusercontent.com/homefaciliti-pixel/backend/main/backend/assets/categories/mechanic.jpg" },
  { id: "pandit_ji", name: "Pandit ji", image: "https://cdn-icons-png.flaticon.com/512/3306/3306612.png" },
  { id: "driver", name: "Driver", image: "https://cdn-icons-png.flaticon.com/512/3066/3066115.png" },
  { id: "photographer", name: "Photographer", image: "https://cdn-icons-png.flaticon.com/512/3159/3159844.png" },
  { id: "doctors", name: "Doctors", image: "https://cdn-icons-png.flaticon.com/512/3304/3304567.png" },
  { id: "compounder", name: "Compounder", image: "https://cdn-icons-png.flaticon.com/512/2869/2869719.png" },
  { id: "halbai", name: "Halbai", image: "https://cdn-icons-png.flaticon.com/512/2922/2922572.png" }
];

function initJsonDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, orders: [], referralsApplied: {}, categories: DEFAULT_CATEGORIES }, null, 2));
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.categories) {
        parsed.categories = DEFAULT_CATEGORIES;
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
    } catch (e) {}
  }
}

const JsonDbLayer = {
  readData() {
    try {
      initJsonDb();
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading JSON database:", err.message);
      return { users: {}, orders: [], referralsApplied: {} };
    }
  },

  writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error writing to JSON database:", err.message);
    }
  },

  // --- USER METHODS ---
  async getUserByPhone(phone) {
    const data = this.readData();
    return data.users[phone] || null;
  },

  async getUserByReferralCode(code) {
    const data = this.readData();
    return Object.values(data.users).find(u => u.referralCode === code) || null;
  },

  async createUser(user) {
    const data = this.readData();
    data.users[user.phone] = {
      name: user.name || "Hira",
      phone: user.phone,
      email: user.email || "hira@hmail.com",
      location: user.location || "",
      locality: user.locality || "",
      gender: user.gender || "Male",
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0.0,
      countryCode: user.countryCode || "+91"
    };
    this.writeData(data);
    return data.users[user.phone];
  },

  async updateUser(phone, updates) {
    const data = this.readData();
    if (!data.users[phone]) return null;
    data.users[phone] = { ...data.users[phone], ...updates };
    this.writeData(data);
    return data.users[phone];
  },

  async countUsers() {
    const data = this.readData();
    return Object.keys(data.users).length;
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    const data = this.readData();
    return data.orders.find(o => o.id === id) || null;
  },

  async getOrdersByUserPhone(phone) {
    const data = this.readData();
    return data.orders.filter(o => o.userPhone === phone).sort((a, b) => b.id - a.id);
  },

  async createOrder(order) {
    const data = this.readData();
    data.orders.push(order);
    this.writeData(data);
    return order;
  },

  async updateOrder(id, updates) {
    const data = this.readData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    data.orders[index] = { ...data.orders[index], ...updates };
    this.writeData(data);
    return data.orders[index];
  },

  async getLastOrderId() {
    const data = this.readData();
    if (data.orders.length === 0) return 0;
    return Math.max(...data.orders.map(o => o.id));
  },

  async countOrders() {
    const data = this.readData();
    return data.orders.length;
  },

  // --- REFERRAL METHODS ---
  async getReferralApplied(phone) {
    const data = this.readData();
    return data.referralsApplied[phone] || null;
  },

  async createReferralApplied(referralApplied) {
    const data = this.readData();
    data.referralsApplied[referralApplied.userPhone] = referralApplied;
    this.writeData(data);
    return referralApplied;
  },

  // --- CATEGORY METHODS ---
  async getCategories() {
    const data = this.readData();
    const categories = data.categories || [];
    return categories.map(c => {
      if (typeof c === 'string') {
        return {
          id: c.toLowerCase().replace(/\s+/g, '_'),
          name: c,
          image: ""
        };
      }
      return {
        id: c.id || c.name.toLowerCase().replace(/\s+/g, '_'),
        name: c.name,
        image: c.image || ""
      };
    });
  },

  async addCategory(categoryData) {
    const data = this.readData();
    if (!data.categories) data.categories = [];
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    
    const existing = data.categories.find(c => {
      if (typeof c === 'string') {
        return c.toLowerCase() === name.toLowerCase();
      }
      return c.name.toLowerCase() === name.toLowerCase() || c.id === finalId;
    });

    if (existing) {
      return typeof existing === 'string'
        ? { id: existing.toLowerCase().replace(/\s+/g, '_'), name: existing, image: "" }
        : existing;
    }

    const newCat = { id: finalId, name, image: image || "" };
    data.categories.push(newCat);
    this.writeData(data);
    return newCat;
  }
};

// ----------------------------------------
// HYBRID DATABASE ROUTER
// ----------------------------------------
let dbMode = "mongo";

const DbLayer = {
  getLayer() {
    if (MONGODB_URI.includes('<db_password>')) {
      dbMode = "json";
      return JsonDbLayer;
    }
    if (mongoose.connection.readyState === 1) {
      dbMode = "mongo";
      return MongoDbLayer;
    }
    dbMode = "json";
    return JsonDbLayer;
  },
  async getUserByPhone(phone) { return this.getLayer().getUserByPhone(phone); },
  async getUserByReferralCode(code) { return this.getLayer().getUserByReferralCode(code); },
  async createUser(user) { return this.getLayer().createUser(user); },
  async updateUser(phone, updates) { return this.getLayer().updateUser(phone, updates); },
  async countUsers() { return this.getLayer().countUsers(); },
  async getOrderById(id) { return this.getLayer().getOrderById(id); },
  async getOrdersByUserPhone(phone) { return this.getLayer().getOrdersByUserPhone(phone); },
  async createOrder(order) { return this.getLayer().createOrder(order); },
  async updateOrder(id, updates) { return this.getLayer().updateOrder(id, updates); },
  async getLastOrderId() { return this.getLayer().getLastOrderId(); },
  async countOrders() { return this.getLayer().countOrders(); },
  async getReferralApplied(phone) { return this.getLayer().getReferralApplied(phone); },
  async createReferralApplied(referralApplied) { return this.getLayer().createReferralApplied(referralApplied); },
  async getCategories() { return this.getLayer().getCategories(); },
  async addCategory(categoryData) { return this.getLayer().addCategory(categoryData); }
};

// ----------------------------------------
// DATABASE CONFIGURATION AND INITIALIZATION
// ----------------------------------------

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/home-services';

if (MONGODB_URI.includes('<db_password>')) {
  console.log("MONGODB_URI contains placeholder '<db_password>'. Bypassing MongoDB and running in JSON file database mode.");
  dbMode = "json";
  initJsonDb();
} else {
  console.log(`Attempting connection to MongoDB at: ${MONGODB_URI}...`);
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(async () => {
      console.log('Successfully connected to MongoDB. Running in MongoDB mode.');
      dbMode = "mongo";
      
      // Seed default categories if MongoDB collection is empty
      try {
        const count = await MongoCategory.countDocuments();
        if (count === 0) {
          await MongoCategory.insertMany(DEFAULT_CATEGORIES);
          console.log("Seeded default categories in MongoDB.");
        }
      } catch (err) {
        console.error("Error seeding default categories in MongoDB:", err.message);
      }
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB on startup. Falling back to local JSON database mode.');
      console.error(err.message);
      dbMode = "json";
      initJsonDb();
    });
}

// Global Static Data for Services
const CATEGORIES_DATA = [
  "Plumber", "Electrician", "Cleaning", "AcRepair",
  "Salon And Spa", "Painter", "Carpenter", "Bike Services",
  "Architecture", "Car Washing", "Contractor", "Mechanic",
  "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halbai"
];

const SERVICES_DATA = {
  "Plumber": [
    { title: "Tap Repair", price: 299, description: "Fix leaking taps and water issues", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop" },
    { title: "Pipe Fix", price: 499, description: "Repair damaged pipes", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop" },
    { title: "Leakage Repair", price: 399, description: "Solve leakage problems", image: "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=400&auto=format&fit=crop" }
  ],
  "Electrician": [
    { title: "Fan Repair", price: 199, description: "Fix fan issues", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop" },
    { title: "Switch Repair", price: 149, description: "Repair switches and boards", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop" },
    { title: "Wiring Work", price: 799, description: "Complete wiring setup", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop" }
  ],
  "Cleaning": [
    { title: "Home Cleaning", price: 999, description: "Full house cleaning service", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop" },
    { title: "Bathroom Cleaning", price: 499, description: "Deep bathroom cleaning", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=400&auto=format&fit=crop" }
  ],
  "AcRepair": [
    { title: "Ac Service", price: 500, description: "Full filter and coil cleaning", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop" }
  ],
  "Salon And Spa": [
    { title: "Hair Cut", price: 299, description: "Modern hair styling and trimming", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop" }
  ],
  "Painter": [
    { title: "Wall Paint", price: 1999, description: "Single room wall painting with premium finishes", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop" }
  ],
  "Carpenter": [
    { title: "Furniture Repair", price: 499, description: "Door alignment and wood repair work", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop" }
  ],
  "Bike Services": [
    { title: "Bike", price: 700, description: "General washing, engine oil change & inspection", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop" }
  ],
  "Architecture": [
    { title: "Design Draft", price: 4999, description: "Floor plans and basic architectural layout mapping", image: "https://images.unsplash.com/photo-1503387762-592dedbd82d2?q=80&w=400&auto=format&fit=crop" },
    { title: "Consultation", price: 999, description: "Professional architecture advice session", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop" }
  ],
  "Car Washing": [
    { title: "Car Wash Deep", price: 599, description: "Interior vacuuming and exterior premium pressure wash", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop" },
    { title: "Exterior Shine", price: 299, description: "Quick foam wash and tire polish", image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop" }
  ],
  "Contractor": [
    { title: "Renovation Consultation", price: 1499, description: "Detailed cost analysis and project discussion", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop" }
  ],
  "Mechanic": [
    { title: "Engine Tuning", price: 1299, description: "Spark plugs clean, filter wash, and tuning", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=400&auto=format&fit=crop" },
    { title: "General Inspection", price: 399, description: "Brakes, fluids, suspension safety check", image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=400&auto=format&fit=crop" }
  ],
  "Pandit ji": [
    { title: "Pooja Service", price: 1100, description: "Pooja with traditional rituals and mantras", image: "https://images.unsplash.com/photo-1609137144813-2d2427702f23?q=80&w=400&auto=format&fit=crop" }
  ],
  "Driver": [
    { title: "One-way Trip", price: 499, description: "Hourly driver service for safe in-city transit", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop" }
  ],
  "Photographer": [
    { title: "Event Shoot", price: 2999, description: "2 hours high-res photography package for local events", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop" }
  ],
  "Doctors": [
    { title: "General Consultation", price: 500, description: "GP health consultation and prescription writing", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop" }
  ],
  "Compounder": [
    { title: "Dressing & Injection", price: 150, description: "Basic nursing assistance, wound cleaning, dressings", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop" }
  ],
  "Halbai": [
    { title: "Catering Service", price: 3500, description: "Private chef/catering help for medium family dinners", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400&auto=format&fit=crop" }
  ]
};

// Middleware: Authenticate User via header
async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    // Backward compatibility: check if it's a 10-digit raw phone number
    if (/^\d{10}$/.test(token)) {
      return await DbLayer.getUserByPhone(token);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return await DbLayer.getUserByPhone(decoded.phone);
  } catch (err) {
    console.error("JWT Authentication failed:", err.message);
    return null;
  }
}

// Helper to generate referral code
function generateReferralCode(name) {
  const cleanName = (name || "USER").substring(0, 3).toUpperCase();
  const timestampPart = Date.now().toString().slice(-6);
  return `${cleanName}${timestampPart}`;
}

// ----------------------------------------
// API ENDPOINTS
// ----------------------------------------

// Root welcome & status endpoint
app.get('/', async (req, res) => {
  try {
    const userCount = await DbLayer.countUsers();
    const orderCount = await DbLayer.countOrders();
    
    const activeLayer = DbLayer.getLayer();
    const dbStatus = activeLayer === JsonDbLayer 
      ? "JSON File Database (database.json)" 
      : `MongoDB (${mongoose.connection.host || 'localhost'})`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home Services API Backend</title>
        <style>
          body {
            font-family: 'Outfit', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #2c3e50;
          }
          .card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            border-top: 5px solid #2ecc71;
            box-sizing: border-box;
          }
          h1 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 28px;
            font-weight: 700;
          }
          p {
            color: #7f8c8d;
            font-size: 16px;
            line-height: 1.6;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin: 30px 0;
          }
          .stat-box {
            flex: 1;
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            transition: transform 0.2s ease;
          }
          .stat-box:hover {
            transform: translateY(-2px);
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #2ecc71;
          }
          .stat-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
          }
          .badge {
            background-color: #d1fae5;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 20px;
          }
          .badge::before {
            content: "";
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: #e11d48;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Server Online</div>
          <h1>Home Services API Backend</h1>
          <p>The backend server for your Home Services Flutter application is running successfully and connected to <strong>${dbStatus}</strong>.</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${userCount}</div>
              <div class="stat-label">Registered Users</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${orderCount}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
          </div>

          <p>Please refer to the <code>api_endpoints.txt</code> document in your project folder for a complete list of endpoints and request body schemas.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Error loading server status");
  }
});

// 1. Auth: Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone, countryCode } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }
  const prefix = countryCode || "+91";
  console.log(`Sending Mock OTP 1234 to phone: ${prefix}${phone}`);
  res.json({ success: true, message: `OTP sent successfully to ${prefix}${phone} (Mock: 1234)` });
});

// 2. Auth: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, otp, countryCode } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  // Allow '1234' as the universal mock OTP
  if (otp !== "1234") {
    return res.status(400).json({ error: "Invalid OTP. Use mock code 1234" });
  }

  try {
    let user = await DbLayer.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const refCode = generateReferralCode("Hira");
      user = {
        name: "Hira",
        phone: phone,
        email: "hira@hmail.com",
        location: "",
        locality: "",
        gender: "Male",
        referralCode: refCode,
        walletBalance: 0.0,
        countryCode: countryCode || "+91"
      };
      await DbLayer.createUser(user);
      console.log(`Created new profile for user: ${countryCode || "+91"}${phone} with referral: ${refCode}`);
    }

    const token = jwt.sign({ phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: "OTP verified successfully",
      user: user,
      isNewUser: isNewUser,
      token: token
    });
  } catch (err) {
    console.error("Verify OTP failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Auth: Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log(`User ${user.phone} logged out successfully`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Auth: Fetch Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized or User not found" });
    }
    res.json({ success: true, user: user });
  } catch (err) {
    console.error("Fetch profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Auth: Update Profile
app.put('/api/auth/profile', async (req, res) => {
  const { name, email, location, locality, gender, countryCode } = req.body;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (locality !== undefined) updates.locality = locality;
    if (gender !== undefined) updates.gender = gender;
    if (countryCode !== undefined) updates.countryCode = countryCode;

    const updatedUser = await DbLayer.updateUser(user.phone, updates);
    res.json({ success: true, user: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Categories: List
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DbLayer.getCategories();
    res.json({ success: true, categories: categories });
  } catch (err) {
    console.error("Fetch categories failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Categories: Create/Add Category (Allows Infinite Categories)
app.post('/api/categories', async (req, res) => {
  const { name, id, image } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const category = await DbLayer.addCategory({ name, id, image });
    console.log(`Added new category: ${category.name}`);
    res.json({ success: true, category: category, message: "Category created successfully" });
  } catch (err) {
    console.error("Add category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Banners: Static Data
const BANNERS_DATA = [
  {
    id: "banner1",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=800&auto=format&fit=crop",
    title: "50% Off AC Services",
    category: "AcRepair"
  },
  {
    id: "banner2",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop",
    title: "Home Deep Cleaning",
    category: "Cleaning"
  },
  {
    id: "banner3",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=800&auto=format&fit=crop",
    title: "Expert Plumbing Support",
    category: "Plumber"
  }
];

// Dropdown: Get Banners
app.get('/api/banners', (req, res) => {
  res.json({
    success: true,
    banners: BANNERS_DATA,
    message: "Banners retrieved successfully"
  });
});


// Categories: Get Services by Category name
app.get('/api/categories/:category/services', (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  // Case-insensitive match against known categories in SERVICES_DATA
  const matchedCategory = Object.keys(SERVICES_DATA).find(
    key => key.toLowerCase() === category.toLowerCase()
  );

  if (!matchedCategory) {
    return res.status(404).json({
      success: false,
      error: `Category '${category}' not found`,
      availableCategories: CATEGORIES_DATA
    });
  }

  let services = SERVICES_DATA[matchedCategory] || [];

  if (search) {
    const query = search.toString().toLowerCase();
    services = services.filter(
      s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
  }

  res.json({
    success: true,
    category: matchedCategory,
    total: services.length,
    services: services
  });
});


// 6. Services: Fetch with category / search filter
app.get('/api/services', (req, res) => {
  const { category, search } = req.query;
  let list = [];

  if (category) {
    list = SERVICES_DATA[category] || [];
  } else {
    // Return all flat list
    list = Object.values(SERVICES_DATA).flat();
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  res.json({ success: true, services: list });
});

// 8. Services: Trending (Returns first 5 items)
app.get('/api/services/trending', (req, res) => {
  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = allServices.slice(0, 5);
  res.json({ success: true, services: trending });
});

// 9. Search: Global search across services AND categories
app.get('/api/search', (req, res) => {
  const { q, query } = req.query;
  const searchTerm = (q || query || '').toString().trim();

  if (!searchTerm) {
    return res.status(400).json({
      success: false,
      error: "Search query is required. Use ?q=<term> or ?query=<term>"
    });
  }

  const lowerTerm = searchTerm.toLowerCase();

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
      categories: matchedCategories,
      services: matchedServices,
      totalCategories: matchedCategories.length,
      totalServices: matchedServices.length
    }
  });
});

// 10. Wallet: Get Balance
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ success: true, balance: user.walletBalance || 0, message: "Wallet balance retrieved successfully" });
  } catch (err) {
    console.error("Fetch wallet balance failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 11. Wallet: Add Money
app.post('/api/wallet/add', async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newBalance = (user.walletBalance || 0) + Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });

    res.json({ success: true, balance: newBalance, message: "Money added to wallet successfully" });
  } catch (err) {
    console.error("Add wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12. Wallet: Deduct Money
app.post('/api/wallet/deduct', async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const newBalance = (user.walletBalance || 0) - Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });

    res.json({ success: true, balance: newBalance, message: "Money deducted from wallet successfully" });
  } catch (err) {
    console.error("Deduct wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 11. Referral: Look up user by referral code
app.get('/api/referrals/lookup/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const user = await DbLayer.getUserByReferralCode(code);
    if (!user) {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    res.json({
      success: true,
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email,
        locality: user.locality
      },
      message: "Referral user found successfully"
    });
  } catch (err) {
    console.error("Referral lookup failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12. Referral: Apply Code
app.post('/api/referrals/apply', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Referral code is required" });
  }

  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Prevent self-referral
    if (currentUser.referralCode === code) {
      return res.status(400).json({ error: "Cannot apply your own referral code" });
    }

    // Find referrer
    const referrer = await DbLayer.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    // Check if current user has already applied a code
    const alreadyApplied = await DbLayer.getReferralApplied(currentUser.phone);
    if (alreadyApplied) {
      return res.status(400).json({ error: "Referral code already applied" });
    }

    // Reward both users
    const newCurrentBalance = (currentUser.walletBalance || 0) + 50.0;
    const newReferrerBalance = (referrer.walletBalance || 0) + 50.0;

    const referralRecord = {
      userPhone: currentUser.phone,
      referrerPhone: referrer.phone,
      appliedAt: new Date().toISOString()
    };

    await Promise.all([
      DbLayer.updateUser(currentUser.phone, { walletBalance: newCurrentBalance }),
      DbLayer.updateUser(referrer.phone, { walletBalance: newReferrerBalance }),
      DbLayer.createReferralApplied(referralRecord)
    ]);

    res.json({
      success: true,
      message: `Referral code successfully applied! Rewarded both users with ₹50.`,
      newBalance: newCurrentBalance
    });
  } catch (err) {
    console.error("Apply referral code failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 14. Orders: Get All
app.get('/api/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
    res.json({ success: true, orders: userOrders, message: "Orders retrieved successfully" });
  } catch (err) {
    console.error("Fetch orders failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 15. Orders: Place Order
app.post('/api/orders', async (req, res) => {
  const { serviceName, price, date } = req.body;
  if (!serviceName || !price) {
    return res.status(400).json({ error: "Service Name and Price are required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Auto-increment simple numerical ID
    const lastOrderId = await DbLayer.getLastOrderId();
    const orderId = lastOrderId + 1;

    const newOrder = {
      id: orderId,
      userPhone: user.phone,
      serviceName: serviceName,
      price: Number(price),
      date: date || new Date().toISOString(),
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      createdAt: Date.now()
    };

    await DbLayer.createOrder(newOrder);

    console.log(`Placed new order #${orderId} - ${serviceName} for phone ${user.phone}`);
    res.json({ success: true, order: newOrder, message: "Order placed successfully" });
  } catch (err) {
    console.error("Place order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 16. Orders: Cancel Order
app.put('/api/orders/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await DbLayer.updateOrder(orderId, {
      status: "Cancelled",
      bookingStatus: "idle"
    });

    res.json({ success: true, order: updatedOrder, message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 17. Active Booking: Get Status
app.get('/api/orders/:id/booking-flow', async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Simulate automatic partner assignment if state is 'searching' after 4 seconds of order creation
    const timeElapsed = Date.now() - order.createdAt;
    if (order.bookingStatus === "searching" && timeElapsed > 4000) {
      order = await DbLayer.updateOrder(orderId, {
        bookingStatus: "assigned",
        partnerName: "Ravi Kumar",
        partnerDistance: "3.2 km away"
      });
      console.log(`[Booking Simulation] Assigned partner Ravi Kumar to Order #${orderId}`);
    }

    res.json({
      success: true,
      status: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance,
      message: "Booking flow status retrieved successfully"
    });
  } catch (err) {
    console.error("Get booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 18. Active Booking: Update Status
app.put('/api/orders/:id/booking-flow', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, partnerName, partnerDistance } = req.body;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updates = {};
    if (status) {
      updates.bookingStatus = status;
      if (status === "completed") {
        updates.status = "Completed";
      }
    }
    if (partnerName) updates.partnerName = partnerName;
    if (partnerDistance) updates.partnerDistance = partnerDistance;

    const updatedOrder = await DbLayer.updateOrder(orderId, updates);
    console.log(`Updated Order #${orderId} Booking Status to: ${status}`);

    res.json({
      success: true,
      status: updatedOrder.bookingStatus,
      partnerName: updatedOrder.partnerName,
      partnerDistance: updatedOrder.partnerDistance,
      message: "Booking flow status updated successfully"
    });
  } catch (err) {
    console.error("Update booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Vasant Kunj"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Asansol"]
};

// Dropdown: Get States
app.get('/api/states', (req, res) => {
  const states = Object.keys(STATES_CITIES);
  res.json({
    success: true,
    states: states,
    message: "States retrieved successfully"
  });
});

// Dropdown: Get Cities
app.get('/api/cities', (req, res) => {
  const { state } = req.query;
  if (state) {
    const cities = STATES_CITIES[state];
    if (!cities) {
      return res.status(404).json({
        success: false,
        error: "State not found",
        message: "State not found"
      });
    }
    return res.json({
      success: true,
      cities: cities,
      message: `Cities for state ${state} retrieved successfully`
    });
  }
  
  const allCities = Object.values(STATES_CITIES).flat();
  res.json({
    success: true,
    cities: allCities,
    message: "All cities retrieved successfully"
  });
});

app.listen(PORT, () => {
  console.log(`Backend server successfully listening at http://localhost:${PORT}`);
});
