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
  productId: { type: String, default: null },
  description: { type: String, default: null },
  timeSlot: { type: String, default: null },
  address: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Number, default: () => Date.now() }
});
const MongoOrder = mongoose.model('Order', mongooseOrderSchema);

const mongooseReferralAppliedSchema = new mongoose.Schema({
  userPhone: { type: String, required: true, unique: true },
  referrerPhone: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
});
const MongoReferralApplied = mongoose.model('ReferralApplied', mongooseReferralAppliedSchema);

const mongooseAddressSchema = new mongoose.Schema({
  userPhone: { type: String, required: true },
  type: { type: String, default: "Home" },
  houseNo: { type: String, default: "" },
  society: { type: String, default: "" },
  floor: { type: String, default: "" },
  landmark: { type: String, default: "" },
  city: { type: String, default: "" },
  locality: { type: String, default: "" },
  pincode: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number }
});
const MongoAddress = mongoose.model('Address', mongooseAddressSchema);

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
  },

  // --- ADDRESS METHODS ---
  async getAddressesByUserPhone(phone) {
    return await MongoAddress.find({ userPhone: phone }).lean();
  },

  async createAddress(address) {
    const newAddress = new MongoAddress(address);
    await newAddress.save();
    return newAddress.toObject();
  }
};

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (JSON File Database fallback)
// ----------------------------------------
const DB_FILE = path.join(__dirname, 'database.json');

const DEFAULT_CATEGORIES = [
  { id: "ac_repair", name: "AcRepair", image: "/assets/categories/ac_repair.png" },
  { id: "car_washing", name: "Car Washing", image: "/assets/categories/car_washing.png" },
  { id: "plumber", name: "Plumber", image: "/assets/categories/plumber.png" },
  { id: "cleaning", name: "Cleaning", image: "/assets/categories/cleaning.png" },
  { id: "electrician", name: "Electrician", image: "/assets/categories/electrician.png" },
  { id: "salon_and_spa", name: "Salon And Spa", image: "/assets/categories/salon_and_spa.png" },
  { id: "painter", name: "Painter", image: "/assets/categories/painter.png" },
  { id: "carpenter", name: "Carpenter", image: "/assets/categories/carpenter.png" },
  { id: "bike_services", name: "Bike Services", image: "/assets/categories/bike_services.png" },
  { id: "architecture", name: "Architecture", image: "/assets/categories/architecture.png" },
  { id: "contractor", name: "Contractor", image: "/assets/categories/contractor.png" },
  { id: "mechanic", name: "Mechanic", image: "/assets/categories/mechanic.png" },
  { id: "pandit_ji", name: "Pandit ji", image: "/assets/categories/pandit_ji.png" },
  { id: "driver", name: "Driver", image: "/assets/categories/driver.png" },
  { id: "photographer", name: "Photographer", image: "/assets/categories/photographer.png" },
  { id: "doctors", name: "Doctors", image: "/assets/categories/doctors.png" },
  { id: "compounder", name: "Compounder", image: "/assets/categories/compounder.png" },
  { id: "halwai", name: "Halwai", image: "/assets/categories/halwai.png" }
];

function initJsonDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, orders: [], referralsApplied: {}, categories: DEFAULT_CATEGORIES, addresses: [] }, null, 2));
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      let changed = false;
      if (!parsed.addresses) {
        parsed.addresses = [];
        changed = true;
      }
      if (!parsed.categories) {
        parsed.categories = DEFAULT_CATEGORIES;
        changed = true;
      } else {
        // Migration: Update names and images if they are outdated in JSON db
        parsed.categories = parsed.categories.map(c => {
          if (c.name === "Cleaning Services" || c.name === "clening" || c.id === "clening") {
            c.name = "Cleaning";
            c.id = "cleaning";
            c.image = "/assets/categories/cleaning.png";
            changed = true;
          }
          const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.id === c.id);
          if (defaultMatch && c.image !== defaultMatch.image) {
            c.image = defaultMatch.image;
            changed = true;
          }
          return c;
        });
      }
      if (changed) {
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
      return { users: {}, orders: [], referralsApplied: {}, addresses: [] };
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
  },

  // --- ADDRESS METHODS ---
  async getAddressesByUserPhone(phone) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    return data.addresses.filter(a => a.userPhone === phone);
  },

  async createAddress(address) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    data.addresses.push(address);
    this.writeData(data);
    return address;
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
  async addCategory(categoryData) { return this.getLayer().addCategory(categoryData); },
  async getAddressesByUserPhone(phone) { return this.getLayer().getAddressesByUserPhone(phone); },
  async createAddress(address) { return this.getLayer().createAddress(address); }
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
        // Migration: Rename 'Cleaning Services', 'Cleaning' or 'clening' to 'Cleaning' in existing MongoDB documents
        await MongoCategory.updateMany(
          { name: { $in: ["Cleaning Services", "Cleaning", "clening"] } },
          { $set: { name: "Cleaning", id: "cleaning" } }
        );
        // Migration: Update category images in existing MongoDB documents to local relative asset paths
        for (const cat of DEFAULT_CATEGORIES) {
          await MongoCategory.updateOne(
            { id: cat.id },
            { $set: { image: cat.image } }
          );
        }

        const count = await MongoCategory.countDocuments();
        if (count === 0) {
          await MongoCategory.insertMany(DEFAULT_CATEGORIES);
          console.log("Seeded default categories in MongoDB.");
        }
      } catch (err) {
        console.error("Error seeding or updating categories in MongoDB:", err.message);
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
  "AcRepair", "Car Washing", "Plumber", "Cleaning",
  "Electrician", "Salon And Spa", "Painter", "Carpenter",
  "Bike Services", "Architecture", "Contractor", "Mechanic",
  "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halwai"
];

