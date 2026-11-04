const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { localizeAddress } = require('../helpers/contentI18n');
const { sanitizeAddressObj, validatePhoneNumberLength, getExpectedPhoneLength, getCountryNameByPrefix } = require('../utils/helpers');
const { translate } = require('../helpers/translate');

const handleAddAddress = async (req, res) => {
  const { type, houseNo, society, floor, landmark, city, locality, pincode, lat, latitude, lon, longitude, lng, name, alternateNumber, alternate_number, countryCode, country_code } = req.body;
  
  try {
    let phone;
    let userCountryCode = "+91";
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    if (authUser) {
      phone = authUser.phone;
      if (authUser.countryCode) {
        userCountryCode = authUser.countryCode;
      }
    } else {
      phone = req.body.userId || req.body.phone || req.body.userPhone || req.query.userId || req.query.phone;
    }

    if (!phone) {
      return res.status(401).json({ error: "Unauthorized: User identification (Token or userId) is required" });
    }
    
    const latValue = latitude !== undefined ? Number(latitude) : (lat !== undefined ? Number(lat) : null);
    const lonValue = longitude !== undefined ? Number(longitude) : (lon !== undefined ? Number(lon) : (lng !== undefined ? Number(lng) : null));
    
    const finalAltNum = alternateNumber || alternate_number || "";
    const finalCountryCode = countryCode || country_code || userCountryCode;

    if (finalAltNum && !validatePhoneNumberLength(finalAltNum, finalCountryCode)) {
      const expected = getExpectedPhoneLength(finalCountryCode);
      const countryName = getCountryNameByPrefix(finalCountryCode);
      return res.status(400).json({
        error: `Alternate phone number for ${countryName} must be ${expected} digits long.`
      });
    }

    const newAddress = {
      userPhone: phone,
      type: type || "Home",
      houseNo: houseNo || "",
      society: society || "",
      floor: floor || "",
      landmark: landmark || "",
      city: city || "",
      locality: locality || "",
      pincode: pincode || "",
      latitude: latValue,
      longitude: lonValue,
      name: name || "",
      alternateNumber: finalAltNum,
      countryCode: finalCountryCode
    };
    
    const savedAddress = await DbLayer.createAddress(newAddress);
    console.log(`Saved address for phone ${phone}: ${savedAddress.houseNo}, ${savedAddress.city}`);
    res.json({ success: true, address: savedAddress, status: req.body.status || "Regular", message: translate("address_saved", req.lang) });
  } catch (err) {
    console.error("Save address failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAddresses = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const list = await DbLayer.getAddressesByUserPhone(user.phone);
    const sanitizedList = (list || []).map(a => sanitizeAddressObj(a, req.lang));
    res.json({ success: true, addresses: sanitizedList, message: translate("addresses_retrieved", req.lang) });
  } catch (err) {
    console.error("Get addresses failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  handleAddAddress,
  getAddresses
};
