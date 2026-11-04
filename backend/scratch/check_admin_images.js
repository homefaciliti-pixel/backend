const { fetchAdminBackendServices } = require('../services/adminBackend.service');

(async () => {
  const srvs = await fetchAdminBackendServices();
  const imageTypes = {};
  const blobImages = [];
  srvs.forEach(s => {
    const img = String(s.image || s.photo || '');
    if (img.includes('blob:')) blobImages.push({ title: s.title, img });
    if (!img) imageTypes['empty'] = (imageTypes['empty'] || 0) + 1;
    else if (img.startsWith('http')) imageTypes['http'] = (imageTypes['http'] || 0) + 1;
    else imageTypes['relative'] = (imageTypes['relative'] || 0) + 1;
  });
  console.log('Image types:', imageTypes);
  console.log('Blob images count:', blobImages.length);
  if (blobImages.length > 0) {
    console.log('Sample blob image:', blobImages.slice(0, 3));
  }
})();
