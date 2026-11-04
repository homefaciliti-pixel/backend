const http = require('http');
const app = require('../app');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  const endpoints = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/api/categories' },
    { method: 'GET', path: '/api/subcategories' },
    { method: 'GET', path: '/api/categories/ac_repair/subcategories' },
    { method: 'GET', path: '/api/categories/1' },
    { method: 'GET', path: '/api/banners' },
    { method: 'GET', path: '/api/services' },
    { method: 'GET', path: '/api/services/trending' },
    { method: 'GET', path: '/api/services/detail?title=Tap%20Repair' },
    { method: 'GET', path: '/api/search?q=ac' },
    { method: 'GET', path: '/api/policies/privacy' },
    { method: 'GET', path: '/api/about' },
    { method: 'GET', path: '/api/policies/about' },
    { method: 'GET', path: '/api/policies/terms' },
    { method: 'GET', path: '/api/policies/refund' },
    { method: 'GET', path: '/api/wallet/rules' },
    { method: 'GET', path: '/api/amc/plans' },
    { method: 'GET', path: '/api/amc/plans/Plumber' },
    { method: 'GET', path: '/api/booking/available-dates' },
    { method: 'GET', path: '/api/booking/available-slots?date=2026-11-05' },
    { method: 'GET', path: '/api/countries' },
    { method: 'GET', path: '/api/states' },
    { method: 'GET', path: '/api/cities' },
    { method: 'GET', path: '/api/localities' },
    { method: 'GET', path: '/api/app-version' },
    { method: 'GET', path: '/api/debug/sms-config' },
    { method: 'GET', path: '/api/debug/logs' },
    { method: 'GET', path: '/api/languages' }
  ];

  let successCount = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.path}`);
      console.log(`[${res.status}] ${ep.method} ${ep.path}`);
      if (res.status === 200) {
        successCount++;
      } else {
        const text = await res.text();
        console.log(`  Response: ${text.slice(0, 150)}`);
      }
    } catch (err) {
      console.error(`  ERROR testing ${ep.path}:`, err.message);
    }
  }

  console.log(`\nResults: ${successCount}/${endpoints.length} endpoints returned 200 OK!`);
  server.close(() => {
    process.exit(successCount === endpoints.length ? 0 : 1);
  });
});
