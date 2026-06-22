const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const banners = [
  { html: 'banner_ac.html',    out: '../assets/banners/ac_services_banner.png' },
  { html: 'banner_refer.html', out: '../assets/banners/refer_earn_banner.png' },
  { html: 'banner_amc.html',   out: '../assets/banners/amc_services_banner.png' },
];

(async () => {
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--font-render-hinting=none']
  });

  for (const banner of banners) {
    const htmlPath = path.resolve(__dirname, banner.html);
    const outPath  = path.resolve(__dirname, banner.out);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 540, deviceScaleFactor: 1 });

    // Load the HTML file
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

    // Wait a moment for any CSS animations to settle
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 540 }
    });

    await page.close();
    console.log(`✓ ${path.basename(outPath)} saved  (1080 x 540 px)`);
  }

  await browser.close();
  console.log('\nAll banners rendered successfully!');
})();
