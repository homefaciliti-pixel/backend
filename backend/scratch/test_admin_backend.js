const https = require('https');

function testFetch(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 10000 }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, data: parsed });
        } catch(e) {
          resolve({ status: res.statusCode, raw: raw.slice(0, 300) });
        }
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  console.log("=== Testing Admin Backend Services ===");
  const srvs = await testFetch('https://adminbackend-1-h03r.onrender.com/api/services');
  console.log("Services status:", srvs.status);
  if (srvs.data) {
    console.log("Services keys:", Object.keys(srvs.data));
    const list = Array.isArray(srvs.data) ? srvs.data : (srvs.data.data || srvs.data.services || []);
    console.log("Total services found:", list.length);
    if (list.length > 0) {
      console.log("Sample service 0:", JSON.stringify(list[0], null, 2));
    }
  } else {
    console.log("Services raw/error:", srvs);
  }

  console.log("\n=== Testing Admin Backend Categories ===");
  const cats = await testFetch('https://adminbackend-1-h03r.onrender.com/api/categories');
  console.log("Categories status:", cats.status);
  if (cats.data) {
    console.log("Categories keys:", Object.keys(cats.data));
    const list = Array.isArray(cats.data) ? cats.data : (cats.data.data || cats.data.categories || []);
    console.log("Total categories found:", list.length);
    if (list.length > 0) {
      console.log("Sample category 0:", JSON.stringify(list[0], null, 2));
    }
  } else {
    console.log("Categories raw/error:", cats);
  }
}

run();