const SERVICES_DATA = {
  "Plumber": [
    { title: "Tap Repair", price: 299, description: "Fix leaking taps and water issues", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 142, cutPrice: 399 },
    { title: "Pipe Fix", price: 499, description: "Repair damaged pipes", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.5, reviewsCount: 88, cutPrice: 599 },
    { title: "Leakage Repair", price: 399, description: "Solve leakage problems", image: "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 110, cutPrice: 499 }
  ],
  "Electrician": [
    { title: "Fan Repair", price: 199, description: "Fix fan issues", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 230, cutPrice: 249 },
    { title: "Switch Repair", price: 149, description: "Repair switches and boards", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.4, reviewsCount: 95, cutPrice: 199 },
    { title: "Wiring Work", price: 799, description: "Complete wiring setup", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 180, cutPrice: 999 }
  ],
  "Cleaning": [
    { title: "Home Cleaning", price: 999, description: "Full house cleaning service", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.9, reviewsCount: 312, cutPrice: 1299 },
    { title: "Bathroom Cleaning", price: 499, description: "Deep bathroom cleaning", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 154, cutPrice: 599 },
    { title: "Kitchen Cleaning", price: 699, description: "Degreasing cabinets, countertops, and appliances", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.8, reviewsCount: 195, cutPrice: 899 },
    { title: "Sofa & Carpet Cleaning", price: 799, description: "Vacuuming and steam sanitizing fabric surfaces", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 120, cutPrice: 999 },
    { title: "Window Cleaning", price: 299, description: "Sparkling glass and pane washing inside-out", image: "https://images.unsplash.com/photo-1528740561666-bd247e66a20c?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 74, cutPrice: 399 }
  ],
  "AcRepair": [
    { title: "Ac Service", price: 500, description: "Full filter and coil cleaning", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 420, cutPrice: 599 },
    { title: "AC Gas Charging", price: 1500, description: "Refill refrigerant gas to restore peak cooling", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 215, cutPrice: 1999 },
    { title: "AC Installation", price: 1200, description: "Mount and configure split or window AC unit", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 165, cutPrice: 1499 },
    { title: "AC Leakage Repair", price: 600, description: "Identify and plug water or gas leak issues", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 98, cutPrice: 799 },
    { title: "AC Condenser Replacement", price: 2500, description: "Install brand new copper condenser unit", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 84, cutPrice: 2999 }
  ],
  "Salon And Spa": [
    { title: "Hair Cut", price: 299, description: "Modern hair styling and trimming", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 540, cutPrice: 399 },
    { title: "Facial & Grooming", price: 499, description: "Deep cleansing facial treatment and face massage", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 280, cutPrice: 599 },
    { title: "Hair Coloring", price: 599, description: "Professional ammonia-free hair coloring", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 145, cutPrice: 799 },
    { title: "Massage Therapy", price: 899, description: "Stress-relieving full body Swedish massage", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 310, cutPrice: 1199 },
    { title: "Pedicure & Manicure", price: 399, description: "Hand and foot grooming and nail clean spa", image: "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.7, reviewsCount: 185, cutPrice: 499 }
  ],
  "Painter": [
    { title: "Wall Paint", price: 1999, description: "Single room wall painting with premium finishes", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 76, cutPrice: 2499 }
  ],
  "Carpenter": [
    { title: "Furniture Repair", price: 499, description: "Door alignment and wood repair work", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 190, cutPrice: 599 }
  ],
  "Bike Services": [
    { title: "Bike", price: 700, description: "General washing, engine oil change & inspection", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.6, reviewsCount: 145, cutPrice: 899 }
  ],
  "Architecture": [
    { title: "Design Draft", price: 4999, description: "Floor plans and basic architectural layout mapping", image: "/assets/services/design_draft.png", discount: 16, rating: 4.9, reviewsCount: 52, cutPrice: 5999 },
    { title: "Consultation", price: 999, description: "Professional architecture advice session", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.8, reviewsCount: 38, cutPrice: 1299 }
  ],
  "Car Washing": [
    { title: "Car Wash Deep", price: 599, description: "Interior vacuuming and exterior premium pressure wash", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 220, cutPrice: 799 },
    { title: "Exterior Shine", price: 299, description: "Quick foam wash and tire polish", image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 104, cutPrice: 399 }
  ],
  "Contractor": [
    { title: "Renovation Consultation", price: 1499, description: "Detailed cost analysis and project discussion", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 45, cutPrice: 1999 }
  ],
  "Mechanic": [
    { title: "Engine Tuning", price: 1299, description: "Spark plugs clean, filter wash, and tuning", image: "/assets/services/engine_tuning.png", discount: 23, rating: 4.8, reviewsCount: 112, cutPrice: 1699 },
    { title: "General Inspection", price: 399, description: "Brakes, fluids, suspension safety check", image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 135, cutPrice: 499 }
  ],
  "Pandit ji": [
    { title: "Pooja Service", price: 1100, description: "Pooja with traditional rituals and mantras", image: "/assets/services/pooja_service.png", discount: 26, rating: 4.9, reviewsCount: 88, cutPrice: 1499 }
  ],
  "Driver": [
    { title: "One-way Trip", price: 499, description: "Hourly driver service for safe in-city transit", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 160, cutPrice: 599 }
  ],
  "Photographer": [
    { title: "Event Shoot", price: 2999, description: "2 hours high-res photography package for local events", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 72, cutPrice: 3999 }
  ],
  "Doctors": [
    { title: "General Consultation", price: 500, description: "GP health consultation and prescription writing", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 290, cutPrice: 599 }
  ],
  "Compounder": [
    { title: "Dressing & Injection", price: 150, description: "Basic nursing assistance, wound cleaning, dressings", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop", discount: 24, rating: 4.5, reviewsCount: 105, cutPrice: 199 }
  ],
  "Halwai": [
    { title: "Catering Service", price: 3500, description: "Private chef/catering help for medium family dinners", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.7, reviewsCount: 64, cutPrice: 4500 }
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

app.get('/api/categories', async (req, res) => {
  try {
    const dbCategories = await DbLayer.getCategories();
    
    // Determine the base URL dynamically based on the incoming request headers
    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

    // Map / Merge with DEFAULT_CATEGORIES to override static properties (names and images)
    const categories = dbCategories.map(c => {
      const defaultMatch = DEFAULT_CATEGORIES.find(
        dc => dc.id === c.id || dc.name.toLowerCase() === c.name.toLowerCase()
      );
      let img = c.image;
      let name = c.name;
      let id = c.id;

      if (defaultMatch) {
        id = defaultMatch.id;
        name = defaultMatch.name;
        img = defaultMatch.image;
      }

      // If the image path is relative, prepend the server's base URL dynamically
      if (img && img.startsWith('/assets/')) {
        img = `${serverBaseUrl}${img}`;
      }

      return {
        ...c,
        id: id,
        name: name,
        image: img
      };
    });

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
    image: "/assets/banners/ac_services_banner.png",
    title: "Premium AC Services",
    category: "AcRepair",
    badge: "SPECIAL OFFER",
    subtitle: "Get 50% off professional filter cleaning & repairs",
    buttonText: "Book Now"
  },
  {
    id: "banner2",
    image: "/assets/banners/refer_earn_banner.png",
    title: "Refer Friends, Earn Cash",
    category: "refer",
    badge: "REFER & EARN",
    subtitle: "Invite your friends and earn instant rewards",
    buttonText: "Refer Now"
  },
  {
    id: "banner3",
    image: "/assets/banners/amc_services_banner.png",
    title: "Annual Maintenance Cover",
    category: "",
    badge: "COMING SOON",
    subtitle: "Complete peace of mind for your home, coming soon",
    buttonText: "Learn More"
  }
];

// Dropdown: Get Banners
app.get('/api/banners', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const resolvedBanners = BANNERS_DATA.map(b => {
    let img = b.image;
    if (img && img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    }
    return {
      ...b,
      image: img
    };
  });

  res.json({
    success: true,
    banners: resolvedBanners,
    message: "Banners retrieved successfully"
  });
});


// Categories: Get Services by Category name
app.get('/api/categories/:category/services', (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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

  let services = shuffleArray(SERVICES_DATA[matchedCategory] || []);

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
    services: resolveServiceUrls(services, serverBaseUrl)
  });
});


// Helper: Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper: Resolve relative service image URLs dynamically
function resolveServiceUrls(services, serverBaseUrl) {
  return services.map(s => {
    let img = s.image;
    if (img && img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    }
    return {
      ...s,
      image: img
    };
  });
}

// 6. Services: Fetch with category / search filter
app.get('/api/services', (req, res) => {
  const { category, search } = req.query;
  let list = [];

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (category) {
    list = shuffleArray(SERVICES_DATA[category] || []);
  } else {
    // Return all flat list shuffled
    list = shuffleArray(Object.values(SERVICES_DATA).flat());
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  res.json({ success: true, services: resolveServiceUrls(list, serverBaseUrl) });
});

// 8. Services: Trending (Returns 5 random shuffled items)
app.get('/api/services/trending', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = shuffleArray(allServices).slice(0, 5);
  res.json({ success: true, services: resolveServiceUrls(trending, serverBaseUrl) });
});

// 8a. Services: Get detailed specifications of a service
const handleServiceDetail = (req, res) => {
  const title = req.params.title || req.query.title;
  if (!title) {
    return res.status(400).json({ success: false, error: "Service title is required" });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  let foundService = null;
  let foundCategory = null;

  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (match) {
      foundService = match;
      foundCategory = categoryName;
      break;
    }
  }

  if (!foundService) {
    return res.status(404).json({ success: false, error: `Service '${title}' not found` });
  }

  // Resolve relative URLs if needed
  let resolvedImage = foundService.image;
  if (resolvedImage && resolvedImage.startsWith('/assets/')) {
    resolvedImage = `${serverBaseUrl}${resolvedImage}`;
  }

  // Add rich mock metadata for details
  const enrichedService = {
    title: foundService.title,
    price: foundService.price,
    description: foundService.description,
    image: resolvedImage,
    category: foundCategory,
    duration: foundService.title.toLowerCase().includes("cleaning") || foundService.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
    rating: foundService.rating !== undefined ? foundService.rating : 4.8,
    reviewsCount: foundService.reviewsCount !== undefined ? foundService.reviewsCount : 124,
    discount: foundService.discount !== undefined ? foundService.discount : 0,
    cutPrice: foundService.cutPrice !== undefined ? foundService.cutPrice : foundService.price,
    highlights: [
      "Includes background-checked & certified partner",
      "30-day post-service warranty cover included",
      "Equipped with premium professional-grade tools",
      "100% safe, hygienic, and high-quality service execution"
    ]
  };

  res.json({
    success: true,
    service: enrichedService,
    message: "Service details retrieved successfully"
  });
};

app.get('/api/services/detail/:title', handleServiceDetail);
app.get('/api/services/detail', handleServiceDetail);

// 9. Search: Global search across services AND categories
app.get('/api/search', (req, res) => {
  const { q, query } = req.query;
  const searchTerm = (q || query || '').toString().trim();

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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
      services: resolveServiceUrls(matchedServices, serverBaseUrl),
      totalCategories: matchedCategories.length,
      totalServices: matchedServices.length
    }
  });
});

// 9a. Static Policies & Content APIs
app.get('/api/policies/privacy', (req, res) => {
  res.json({
    success: true,
    title: "Privacy Policy",
    lastUpdated: "May 27, 2026",
    content: "At Home Services, we value your privacy and are committed to protecting your personal data. This privacy policy describes how we collect, use, and share your information when you use our platform.",
    sections: [
      {
        title: "1. Information We Collect",
        body: "We collect information you provide directly to us, such as your name, phone number, email address, physical address, and payment information when you register, schedule a service, or communicate with us."
      },
      {
        title: "2. How We Use Your Information",
        body: "We use your personal information to match you with certified service providers, process payments, verify bookings, send transaction alerts, and improve our home services platform experience."
      },
      {
        title: "3. Information Sharing & Security",
        body: "Your details are only shared with the assigned service technician for execution. We implement strict industry-standard technical measures to secure your data and do not sell information to third-party advertisers."
      }
    ]
  });
});

app.get('/api/about', (req, res) => {
  res.json({
    success: true,
    title: "About Us",
    description: "Home Services is a premium, on-demand platform connecting homeowners with certified and background-checked service professionals like plumbers, electricians, mechanics, painters, and salon technicians.",
    vision: "To make home maintenance, repair, and cleaning services completely hassle-free, secure, and transparent.",
    mission: "To empower local service partners with technology and training while providing consumers with reliable, affordable, and high-quality solutions at their doorstep.",
    highlights: [
      "100% Background Checked & Verified Partners",
      "Standardised Pricing & No Hidden Charges",
      "30-Day Post-Service Warranty Cover",
      "Seamless In-App Booking and Booking Tracking"
    ]
  });
});

app.get('/api/policies/about', (req, res) => {
  res.redirect('/api/about');
});

app.get('/api/policies/terms', (req, res) => {
  res.json({
    success: true,
    title: "Terms and Conditions",
    lastUpdated: "May 27, 2026",
    content: "Welcome to Home Services. By registering or using our platform, you agree to comply with and be bound by the following terms of service. Please read them carefully.",
    sections: [
      {
        title: "1. Service Booking & Cancellation",
        body: "All service bookings must be made through our official mobile app or portal. Users can cancel bookings free of charge up to 2 hours before the scheduled time slot. Late cancellations may incur a nominal convenience fee."
      },
      {
        title: "2. Payment & Billing Rules",
        body: "Standard charges are displayed upfront. Any additional materials or spare parts purchased by the technician will be billed separately with user consent. All payments must be processed digitally or through in-app wallet options."
      },
      {
        title: "3. Limitation of Liability",
        body: "While we verify all independent service professionals, Home Services acts as a coordinator. Any dispute or property damage claims are governed by our standard insurance and damage reimbursement guidelines."
      }
    ]
  });
});

app.get('/api/policies/refund', (req, res) => {
  res.json({
    success: true,
    title: "Refund Policy",
    lastUpdated: "May 27, 2026",
    content: "Our goal is your complete satisfaction. If you are unsatisfied with a service, we offer a transparent refund and rework policy governed by the following rules.",
    rules: [
      {
        title: "1. Refund Eligibility",
        body: "Refunds are processed if the service was not executed as described, the service partner failed to show up, or severe quality issues are reported within 48 hours of service completion."
      },
      {
        title: "2. Standard Resolution Timeline",
        body: "For verified issues, we initiate a free-of-cost rework by a senior supervisor within 24 hours. If rework is not feasible, a full or partial refund is credited back to your original payment source or wallet within 5-7 business days."
      },
      {
        title: "3. Warranty Cover Limitations",
        body: "Our 30-day post-service warranty covers repairs executed by our partner. Reworks or issues arising due to external damage, misuse, or repairs handled by external non-platform technicians will invalidate refund/warranty claims."
      }
    ]
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

// Booking: Save/Register Booking Details
app.post('/api/bookings', async (req, res) => {
  const { productId, date, timeSlot } = req.body;
  if (!productId || !date || !timeSlot) {
    return res.status(400).json({ error: "productId, date, and timeSlot are required" });
  }
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log(`User ${user.phone} validated booking slot ${timeSlot} on ${date} for product ${productId}`);
    res.json({
      success: true,
      message: "Booking details validated and registered",
      booking: { productId, date, timeSlot }
    });
  } catch (err) {
    console.error("Booking validation failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Addresses: Save a User Address
const handleAddAddress = async (req, res) => {
  const { type, houseNo, society, floor, landmark, city, locality, pincode, lat, latitude, lon, longitude, lng } = req.body;
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const latValue = latitude !== undefined ? Number(latitude) : (lat !== undefined ? Number(lat) : null);
    const lonValue = longitude !== undefined ? Number(longitude) : (lon !== undefined ? Number(lon) : (lng !== undefined ? Number(lng) : null));
    
    const newAddress = {
      userPhone: user.phone,
      type: type || "Home",
      houseNo: houseNo || "",
      society: society || "",
      floor: floor || "",
      landmark: landmark || "",
      city: city || "",
      locality: locality || "",
      pincode: pincode || "",
      latitude: latValue,
      longitude: lonValue
    };
    
    const savedAddress = await DbLayer.createAddress(newAddress);
    console.log(`Saved address for phone ${user.phone}: ${savedAddress.houseNo}, ${savedAddress.city}`);
    res.json({ success: true, address: savedAddress, message: "Address saved successfully" });
  } catch (err) {
    console.error("Save address failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
app.post('/api/addresses', handleAddAddress);
app.post('/api/address', handleAddAddress);

// Addresses: Get All User Addresses
app.get('/api/addresses', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const list = await DbLayer.getAddressesByUserPhone(user.phone);
    res.json({ success: true, addresses: list, message: "Addresses retrieved successfully" });
  } catch (err) {
    console.error("Get addresses failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Checkout: Place Order and Generate ID
app.post('/api/checkout', async (req, res) => {
  const { productId, timeSlot, date } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: "productId is required in checkout body" });
  }
  
  try {
    // User validation: can use authenticated user, fallback to a mock phone if not logged in
    let phone = "9876543210"; // Default fallback
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    if (authUser) {
      phone = authUser.phone;
    }
    
    // Resolve service properties from SERVICES_DATA using productId (which matches service title)
    let foundService = null;
    for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
      const match = services.find(s => s.title.toLowerCase() === productId.toLowerCase());
      if (match) {
        foundService = match;
        break;
      }
    }
    
    if (!foundService) {
      return res.status(404).json({ error: `Service/Product '${productId}' not found in catalog` });
    }
    
    // Retrieve the user's latest saved address
    let resolvedAddress = null;
    const addresses = await DbLayer.getAddressesByUserPhone(phone).catch(() => []);
    if (addresses && addresses.length > 0) {
      resolvedAddress = addresses[addresses.length - 1];
    }
    
    // Auto-increment simple numerical ID
    const lastOrderId = await DbLayer.getLastOrderId();
    const orderId = lastOrderId + 1;
    
    const newOrder = {
      id: orderId,
      userPhone: phone,
      serviceName: foundService.title,
      price: Number(foundService.price),
      date: date || new Date().toISOString().split('T')[0],
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: productId,
      description: foundService.description,
      timeSlot: timeSlot || "9:00 AM - 10:00 AM",
      address: resolvedAddress,
      payment: { paymentMethod: "Wallet", amountPaid: Number(foundService.price) },
      createdAt: Date.now()
    };
    
    await DbLayer.createOrder(newOrder);
    
    // Simulate wallet balance deduction
    const userObj = await DbLayer.getUserByPhone(phone);
    if (userObj) {
      const newBalance = Math.max(0, (userObj.walletBalance || 0) - Number(foundService.price));
      await DbLayer.updateUser(phone, { walletBalance: newBalance });
      console.log(`Deducted ₹${foundService.price} from user ${phone} wallet. New balance: ₹${newBalance}`);
    }
    
    console.log(`[Checkout] Refactored Order #${orderId} for phone ${phone}`);
    res.json({
      success: true,
      orderId: orderId,
      order: newOrder,
      message: "Checkout completed successfully and order placed"
    });
  } catch (err) {
    console.error("Checkout failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Checkout: Retrieve Checkout Summary (Get details)
const handleGetCheckout = async (req, res) => {
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
    
    res.json({
      success: true,
      orderId: order.id,
      product: {
        productId: order.productId,
        serviceName: order.serviceName,
        price: order.price,
        description: order.description,
        date: order.date,
        timeSlot: order.timeSlot
      },
      address: order.address,
      payment: order.payment || { paymentMethod: "Online", amountPaid: order.price },
      status: order.status,
      bookingStatus: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance
    });
  } catch (err) {
    console.error("Fetch checkout details failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
app.get('/api/checkout/:id', handleGetCheckout);
app.get('/api/checkout-api/:id', handleGetCheckout);

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
  const { serviceName, price, date, productId, description, timeSlot } = req.body;
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
      productId: productId || null,
      description: description || null,
      timeSlot: timeSlot || null,
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

// 18a. Booking Availability: Available Dates
app.get('/api/booking/available-dates', (req, res) => {
  const dates = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      formattedDate: d.toISOString().split('T')[0], // "2026-05-26"
      dayName: i === 0 ? "Today" : (i === 1 ? "Tomorrow" : daysOfWeek[d.getDay()]),
      displayDate: `${d.getDate()} ${months[d.getMonth()]}` // "26 May"
    });
  }

  res.json({
    success: true,
    dates: dates,
    message: "Available booking dates retrieved successfully"
  });
});

// 18b. Booking Availability: Available Time Slots
app.get('/api/booking/available-slots', (req, res) => {
  const slots = [
    { id: "slot_1", time: "9:00 AM - 10:00 AM", available: true },
    { id: "slot_2", time: "10:00 AM - 11:00 AM", available: true },
    { id: "slot_3", time: "11:00 AM - 12:00 PM", available: true },
    { id: "slot_4", time: "12:00 PM - 1:00 PM", available: true },
    { id: "slot_5", time: "1:00 PM - 2:00 PM", available: true },
    { id: "slot_6", time: "2:00 PM - 3:00 PM", available: true },
    { id: "slot_7", time: "3:00 PM - 4:00 PM", available: true },
    { id: "slot_8", time: "4:00 PM - 5:00 PM", available: true },
    { id: "slot_9", time: "5:00 PM - 6:00 PM", available: true },
    { id: "slot_10", time: "6:00 PM - 7:00 PM", available: true },
    { id: "slot_11", time: "7:00 PM - 8:00 PM", available: true }
  ];

  res.json({
    success: true,
    slots: slots,
    message: "Available booking time slots retrieved successfully"
  });
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
