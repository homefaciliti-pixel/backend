const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config/constants');
const { DbLayer, MySqlDbLayer, JsonDbLayer } = require('../services/dbLayer');
const { getLastSmsDebug, debugLogs, sendSMS } = require('../services/sms.service');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { translate } = require('../helpers/translate');

const getDebugDb = (req, res) => {
  const seedFile = path.join(__dirname, 'database_seed.json');
  const seedExists = fs.existsSync(seedFile);
  let seedContent = null;
  if (seedExists) {
    try {
      seedContent = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    } catch (e) {
      seedContent = { error: e.message };
    }
  }
  
  let dbContent = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      dbContent = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      dbContent = { error: e.message };
    }
  }

  res.json({
    seedExists,
    seedFile,
    DB_FILE,
    hasSeedBanners: seedContent ? (seedContent.banners ? seedContent.banners.length : 'no banners key') : 'no seed content',
    dbBannersCount: dbContent ? (dbContent.banners ? dbContent.banners.length : 'no banners key') : 'no db content',
  });
};
const getRootHealth = async (req, res) => {
  try {
    // Only query DB for stats if actually connected, otherwise show 0
    let userCount = 0;
    let orderCount = 0;
    try {
      userCount = await DbLayer.countUsers();
      orderCount = await DbLayer.countOrders();
    } catch (statErr) {
      console.warn("[RootRoute] Could not fetch stats (DB unavailable):", statErr.message);
    }
    
    const activeLayer = DbLayer.getLayer();
    const dbStatus = activeLayer === MySqlDbLayer 
      ? "MySQL Database (homefaciliti.com)" 
      : (activeLayer === JsonDbLayer ? "JSON File Database (database.json)" : "Unknown Database");

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home Services API Backend</title>
        <style>
          body {
            font-family: 'Outfit', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #2c3e50;
          }
          .card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            border-top: 5px solid #2ecc71;
            box-sizing: border-box;
          }
          h1 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 28px;
            font-weight: 700;
          }
          p {
            color: #7f8c8d;
            font-size: 16px;
            line-height: 1.6;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin: 30px 0;
          }
          .stat-box {
            flex: 1;
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            transition: transform 0.2s ease;
          }
          .stat-box:hover {
            transform: translateY(-2px);
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #2ecc71;
          }
          .stat-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
          }
          .badge {
            background-color: #d1fae5;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 20px;
          }
          .badge::before {
            content: "";
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: #e11d48;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Server Online</div>
          <h1>Home Services API Backend</h1>
          <p>The backend server for your Home Services Flutter application is running successfully and connected to <strong>${dbStatus}</strong>.</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${userCount}</div>
              <div class="stat-label">Registered Users</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${orderCount}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
          </div>

          <p>Please refer to the <code>api_endpoints.txt</code> document in your project folder for a complete list of endpoints and request body schemas.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error on root route:", err);
    res.status(500).send("Error loading server status: " + err.message);
  }
};

const getSmsConfig = (req, res) => {
  res.json({
    config: {
      smsApiKey: (process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg').substring(0, 4) + '***',
      senderId: process.env.SMS_SENDER_ID || 'HMFCLI',
      entityId: process.env.SMS_ENTITY_ID || '1201173444411453897',
      dltTemplateId: process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632',
      smsRoute: process.env.SMS_ROUTE || '2',
      rawTemplate: process.env.SMS_TEMPLATE_TEXT || 'Your OTP for registering on Superhome is: {#var#}. This code is valid for the next 10 minutes. Thank You, Super Home'
    },
    lastSmsDebug: getLastSmsDebug()
  });
};

const getDebugLogs = (req, res) => {
  res.json({ success: true, logs: debugLogs });
};

const contact = async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, and message are required" });
  }
  try {
    const contact = await DbLayer.createContact({ name, email, phone, message });
    console.log(`[Contact] Inquiry created from ${name} (${email})`);
    res.json({ success: true, message: translate("contact_sent", req.lang), contact });
  } catch (err) {
    console.error("Contact API failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const upload = (req, res) => {
  const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;
  const fileUrl = `${serverBaseUrl}/uploads/${file.filename}`;

  console.log(`[Upload] Image uploaded successfully: ${file.filename} (field: ${file.fieldname})`);
  res.json({
    success: true,
    file: {
      filename: file.filename,
      url: fileUrl,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }
  });
};

const getAppVersion = async (req, res) => {
  try {
    const versionInfo = await DbLayer.getAppVersion();
    res.json({
      success: true,
      android: versionInfo.android || { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: versionInfo.ios || { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
    });
  } catch (err) {
    console.error("Failed to retrieve app version config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateAppVersion = async (req, res) => {
  const { android, ios } = req.body;

  try {
    if (android) {
      const updates = {};
      if (android.latestVersion !== undefined) updates.latestVersion = String(android.latestVersion);
      if (android.minSupportedVersion !== undefined) updates.minSupportedVersion = String(android.minSupportedVersion);
      if (android.forceUpdate !== undefined) updates.forceUpdate = !!android.forceUpdate;
      
      if (Object.keys(updates).length > 0) {
        await DbLayer.updateAppVersion('android', updates);
      }
    }

    if (ios) {
      const updates = {};
      if (ios.latestVersion !== undefined) updates.latestVersion = String(ios.latestVersion);
      if (ios.minSupportedVersion !== undefined) updates.minSupportedVersion = String(ios.minSupportedVersion);
      if (ios.forceUpdate !== undefined) updates.forceUpdate = !!ios.forceUpdate;
      
      if (Object.keys(updates).length > 0) {
        await DbLayer.updateAppVersion('ios', updates);
      }
    }

    const updatedConfig = await DbLayer.getAppVersion();
    res.json({
      success: true,
      android: updatedConfig.android || { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: updatedConfig.ios || { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true },
      message: "App version configuration updated successfully"
    });
  } catch (err) {
    console.error("Failed to update app version config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const sendCustomSms = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { phone, message, templateId } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await sendSMS(phone, message, templateId);
    if (result.success) {
      res.json({ success: true, message: "Custom SMS sent successfully", response: result.response });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("Send custom SMS failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getDebugDb,
  getRootHealth,
  getSmsConfig,
  getDebugLogs,
  contact,
  upload,
  getAppVersion,
  updateAppVersion,
  sendCustomSms
};
