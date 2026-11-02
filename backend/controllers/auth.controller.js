const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { DbLayer, activeOTPs } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getCanonicalPhone, validatePhoneNumberLength, generateReferralCode } = require('../utils/helpers');
const { sendSMS } = require('../services/sms.service');
const { translate } = require('../helpers/translate');

const sendOtp = async (req, res) => {
  const phone = req.body.phone || req.body.userId;
  const { countryCode } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number / userId is required" });
  }
  const prefix = countryCode || "+91";
  
  if (!validatePhoneNumberLength(phone, prefix)) {
    const expected = getExpectedPhoneLength(prefix);
    const countryName = getCountryNameByPrefix(prefix);
    return res.status(400).json({
      error: `Phone number for ${countryName} must be ${expected} digits long.`
    });
  }
  
  // Generate OTP (static 1234 only for test number 9199953391)
  const TEST_PHONE = '9199953391';
  const isTestNumber = phone === TEST_PHONE || phone === '91' + TEST_PHONE || phone === '+91' + TEST_PHONE;
  const otp = isTestNumber ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP in-memory with 5 minutes expiry
  activeOTPs.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  
  const dltTemplateId = process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632';
  const rawTemplate = process.env.SMS_TEMPLATE_TEXT || 'Your OTP for registering on Superhome is: {#var#}. This code is valid for the next 10 minutes. Thank You, Super Home';
  
  let messageText = rawTemplate.replace('{otp}', otp).replace('{#var#}', otp);
  if (dltTemplateId === '1207173589889308632') {
    messageText = `Your OTP for registering on Superhome is: ${otp}. This code is valid for the next 10 minutes. Thank You, Super Home`;
  }

  const result = await sendSMS(phone, messageText, dltTemplateId);
  let smsSent = result.success;
  let smsError = result.error;

  if (result.success) {
    let data;
    try { data = JSON.parse(result.response); } catch(_) { data = { rawText: result.response }; }
    if (data && (data.ErrorCode === '000' || data.ErrorCode === '0' || data.ErrorMessage === 'Success')) {
      smsSent = true;
    } else {
      smsSent = false;
      smsError = data.ErrorMessage || JSON.stringify(data);
      lastSmsDebug.error = smsError;
    }
  }

  if (smsSent) {
    console.log(`[SMS] Dynamic OTP ${otp} sent successfully via SMSGatewayHub to phone: ${prefix}${phone}`);
    res.json({ 
      success: true, 
      message: translate("otp_sent", req.lang),
      otp: otp 
    });
  } else {
    console.warn(`[SMS] Failed to send SMS: ${smsError}. Phone: "${phone}", text: "${messageText}", dlttemplateid: "${dltTemplateId}"`);
    res.json({ 
      success: true, 
      message: translate("otp_sent", req.lang),
      otp: otp 
    });
  }
};
const verifyOtp = async (req, res) => {
  const phone = req.body.phone || req.body.userId;
  const { otp, countryCode, name, email } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone / userId and OTP are required" });
  }

  const storedData = activeOTPs.get(phone);
  const isValidDynamic = storedData && storedData.otp === otp && storedData.expiresAt > Date.now();

  // Check the dynamic OTP
  if (!isValidDynamic) {
    return res.status(400).json({ error: translate("invalid_otp", req.lang) });
  }

  try {
    let user = await DbLayer.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const finalName = name || "";
      const finalEmail = email || "";
      const refCode = generateReferralCode(finalName);
      const reqLanguage = req.body.language || req.body.lang || "en";
      user = {
        name: finalName,
        phone: phone,
        email: finalEmail,
        location: "",
        locality: "",
        gender: "Male",
        referralCode: refCode,
        walletBalance: 0.0,
        countryCode: countryCode || "+91",
        language: reqLanguage
      };
      await DbLayer.createUser(user);
      console.log(`Created new profile for user: ${countryCode || "+91"}${phone} with referral: ${refCode}`);
    } else {
      // Dynamic profile update if user already exists but custom name/email/language is passed in the OTP verify body
      const reqLanguage = req.body.language || req.body.lang;
      if (name || email || reqLanguage) {
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (reqLanguage) updates.language = reqLanguage;
        user = await DbLayer.updateUser(phone, updates);
        console.log(`Dynamically updated existing user ${phone} profile on verify-otp:`, updates);
      }
    }

    const token = jwt.sign({ phone: user.phone }, JWT_SECRET);
    const referralApplied = await DbLayer.getReferralApplied(user.phone);
    const referralAppliedStatus = referralApplied ? 1 : 0;

    res.json({
      success: true,
      message: translate("login_success", req.lang),
      user: { ...user, userId: user.phone },
      userId: user.phone,
      isNewUser: isNewUser,
      referralAppliedStatus: referralAppliedStatus,
      token: token
    });
  } catch (err) {
    console.error("Verify OTP failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const logout = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log(`User ${user.phone} logged out successfully`);
    res.json({ success: true, message: translate("logout_success", req.lang) });
  } catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getProfile = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized or User not found" });
    }
    res.json({ success: true, user: user });
  } catch (err) {
    console.error("Fetch profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateProfile = async (req, res) => {
  const { name, email, location, locality, gender, countryCode, language } = req.body;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (locality !== undefined) updates.locality = locality;
    if (gender !== undefined) updates.gender = gender;
    if (countryCode !== undefined) updates.countryCode = countryCode;
    if (language !== undefined) updates.language = language;

    const updatedUser = await DbLayer.updateUser(user.phone, updates);

    if (location !== undefined || locality !== undefined) {
      try {
        await DbLayer.createAddress({
          userPhone: user.phone,
          type: "Home",
          houseNo: "",
          society: "",
          floor: "",
          landmark: "",
          city: location || user.location || "",
          locality: locality || user.locality || "",
          pincode: "",
          latitude: 26.9124,
          longitude: 75.7873,
          name: updatedUser.name || user.name || "",
          alternateNumber: "",
          countryCode: updatedUser.countryCode || user.countryCode || "+91"
        });
        console.log(`[ProfileUpdate] Synced updated location/locality to node_addresses for user ${user.phone}`);
      } catch (addrErr) {
        console.warn("Could not auto-create address entry from profile update:", addrErr.message);
      }
    }

    res.json({ success: true, user: updatedUser, message: translate("profile_updated", req.lang) });
  } catch (err) {
    console.error("Update profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getLanguages = (req, res) => {
  const languagesList = [
    { "code": "en", "name": "English", "nativeName": "English" },
    { "code": "hi", "name": "Hindi", "nativeName": "हिन्दी" },
    { "code": "gu", "name": "Gujarati", "nativeName": "ગુજરાતી" },
    { "code": "mr", "name": "Marathi", "nativeName": "मराठी" },
    { "code": "ta", "name": "Tamil", "nativeName": "தமிழ்" },
    { "code": "te", "name": "Telugu", "nativeName": "తెలుగు" },
    { "code": "kn", "name": "Kannada", "nativeName": "కన్నడ" },
    { "code": "ml", "name": "Malayalam", "nativeName": "മലയാളം" },
    { "code": "bn", "name": "Bengali", "nativeName": "বাংলা" },
    { "code": "pa", "name": "Punjabi", "nativeName": "ਪੰਜਾਬੀ" },
    { "code": "or", "name": "Odia", "nativeName": "ଓଡ଼ିଆ" },
    { "code": "as", "name": "Assamese", "nativeName": "অসমীয়া" }
  ];
  res.json({
    success: true,
    languages: languagesList,
    message: "Languages list retrieved successfully"
  });
};
const updateLanguage = async (req, res) => {
  const { language } = req.body;
  if (!language) {
    return res.status(400).json({ error: "language is required in request body" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedUser = await DbLayer.updateUser(user.phone, { language: String(language).trim() });
    res.json({
      success: true,
      user: updatedUser,
      message: translate("language_updated", req.lang)
    });
  } catch (err) {
    console.error("Update language failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteAccount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await DbLayer.deleteUser(user.phone);
    console.log(`[Auth] User account ${user.phone} deleted successfully.`);
    res.json({ success: true, message: translate("account_deleted", req.lang) });
  } catch (err) {
    console.error("Delete account failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  logout,
  getProfile,
  updateProfile,
  getLanguages,
  updateLanguage,
  deleteAccount
};
