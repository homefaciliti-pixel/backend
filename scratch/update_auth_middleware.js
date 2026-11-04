const fs = require('fs');
let code = fs.readFileSync('middleware/auth.middleware.js', 'utf8');

const oldRegex = /try\s*\{\s*let phone;[\s\S]*?if \(!phone\) return null;/;

const newBlock = `try {
    let phone;

    // 1. If it's a standard JWT token (contains dots), verify and decode it first
    if (token.includes('.')) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        phone = decoded.phone || decoded.userId || decoded.id;
        if (phone) {
          const digits = String(phone).replace(/\\D/g, '');
          phone = digits.length === 12 && digits.startsWith('91') ? digits.substring(2) : digits;
        }
      } catch (jwtErr) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && (decoded.phone || decoded.userId || decoded.id)) {
            phone = decoded.phone || decoded.userId || decoded.id;
            const digits = String(phone).replace(/\\D/g, '');
            phone = digits.length === 12 && digits.startsWith('91') ? digits.substring(2) : digits;
          }
        } catch (decErr) {}
      }
    }

    // 2. If not a JWT or decoding failed, check if token itself is a direct phone number
    if (!phone) {
      const cleanDigits = token.replace(/\\D/g, '');
      if (cleanDigits.length === 10) {
        phone = cleanDigits;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        phone = cleanDigits.substring(2);
      } else if (cleanDigits.length > 10) {
        phone = cleanDigits.slice(-10);
      }
    }

    if (!phone) return null;`;

code = code.replace(oldRegex, newBlock);
fs.writeFileSync('middleware/auth.middleware.js', code, 'utf8');
console.log('Successfully updated auth.middleware.js!');
