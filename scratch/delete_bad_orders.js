const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'C:/Users/user/Desktop/userapp-main/backend/.env' });

async function run() {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT || 3306,
    });

    try {
        const [orderRows] = await pool.query("SELECT id, phone, serviceName, productId, bookingStatus, status FROM node_orders WHERE serviceName LIKE '%608%' OR productId LIKE '%608%' OR serviceName LIKE '%602%' OR productId LIKE '%602%'");
        console.log("Orders:", orderRows);
        
        // Also let's delete them to fix the user's issue!
        if (orderRows.length > 0) {
            console.log("Deleting stuck orders...");
            await pool.query("DELETE FROM node_orders WHERE serviceName LIKE '%608%' OR productId LIKE '%608%' OR serviceName LIKE '%602%' OR productId LIKE '%602%'");
            console.log("Deleted!");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
