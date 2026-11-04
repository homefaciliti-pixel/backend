const app = require('../app');

const registeredRoutes = [];

function getRoutesFromLayer(layer, basePath = '') {
  if (layer.route) {
    const routePath = basePath + (layer.route.path instanceof Array ? layer.route.path.join(',') : layer.route.path);
    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
    methods.forEach(method => {
      registeredRoutes.push({ method, path: routePath });
    });
  } else if (layer.name === 'router' && layer.handle.stack) {
    let newBase = basePath;
    if (layer.regexp) {
      // Extract mount path if possible
      const match = layer.regexp.source
        .replace('^\\', '')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('(?=\\/|$)', '')
        .replace('^', '');
      if (match && match !== '/') {
        newBase = basePath + match.replace(/\$$/, '');
      }
    }
    layer.handle.stack.forEach(subLayer => {
      getRoutesFromLayer(subLayer, newBase);
    });
  }
}

app._router.stack.forEach(layer => {
  getRoutesFromLayer(layer);
});

console.log('Total registered routes in new app:', registeredRoutes.length);
registeredRoutes.forEach(r => {
  console.log(`${r.method} ${r.path}`);
});
