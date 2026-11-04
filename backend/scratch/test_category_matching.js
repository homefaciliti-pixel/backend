const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('../services/adminBackend.service');

(async () => {
  const [adminSrvs, adminCats] = await Promise.all([
    fetchAdminBackendServices(),
    fetchAdminBackendCategories()
  ]);

  const catMap = {};
  adminCats.forEach(c => {
    catMap[String(c.id)] = c.name || c.title;
  });

  function getServicesForCategory(categoryParam) {
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s\-_'&]/g, '');
    const cleanParam = norm(categoryParam);

    const STATIC_CAT_ID_MAP = {
      '1': 'Plumber', '3': 'Electrician', '5': 'Salon', '7': 'Cleaning',
      '9': 'Architect', '11': 'Carpenter', '27': 'Car Washing', '29': 'Mechanic',
      '37': 'Spa', '38': 'AC Repair', '40': 'Compounder', '41': "Cater's",
      '42': 'Driver', '43': 'Doctor', '46': 'Pest Control', '48': 'Photographer',
      '49': 'Painter', '50': 'Repairing', '57': 'Contractor', '58': 'Pandit Ji'
    };

    const mappedName = STATIC_CAT_ID_MAP[categoryParam] || categoryParam;
    const cleanMapped = norm(mappedName);

    const matchedAdminCat = adminCats.find(c => {
      const cId = String(c.id);
      const cName = norm(c.name || c.title);
      return cId === categoryParam || cName === cleanParam || cName === cleanMapped;
    });

    const targetCatId = matchedAdminCat ? String(matchedAdminCat.id) : categoryParam;
    const targetCatName = matchedAdminCat ? (matchedAdminCat.name || matchedAdminCat.title) : (STATIC_CAT_ID_MAP[categoryParam] || categoryParam);

    const matchedServices = adminSrvs.filter(s => {
      const sCatId = String(s.category_id || s.categoryId || s.category || '');
      const sCatName = norm(s.categoryName || catMap[sCatId] || '');
      return sCatId === targetCatId || sCatId === categoryParam || sCatName === cleanParam || sCatName === cleanMapped;
    });

    return { targetCatId, targetCatName, count: matchedServices.length };
  }

  console.log('Result for 61 (admin plumber id):', getServicesForCategory('61'));
  console.log('Result for 1 (legacy plumber id):', getServicesForCategory('1'));
  console.log('Result for Plumber:', getServicesForCategory('Plumber'));
  console.log('Result for Cleaning (7):', getServicesForCategory('7'));
  console.log('Result for Salon (5):', getServicesForCategory('5'));
  console.log('Result for AC Repair (38):', getServicesForCategory('38'));
  console.log('Result for Iron Works (60):', getServicesForCategory('60'));
  console.log('Result for Repairing (50):', getServicesForCategory('50'));
})();
