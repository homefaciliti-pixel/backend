const fs = require('fs');
let code = fs.readFileSync('controllers/booking.controller.js', 'utf8');

const resolveAddrFunc = `
// Helper to resolve address for a user phone number
const resolveAddressForPhone = async (phone) => {
  if (phone && phone !== "9876543210") {
    try {
      const addresses = await DbLayer.getAddressesByUserPhone(phone);
      if (addresses && addresses.length > 0) {
        return addresses[addresses.length - 1];
      }
    } catch (err) {
      console.error("Resolve address for phone failed:", err);
    }
  }

  // Fallback to user profile location/locality fields if they exist
  try {
    const user = await DbLayer.getUserByPhone(phone);
    if (user && (user.location || user.locality)) {
      console.log(\`[AddressResolution] Falling back to user profile location fields for user \${phone}\`);
      return {
        type: "Home",
        houseNo: "",
        society: "",
        floor: "",
        landmark: "",
        city: user.location || "Mumbai, Maharashtra",
        locality: user.locality || "Andheri West",
        pincode: "",
        latitude: 26.9124,
        longitude: 75.7873,
        name: user.name || "",
        alternateNumber: "",
        countryCode: user.countryCode || "+91"
      };
    }
  } catch (userErr) {
    console.error("Resolve address from user profile failed:", userErr);
  }

  return null;
};
`;

code = code.replace('const handlePostBooking = async (req, res) => {', resolveAddrFunc + '\nconst handlePostBooking = async (req, res) => {');
fs.writeFileSync('controllers/booking.controller.js', code, 'utf8');
console.log('Added resolveAddressForPhone to booking.controller.js');
