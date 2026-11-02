const https = require('https');
const { ADMIN_FETCH_TTL } = require('../config/constants');
const { getHdFallbackServiceImageUrl } = require('../utils/imageHelpers');

let cachedAdminCategories = null;
let lastAdminCatFetchTime = 0;
let cachedAdminSubcategories = null;
let lastAdminSubcatFetchTime = 0;
let cachedAdminServices = null;
let lastAdminSvcFetchTime = 0;

async function fetchAdminBackendCategories() {
  const now = Date.now();
  if (cachedAdminCategories && (now - lastAdminCatFetchTime < ADMIN_FETCH_TTL)) {
    return cachedAdminCategories;
  }
  try {
    const https = require('https');
    const data = await new Promise((resolve) => {
      const req = https.get('https://adminbackend-1-h03r.onrender.com/api/categories', { timeout: 6000 }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.data)) return resolve(parsed.data);
            if (parsed && Array.isArray(parsed.services)) return resolve(parsed.services);
            if (parsed && Array.isArray(parsed.categories)) return resolve(parsed.categories);
            if (Array.isArray(parsed)) return resolve(parsed);
          } catch(e){}
          resolve([]);
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.on('error', () => resolve([]));
    });
    if (data.length > 0) {
      cachedAdminCategories = data;
      lastAdminCatFetchTime = now;
    }
    return cachedAdminCategories || data;
  } catch(e) {
    return cachedAdminCategories || [];
  }
}

async function fetchAdminBackendSubcategories() {
  const now = Date.now();
  if (cachedAdminSubcategories && (now - lastAdminSubcatFetchTime < ADMIN_FETCH_TTL)) {
    return cachedAdminSubcategories;
  }
  try {
    const https = require('https');
    const data = await new Promise((resolve) => {
      const req = https.get('https://adminbackend-1-h03r.onrender.com/api/subcategories', { timeout: 6000 }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.data)) return resolve(parsed.data);
            if (parsed && Array.isArray(parsed.subcategories)) return resolve(parsed.subcategories);
            if (Array.isArray(parsed)) return resolve(parsed);
          } catch(e){}
          resolve([]);
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.on('error', () => resolve([]));
    });
    if (data.length > 0) {
      cachedAdminSubcategories = data;
      lastAdminSubcatFetchTime = now;
    }
    return cachedAdminSubcategories || data;
  } catch(e) {
    return cachedAdminSubcategories || [];
  }
}

async function fetchAdminBackendServices() {
  const now = Date.now();
  if (cachedAdminServices && (now - lastAdminSvcFetchTime < ADMIN_FETCH_TTL)) {
    return cachedAdminServices;
  }
  try {
    const https = require('https');
    const data = await new Promise((resolve) => {
      const req = https.get('https://adminbackend-1-h03r.onrender.com/api/services', { timeout: 5000 }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.data)) return resolve(parsed.data);
            if (parsed && Array.isArray(parsed.services)) return resolve(parsed.services);
            if (parsed && Array.isArray(parsed.categories)) return resolve(parsed.categories);
            if (Array.isArray(parsed)) return resolve(parsed);
          } catch(e){}
          resolve([]);
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.on('error', () => resolve([]));
    });
    if (data.length > 0) {
      cachedAdminServices = data;
      lastAdminSvcFetchTime = now;
    }
    return cachedAdminServices || data;
  } catch(e) {
    return cachedAdminServices || [];
  }
}

module.exports = {
  fetchAdminBackendCategories,
  fetchAdminBackendSubcategories,
  fetchAdminBackendServices
};
