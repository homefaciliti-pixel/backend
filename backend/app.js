require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Multilingual System Middleware & Routes (Pre-existing)
const languageMiddleware = require('./middleware/language');
const languageRouter = require('./routes/language');
app.use(languageMiddleware);
app.use('/api', languageRouter);

// Static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Uploads proxy middleware
const { uploadsProxyMiddleware, generalUpload } = require('./middleware/upload.middleware');
app.use('/uploads', uploadsProxyMiddleware);

// Root health check
const miscController = require('./controllers/misc.controller');
app.get('/', miscController.getRootHealth);
app.post('/upload', generalUpload.any(), miscController.upload);

// API Routes mounting
app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/misc.routes'));
app.use('/api', require('./routes/category.routes'));
app.use('/api', require('./routes/service.routes'));
app.use('/api', require('./routes/policy.routes'));
app.use('/api', require('./routes/payment.routes'));
app.use('/api', require('./routes/wallet.routes'));
app.use('/api', require('./routes/amc.routes'));
app.use('/api', require('./routes/card.routes'));
app.use('/api', require('./routes/referral.routes'));
app.use('/api', require('./routes/booking.routes'));
app.use('/api', require('./routes/address.routes'));
app.use('/api', require('./routes/checkout.routes'));
app.use('/api', require('./routes/cart.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api', require('./routes/geo.routes'));

module.exports = app;
