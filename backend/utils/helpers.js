const fs = require('fs');
const path = require('path');
const { countriesList, CATEGORIES_DATA } = require('../config/constants');
const { translate } = require('../helpers/translate');

function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    if (typeof str === 'string' && str.trim().length > 0) {
      return { houseNo: str, society: "", city: "", locality: "", landmark: "", pincode: "", name: "", alternateNumber: "", countryCode: "" };
    }
    return fallback;
  }
}

function parseOrderNumbers(row) {
  if (!row) return null;
  row.price = row.price !== undefined && row.price !== null ? Math.round(Number(row.price)) : 299;
  row.address = safeJsonParse(row.address);
  row.payment = safeJsonParse(row.payment);
  row.items = safeJsonParse(row.items) || [];
  row.advancePayment = row.advancePayment !== undefined && row.advancePayment !== null ? Math.round(Number(row.advancePayment)) : 0;
  row.remainingAmount = row.remainingAmount !== undefined && row.remainingAmount !== null ? Math.round(Number(row.remainingAmount)) : (row.price ? Math.round(Number(row.price)) : 0);
  return row;
}

const readDataFromJsonDb = () => {
  try {
    const p = path.join(__dirname, 'database.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn("Failed to read database.json:", e.message);
  }
  return null;
};

function getCanonicalPhone(phone) {
  if (!phone) return "";
  const clean = String(phone).replace(/\D/g, '');
  return clean.length >= 10 ? clean.substring(clean.length - 10) : clean;
}

const isMockPaymentAllowed = () => {
  if (process.env.ALLOW_MOCK_PAYMENTS === "true") {
    return true;
  }
  if (process.env.ALLOW_MOCK_PAYMENTS === "false") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
  if (keyId.startsWith("rzp_live_")) {
    return false;
  }
  return true;
};

function getCanonicalCategoryName(categoryName) {
  if (!categoryName) return "Plumber";
  const cleanName = categoryName.toLowerCase().replace(/[\s\-_]/g, '');
  for (const cat of CATEGORIES_DATA) {
    const cleanCat = cat.toLowerCase().replace(/[\s\-_]/g, '');
    if (cleanName === cleanCat || cleanName.includes(cleanCat) || cleanCat.includes(cleanName)) {
      return cat;
    }
  }
  return categoryName;
}

function generateReferralCode(name) {
  const cleanName = (name || "USER").substring(0, 3).toUpperCase();
  const timestampPart = Date.now().toString().slice(-6);
  return `${cleanName}${timestampPart}`;
}

function validatePhoneNumberLength(phone, prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  if (!country) return true;

  let cleanNumber = phone.trim().replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }
  const dialDigits = prefix.replace(/\D/g, '');
  if (dialDigits && cleanNumber.startsWith(dialDigits) && cleanNumber.length > dialDigits.length) {
    const tempNum = cleanNumber.substring(dialDigits.length);
    if (tempNum.length === country.phoneLength) {
      cleanNumber = tempNum;
    }
  }
  return cleanNumber.length === country.phoneLength;
}

function getExpectedPhoneLength(prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  return country ? country.phoneLength : 10;
}

function getCountryNameByPrefix(prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  return country ? country.name : "this country";
}

// 1. Auth: Send OTP

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


const normalizeString = (str) => {
  if (!str) return '';
  return String(str).toLowerCase()
    .replace(/\blekage\b/g, 'leakage')
    .replace(/\blekege\b/g, 'leakage')
    .replace(/[-_\s]/g, '')
    .trim();
};

