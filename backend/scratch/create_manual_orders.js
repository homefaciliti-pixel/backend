const mysql = require('mysql2/promise');
require('dotenv').config({path: '../.env'});
const crypto = require('crypto');

async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  
  // 1. Find services
  const [rows] = await c.query("SELECT id, title, price FROM node_services WHERE LOWER(title) LIKE '%ro repair%' OR LOWER(title) LIKE '%washing machine%'");
  console.log('Found services:', rows);
  
  const roService = rows.find(r => r.title.toLowerCase().includes('ro repair'));
  const washingMachineService = rows.find(r => r.title.toLowerCase().includes('washing machine'));
  
  if (!roService || !washingMachineService) {
    console.log("Could not find both services! Cannot proceed.");
    process.exit(1);
  }

  // 2. Prepare Order Data
  const orderDate = new Date().toISOString().split('T')[0]; // Today's date
  const timeSlot = '4:00 to 5:00 am';
  const userPhone = '9414343434';
  const userName = 'laxman jii';
  const address = 'Flat No.703,Herbinger Heights,Funberg Road,Dholai,Jaipur';
  const createdAt = Date.now();

  const orders = [
    {
      id: Math.floor(100000 + Math.random() * 900000),
      serviceName: roService.title,
      price: roService.price || 0,
      productId: roService.id
    },
    {
      id: Math.floor(100000 + Math.random() * 900000),
      serviceName: washingMachineService.title,
      price: washingMachineService.price || 0,
      productId: washingMachineService.id
    }
  ];

  // 3. Insert into node_orders_v2
  for (const o of orders) {
    await c.query(`
      INSERT INTO node_orders_v2 (
        id, userPhone, serviceName, price, date, status, bookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        address, payment, razorpayOrderId, razorpayPaymentId, createdAt, amcId,
        advancePayment, remainingAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      o.id, userPhone, o.serviceName, o.price, orderDate, 'pending', 'pending',
      '', '0 km', o.productId, `Name: ${userName}`, timeSlot,
      address, 'Cash', '', '', createdAt, null,
      '0', o.price
    ]);
    console.log(`Inserted Order ${o.id} for ${o.serviceName} - Price: ${o.price}`);
  }
  
  process.exit(0);
}
run();
