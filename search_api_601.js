const categories = [
  'Plumber',      'Electrician',
  'Salon',        'Cleaning',
  'Architect',    'Carpenter',
  'Car Washing',  'Mechanic',
  'Spa',          'AC Repair',
  'Advocate',     'Compounder',
  "Cater's",      'Driver',
  'Doctor',       'Interior Design',
  'Pest Control', 'Photographer',
  'Painter',      'Repairing',
  'Solar',        'Tax Consultancy',
  'Contractor',   'Pandit Ji',
  'Iron Works'
];
async function checkAll() {
  for (let c of categories) {
    const res = await fetch(`https://backend-1-ux3b.onrender.com/api/categories/${encodeURIComponent(c)}/services`);
    if (res.ok) {
      const data = await res.json();
      if (data.services) {
        for (let s of data.services) {
          if (String(s.id).includes('601') || String(s.title).includes('601') || String(s.price).includes('601')) {
            console.log("FOUND IN CATEGORY", c, s);
          }
        }
      }
    }
  }
  console.log("Done");
}
checkAll();