const normalizeDate = (dStr) => {
  if (!dStr) return dStr;
  
  // Extract just the date part (first word or before T or space)
  const clean = String(dStr).trim().split(/[T\s]/)[0];
  
  const match1 = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (match1) {
    const day = match1[1].padStart(2, '0');
    const month = match1[2].padStart(2, '0');
    let year = match1[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const match2 = clean.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (match2) {
    const year = match2[1];
    const month = match2[2].padStart(2, '0');
    const day = match2[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return clean;
};

const normalizeTimeSlot = (slotStr) => {
  if (!slotStr) return slotStr;
  
  // Format clean up
  let cleanSlot = String(slotStr).toLowerCase().replace(/\s/g, '').replace(/to/gi, '-');
  cleanSlot = cleanSlot.replace(/:+(?!\d)/g, ''); // Fixes "10:am" -> "10am"

  // Direct match
  for (const s of STATIC_BOOKING_SLOTS) {
    const staticClean = s.time.toLowerCase().replace(/\s/g, '').replace(/to/gi, '-');
    if (cleanSlot === staticClean) {
      return s.time;
    }
  }

  // Hours extraction and match (handles e.g. "9:00am to 10:am", "9am to 10am")
  const extractHoursAndAmPm = (str) => {
    const regex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    const match = str.match(regex);
    if (match) {
      const h1 = parseInt(match[1]);
      const m1 = match[2] ? parseInt(match[2]) : 0;
      const ap1 = match[3].toLowerCase();
      const h2 = parseInt(match[4]);
      const m2 = match[5] ? parseInt(match[5]) : 0;
      const ap2 = match[6].toLowerCase();
      return { h1, m1, ap1, h2, m2, ap2 };
    }
    return null;
  };

  const parsedInput = extractHoursAndAmPm(cleanSlot);
  if (parsedInput) {
    for (const s of STATIC_BOOKING_SLOTS) {
      const parsedStatic = extractHoursAndAmPm(s.time.toLowerCase().replace(/\s/g, ''));
      if (parsedStatic &&
          parsedInput.h1 === parsedStatic.h1 &&
          parsedInput.m1 === parsedStatic.m1 &&
          parsedInput.ap1 === parsedStatic.ap1 &&
          parsedInput.h2 === parsedStatic.h2 &&
          parsedInput.m2 === parsedStatic.m2 &&
          parsedInput.ap2 === parsedStatic.ap2) {
        return s.time;
      }
    }
  }

};

const getPhoneVariants = (phone) => {
  if (!phone) return [];
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return [phone];
  const last10 = clean.substring(clean.length - 10);
  return [
    last10,
    `91${last10}`,
    `+91${last10}`
  ];
};


const sanitizeAddressObj = (addr, lang = 'en') => {
  if (!addr) {
    return {
      name: "",
      alternateNumber: "",
      countryCode: "+91",
      type: lang === 'hi' ? "घर" : "Home",
      houseNo: "",
      society: "",
      floor: "",
      landmark: "",
      city: "",
      locality: "",
      pincode: ""
    };
  }
  const localized = localizeAddress(addr, lang);
  return {
    name: String(localized.name || localized.userPhone || ""),
    alternateNumber: String(localized.alternateNumber || localized.alternate_number || localized.altPhoneNumber || ""),
    countryCode: String(localized.countryCode || localized.country_code || "+91"),
    type: String(localized.type || "Home"),
    houseNo: String(localized.houseNo || localized.house_no || ""),
    society: String(localized.society || ""),
    floor: String(localized.floor || ""),
    landmark: String(localized.landmark || ""),
    city: String(localized.city || ""),
    locality: String(localized.locality || ""),
    pincode: String(localized.pincode || "")
  };
};

const sanitizeUserObj = (user) => {
  if (!user) {
    return {
      name: "",
      phone: "",
      email: "",
      walletBalance: 0
    };
  }
  return {
    name: String(user.name || ""),
    phone: String(user.phone || ""),
    email: String(user.email || ""),
    walletBalance: parseFloat(user.walletBalance || 0)
  };
};

const sanitizeProductObj = (prod, defaultTitle = "professional Plumber") => {
  if (!prod) {
    return {
      productId: defaultTitle,
      serviceName: defaultTitle,
      title: defaultTitle,
      name: defaultTitle,
      productName: defaultTitle,
      product_name: defaultTitle,
      price: 499,
      description: "Professional Plumber Home Service",
      productDescription: "Professional Plumber Home Service",
      product_description: "Professional Plumber Home Service",
      image: "",
      date: "",
      timeSlot: ""
    };
  }
  let titleVal = String(prod.serviceName || prod.title || prod.productName || prod.product_name || prod.productId || defaultTitle).trim();
  if (titleVal === "0" || titleVal === "null" || titleVal === "undefined" || !titleVal) {
    titleVal = String(prod.productId || prod.title || prod.serviceName || defaultTitle).trim();
    if (titleVal === "0" || titleVal === "null" || titleVal === "undefined" || !titleVal) {
      titleVal = defaultTitle;
    }
  }
  const descVal = String(prod.description || prod.productDescription || prod.product_description || "");
  return {
    productId: titleVal,
    serviceName: titleVal,
    title: titleVal,
    name: titleVal,
    productName: titleVal,
    product_name: titleVal,
    price: Number(prod.price !== undefined && prod.price !== null ? prod.price : 499),
    description: descVal,
    productDescription: descVal,
    product_description: descVal,
    image: String(prod.image || ""),
    date: String(prod.date || ""),
    timeSlot: String(prod.timeSlot || "")
  };
};

// Helper to resolve service details by productId or title

function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.toUpperCase().replace(/\s/g, '').split('-');
  if (parts.length !== 2) return null;
  
  const parseTime = (t) => {
    const match = t.match(/^(\d+)(?::(\d+))?(AM|PM)$/);
    if (!match) return null;
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3];
    
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    return hour + (minute / 60);
  };
  
  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (start === null || end === null) return null;
  return { start, end };
}

function timesOverlap(range1, range2) {
  if (!range1 || !range2) return false;
  return range1.start < range2.end && range2.start < range1.end;
}


module.exports = {
  safeJsonParse,
  parseOrderNumbers,
  readDataFromJsonDb,
  getCanonicalPhone,
  isMockPaymentAllowed,
  getCanonicalCategoryName,
  generateReferralCode,
  validatePhoneNumberLength,
  shuffleArray,
  normalizeString,
  normalizeDate,
  normalizeTimeSlot,
  getPhoneVariants,
  sanitizeAddressObj,
  sanitizeUserObj,
  sanitizeProductObj,
  parseTimeRange,
  timesOverlap
};
