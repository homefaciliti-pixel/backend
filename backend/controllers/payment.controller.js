const crypto = require('crypto');
const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { isMockPaymentAllowed } = require('../utils/helpers');
const { translate } = require('../helpers/translate');

const handleVerifyPayment = async (req, res) => {
  const paramOrderId = req.params.orderId || req.query.orderId || req.body.orderId;
  const paymentId = req.query.paymentId || req.query.razorpay_payment_id || req.body.paymentId || req.body.razorpay_payment_id;
  const rzpOrderId = req.query.razorpay_order_id || req.body.razorpay_order_id || req.query.order_id || req.body.order_id;
  
  try {
    const isAmcPay = (paramOrderId && String(paramOrderId).toUpperCase().startsWith("AMC")) || 
                     (rzpOrderId && String(rzpOrderId).toUpperCase().startsWith("AMC"));
    
    if (isAmcPay) {
      let amcSub = null;
      if (paramOrderId && String(paramOrderId).toUpperCase().startsWith("AMC")) {
        amcSub = await DbLayer.getAmcSubscriptionById(paramOrderId);
      }
      if (!amcSub && rzpOrderId) {
        const [rows] = await getMysqlPool().query("SELECT * FROM node_amc_subscriptions WHERE razorpayOrderId = ?", [rzpOrderId]);
        if (rows.length > 0) {
          amcSub = rows[0];
        }
      }

      if (!amcSub) {
        return res.status(404).json({ error: "AMC subscription not found for payment verification" });
      }

      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
      const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      
      let status = "pending";
      let paymentDetails = null;
      let verifiedViaRazorpay = false;
      let razorpayAuthError = false;

      if (paymentId) {
        try {
          const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': authHeader }
          });
          const data = await rzpRes.json();
          if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
            razorpayAuthError = true;
          } else if (data && data.status) {
            status = data.status;
            paymentDetails = data;
            verifiedViaRazorpay = true;
          }
        } catch (err) {
          console.error(`[Razorpay AMC] Error fetching payment ID ${paymentId}:`, err.message);
        }
      } else if (amcSub.razorpayOrderId) {
        try {
          const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${amcSub.razorpayOrderId}/payments`, {
            headers: { 'Authorization': authHeader }
          });
          const data = await rzpRes.json();
          if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
            razorpayAuthError = true;
          } else if (data && data.items && Array.isArray(data.items)) {
            const capturedPayment = data.items.find(p => p.status === 'captured');
            if (capturedPayment) {
              status = "captured";
              paymentDetails = capturedPayment;
            } else if (data.items.length > 0) {
              status = data.items[0].status;
              paymentDetails = data.items[0];
            }
            verifiedViaRazorpay = true;
          }
        } catch (err) {
          console.error(`[Razorpay AMC] Error fetching payments for Razorpay Order ${amcSub.razorpayOrderId}:`, err.message);
        }
      }

      if (razorpayAuthError || !verifiedViaRazorpay) {
        if (!isMockPaymentAllowed()) {
          status = "failed";
        } else {
          paymentDetails = {
            razorpay_payment_id: paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            razorpay_order_id: amcSub.razorpayOrderId || `order_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            status: "captured",
            amount: Number(amcSub.price) * 100,
            currency: "INR"
          };
          status = "captured";
        }
      }

      if (status === "captured") {
        const pId = paymentDetails ? (paymentDetails.id || paymentDetails.razorpay_payment_id) : null;
        await DbLayer.updateAmcSubscription(amcSub.amcId, {
          status: "active",
          razorpayPaymentId: pId
        });
        console.log(`[Payment Verify] AMC subscription ${amcSub.amcId} verified and set to active via payment ${pId}`);
      }

      return res.json({
        success: status === "captured",
        orderId: amcSub.amcId,
        paymentStatus: status,
        paymentDetails: paymentDetails,
        message: status === "captured"
          ? `AMC Subscription payment verified successfully. Status: ${status}`
          : `Payment verification failed. Status: ${status}`
      });
    }

    let order = null;
    let isDraft = false;
    let orderId = isNaN(paramOrderId) ? null : parseInt(paramOrderId);
    
    if (orderId) {
      order = await DbLayer.getOrderById(orderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === orderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
    } else if (paramOrderId) {
      // If paramOrderId is not numeric, treat it as the Razorpay Order ID
      order = await DbLayer.getOrderByRazorpayOrderId(paramOrderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === paramOrderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
    }
    
    // Try to find the order by razorpayOrderId from query/body if not found by path parameter
    if (!order && rzpOrderId) {
      order = await DbLayer.getOrderByRazorpayOrderId(rzpOrderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === rzpOrderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
    }

    if (order) {
      orderId = order.id;
    }

    const resolvedOrderId = order ? order.id : (orderId || 0);

    // If Cash / COD order, verify immediately as successful COD
    if (order && order.payment && (order.payment.paymentMethod && (order.payment.paymentMethod.toLowerCase() === "cash" || order.payment.paymentMethod.toLowerCase() === "cod"))) {
      return res.json({
        success: true,
        orderId: resolvedOrderId,
        paymentStatus: "cod",
        order: order,
        message: "Cash on Delivery order verified successfully"
      });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
    const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    
    let status = "pending";
    let paymentDetails = null;
    let verifiedViaRazorpay = false;
    let razorpayAuthError = false;

    // 1. Verify via specific Razorpay Payment ID if passed
    if (paymentId) {
      try {
        const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': authHeader }
        });
        const data = await rzpRes.json();
        if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
          razorpayAuthError = true;
          console.warn(`[Razorpay] Auth failure verifying payment ID: ${paymentId}`);
        } else if (data && data.status) {
          status = data.status; // captured, authorized, failed, etc.
          paymentDetails = data;
          verifiedViaRazorpay = true;
        }
      } catch (err) {
        console.error(`[Razorpay] Error fetching payment ID ${paymentId}:`, err.message);
      }
    }
    // 2. Verify via saved Razorpay Order ID on the order
    else if (order && order.razorpayOrderId) {
      try {
        const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpayOrderId}/payments`, {
          headers: { 'Authorization': authHeader }
        });
        const data = await rzpRes.json();
        if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
          razorpayAuthError = true;
          console.warn(`[Razorpay] Auth failure verifying order: ${order.razorpayOrderId}`);
        } else if (data && data.items && Array.isArray(data.items)) {
          const capturedPayment = data.items.find(p => p.status === 'captured');
          if (capturedPayment) {
            status = "captured";
            paymentDetails = capturedPayment;
          } else if (data.items.length > 0) {
            status = data.items[0].status;
            paymentDetails = data.items[0];
          }
          verifiedViaRazorpay = true;
        }
      } catch (err) {
        console.error(`[Razorpay] Error fetching payments for Razorpay Order ${order.razorpayOrderId}:`, err.message);
      }
    }

    // 3. Fallback to simulation if credentials fail or order details not found on Razorpay
    if (razorpayAuthError || !verifiedViaRazorpay) {
      if (!isMockPaymentAllowed()) {
        console.error(`[Razorpay] Verification failed. Fallback simulation is disabled in this environment. (AuthError: ${razorpayAuthError}, Verified: ${verifiedViaRazorpay})`);
        status = "failed";
      } else {
        console.warn(`[Razorpay] Verification fallback to simulation. (AuthError: ${razorpayAuthError}, Verified: ${verifiedViaRazorpay})`);
        paymentDetails = {
          razorpay_payment_id: paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          razorpay_order_id: (order && order.razorpayOrderId) || `order_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          status: "captured", // Mock captured status
          amount: (order ? order.price : 299) * 100, // in paisa
          currency: "INR",
          method: "card",
          email: "user@example.com",
          contact: "+919876543210"
        };
        status = "captured";
      }
    }

    // 4. Update the local order if paid successfully
    if (order && status === "captured") {
      const pId = paymentDetails ? (paymentDetails.id || paymentDetails.razorpay_payment_id) : null;
      if (isDraft) {
        order.status = "Paid";
        order.bookingStatus = "searching";
        order.razorpayPaymentId = pId;
        await DbLayer.createOrder(order);
        draftOrders.delete(order.userPhone);
        console.log(`[Payment] Promoting draft order #${resolvedOrderId} to database as Paid via Razorpay Payment ${pId}`);
      } else {
        await DbLayer.updateOrder(resolvedOrderId, {
          status: "Paid",
          bookingStatus: "searching", // begin search for professionals
          razorpayPaymentId: pId
        });
        console.log(`[Payment] Order #${resolvedOrderId} marked as Paid via Razorpay Payment ${pId}`);
      }
      if (order && order.userPhone) {
        await DbLayer.clearCart(order.userPhone).catch(() => {});
        await saveUserRawCartItems(order.userPhone, []).catch(() => {});
        console.log(`[Cart] Cleared cart for user ${order.userPhone} after payment verification`);
      }
    }

    res.json({
      success: status === "captured" || status === "cod",
      orderId: resolvedOrderId,
      paymentStatus: status,
      paymentDetails: paymentDetails,
      message: (status === "captured" || status === "cod")
        ? `Payment checked successfully from Razorpay. Status: ${status}`
        : `Payment verification failed. Status: ${status}`
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handlePayPage = async (req, res) => {
  const orderIdStr = req.params.orderId;
  if (!orderIdStr) {
    return res.status(400).send("<h1>Error: Invalid Order ID</h1>");
  }
  
  try {
    let order = null;
    if (!isNaN(orderIdStr)) {
      const numId = parseInt(orderIdStr);
      order = await DbLayer.getOrderById(numId);
      // Also check in-memory draft orders (online payment orders not yet confirmed)
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === numId) {
            order = draft;
            break;
          }
        }
      }
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
      // Also check in-memory draft orders
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === orderIdStr) {
            order = draft;
            break;
          }
        }
      }
    }
    
    if (!order) {
      return res.status(404).send("<h1>Error: Order not found</h1>");
    }
    
    const orderId = order.id;
    
    if (order.status.toLowerCase() === "paid") {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Already Paid</title>
          <style>
            body { font-family: 'Outfit', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
            .icon { font-size: 64px; margin-bottom: 20px; color: #2ecc71; }
            h2 { color: #1e293b; margin: 0 0 10px 0; }
            p { color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; }
            .btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>Already Paid</h2>
            <p>This order #${orderId} is already paid. You can return to the app.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
        </html>
      `);
    }

    const price = order.price || 0;
    const serviceName = order.serviceName || "Home Service";
    const rzpOrderId = order.razorpayOrderId;
    const userPhone = order.userPhone || "";

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
    // isMockMode is true only when there is no real Razorpay Order ID (i.e. API call failed)
    const isMockMode = !rzpOrderId || rzpOrderId.startsWith('order_mock_');

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pay for Order #${orderId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 480px;
            width: 100%;
            text-align: center;
            animation: fadeIn 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          h2 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .service-name {
            font-size: 18px;
            color: #94a3b8;
            margin-bottom: 30px;
          }
          .price-tag {
            font-size: 48px;
            font-weight: 700;
            color: #38bdf8;
            margin-bottom: 30px;
          }
          .price-tag span {
            font-size: 24px;
            color: #94a3b8;
            font-weight: 400;
          }
          .btn-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
          }
          .btn {
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
          }
          .btn-primary {
            background: linear-gradient(to right, #2563eb, #1d4ed8);
            color: white;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
          }
          .btn-simulated {
            background: linear-gradient(to right, #10b981, #047857);
            color: white;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
          }
          .btn-simulated:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
          }
          .footer-text {
            margin-top: 30px;
            font-size: 13px;
            color: #64748b;
          }
          .loader {
            display: none;
            margin: 20px auto;
            border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid #38bdf8;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <div class="card">
          <h2>Secure Checkout</h2>
          <div class="service-name">${serviceName} (Order #${orderId})</div>
          
          <div class="price-tag"><span>₹</span>${price}</div>
          
          <div class="loader" id="loader"></div>
          
          <div class="btn-container" id="buttons">
            ${isMockPaymentAllowed() ? (isMockMode ? `
              <div style="padding: 12px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 13px; color: #fbbf24; margin-bottom: 10px;">
                ⚠️ Sandbox mode active: Live Razorpay credentials are not configured or invalid.
              </div>
              <button class="btn btn-simulated" onclick="payMock()">Proceed with Simulated Payment</button>
            ` : `
              <button class="btn btn-primary" onclick="payReal()">Pay Securely via Razorpay</button>
              <button class="btn btn-simulated" style="background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);" onclick="payMock()">Pay via Simulator (Test)</button>
            `) : (isMockMode ? `
              <div style="padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; font-size: 13px; color: #ef4444; margin-bottom: 10px;">
                ❌ Payment unavailable: Live Razorpay credentials are not configured.
              </div>
            ` : `
              <button class="btn btn-primary" onclick="payReal()">Pay Securely via Razorpay</button>
            `)}
          </div>
          
          <div class="footer-text">
            Protected by 256-bit encryption. Do not reload or close this page.
          </div>
        </div>

        <script>
          const orderId = "${orderId}";
          const rzpOrderId = "${rzpOrderId || ''}";
          const razorpayKeyId = "${razorpayKeyId}";
          const amountPaisa = "${Math.round(price * 100)}";
          const serviceName = "${serviceName}";
          const userPhone = "${userPhone}";

          function showLoader() {
            document.getElementById('buttons').style.display = 'none';
            document.getElementById('loader').style.display = 'block';
          }

          function payReal() {
            showLoader();
            var options = {
              "key": razorpayKeyId,
              "amount": amountPaisa,
              "currency": "INR",
              "name": "Home Faciliti",
              "description": serviceName,
              "order_id": rzpOrderId,
              "handler": function (response){
                window.location.href = "/api/payments/callback?orderId=" + orderId + 
                  "&razorpay_payment_id=" + response.razorpay_payment_id + 
                  "&razorpay_order_id=" + response.razorpay_order_id + 
                  "&razorpay_signature=" + response.razorpay_signature;
              },
              "modal": {
                "ondismiss": function() {
                  document.getElementById('buttons').style.display = 'flex';
                  document.getElementById('loader').style.display = 'none';
                }
              },
              "prefill": {
                "contact": userPhone,
                "email": "customer@homefaciliti.com"
              },
              "theme": {
                "color": "#3b82f6"
              }
            };
            try {
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (response){
                window.location.href = "/api/payments/callback?orderId=" + orderId + 
                  "&status=failed&reason=" + encodeURIComponent(response.error.description);
              });
              rzp.open();
            } catch (err) {
              alert("Could not load Razorpay Checkout popup: " + err.message);
              document.getElementById('buttons').style.display = 'flex';
              document.getElementById('loader').style.display = 'none';
            }
          }

          function payMock() {
            showLoader();
            setTimeout(function() {
              window.location.href = "/api/payments/callback?orderId=" + orderId + "&status=captured&mock=true";
            }, 1000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Pay page failed:", err);
    res.status(500).send("<h1>Internal Server Error</h1>");
  }
};

const handlePaymentCallback = async (req, res) => {
  const orderIdStr = req.query.orderId || req.body.orderId;
  const paymentId = req.query.razorpay_payment_id || req.query.paymentId;
  const mock = req.query.mock;
  const status = req.query.status || "captured";
  const reason = req.query.reason || "Payment process could not be completed";

  if (!orderIdStr) {
    return res.status(400).send("<h1>Error: Invalid Order ID in callback</h1>");
  }

  try {
    let isDraftOrder = false;
    let order = null;
    if (!isNaN(orderIdStr)) {
      const numId = parseInt(orderIdStr);
      order = await DbLayer.getOrderById(numId);
      // Also check in-memory draft orders (online payment orders pending confirmation)
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === numId) {
            order = draft;
            isDraftOrder = true;
            break;
          }
        }
      }
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
      // Also check in-memory draft orders
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === orderIdStr) {
            order = draft;
            isDraftOrder = true;
            break;
          }
        }
      }
    }

    if (!order) {
      return res.status(404).send("<h1>Error: Order not found in callback</h1>");
    }

    const orderId = order.id;

    let isSuccessful = false;
    let finalPaymentId = paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    if (status === "failed") {
      isSuccessful = false;
    } else if (mock === "true") {
      if (!isMockPaymentAllowed()) {
        return res.status(400).send("<h1>Error: Simulated payments are disabled in this environment.</h1>");
      }
      isSuccessful = true;
    } else {
      isSuccessful = true;
    }

    if (isSuccessful) {
      if (isDraftOrder) {
        // Draft order (online payment, not yet in DB) – promote it to the database
        order.status = "Paid";
        order.bookingStatus = "searching";
        order.razorpayPaymentId = finalPaymentId;
        await DbLayer.createOrder(order);
        draftOrders.delete(order.userPhone);
        console.log(`[Payment Callback] Promoted draft order #${orderId} to database as Paid via payment ${finalPaymentId}`);
      } else {
        await DbLayer.updateOrder(orderId, {
          status: "Paid",
          bookingStatus: "searching",
          razorpayPaymentId: finalPaymentId
        });
        console.log(`[Payment Callback] Order #${orderId} marked as Paid via payment ${finalPaymentId}`);
      }

      if (order && order.userPhone) {
        await DbLayer.clearCart(order.userPhone).catch(() => {});
        await saveUserRawCartItems(order.userPhone, []).catch(() => {});
        console.log(`[Cart] Cleared cart for user ${order.userPhone} on payment callback`);
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Outfit', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .card {
              background: rgba(30, 41, 59, 0.85);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 44px 36px;
              border-radius: 28px;
              box-shadow: 0 32px 60px rgba(0,0,0,0.4);
              max-width: 400px;
              width: 92%;
              text-align: center;
              animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes scaleUp {
              from { transform: scale(0.85); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .checkmark {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              background: linear-gradient(135deg, #10b981, #059669);
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 44px;
              color: white;
              margin: 0 auto 24px auto;
              box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
              animation: pop 0.7s 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            }
            @keyframes pop {
              0% { transform: scale(0) rotate(-30deg); }
              100% { transform: scale(1) rotate(0deg); }
            }
            h2 { color: #10b981; font-size: 26px; margin-bottom: 8px; }
            .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 28px; }
            .details {
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.07);
              padding: 18px;
              border-radius: 14px;
              margin-bottom: 24px;
              font-size: 14px;
              text-align: left;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 13px; }
            .value { color: #f8fafc; font-weight: 600; }
            .status-badge {
              background: rgba(16,185,129,0.15);
              color: #10b981;
              border: 1px solid rgba(16,185,129,0.3);
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .countdown-box {
              background: rgba(14, 165, 233, 0.1);
              border: 1px solid rgba(14, 165, 233, 0.2);
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 16px;
              font-size: 13px;
              color: #7dd3fc;
            }
            .countdown-num { font-weight: 700; color: #38bdf8; font-size: 16px; }
            .btn {
              background: linear-gradient(135deg, #10b981, #0ea5e9);
              color: white;
              border: none;
              padding: 15px 28px;
              border-radius: 14px;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 100%;
              letter-spacing: 0.3px;
            }
            .btn:hover { opacity: 0.9; transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="checkmark">✓</div>
            <h2>Payment Successful!</h2>
            <p class="subtitle">Your booking is confirmed 🎉</p>

            <div class="details">
              <div class="detail-row">
                <span class="label">Order ID</span>
                <span class="value">#${orderId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid</span>
                <span class="value">₹${order.price}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction ID</span>
                <span class="value" style="font-size:12px;">${finalPaymentId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status</span>
                <span class="status-badge">✓ Captured</span>
              </div>
            </div>

            <div class="countdown-box">
              Returning to app in <span class="countdown-num" id="timer">3</span> seconds...
            </div>

            <button class="btn" onclick="window.close()">Return to App Now</button>
          </div>
          <script>
            let t = 3;
            const el = document.getElementById('timer');
            const interval = setInterval(() => {
              t--;
              el.textContent = t;
              if (t <= 0) {
                clearInterval(interval);
                window.close();
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: rgba(30, 41, 59, 0.7);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              max-width: 400px;
              width: 90%;
              text-align: center;
              animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes scaleUp {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .cross {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: #ef4444;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 40px;
              color: white;
              margin: 0 auto 24px auto;
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
              animation: pop 0.6s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            }
            @keyframes pop {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
            h2 {
              color: #f87171;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            p {
              color: #94a3b8;
              font-size: 15px;
              line-height: 1.6;
              margin: 0 0 24px 0;
            }
            .btn {
              background: #ef4444;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 100%;
            }
            .btn:hover {
              background: #dc2626;
              transform: translateY(-1px);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="cross">✗</div>
            <h2>Payment Failed</h2>
            <p>${reason}</p>
            <button class="btn" onclick="window.close()">Close & Try Again</button>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error("Payment callback handler failed:", err);
    res.status(500).send("<h1>Internal Server Error</h1>");
  }
};


const paymentCod = async (req, res) => {
  const orderIdStr = req.params.orderId;
  if (!orderIdStr || isNaN(orderIdStr)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }
  try {
    const orderId = parseInt(orderIdStr);
    let order = await DbLayer.getOrderById(orderId);
    let isDraft = false;
    
    if (!order) {
      // Look in draftOrders in-memory map
      for (const draft of draftOrders.values()) {
        if (draft.id === orderId) {
          order = draft;
          isDraft = true;
          break;
        }
      }
    }
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    let updatedOrder;
    if (isDraft) {
      // Promote draft order to database
      order.status = "Pending";
      order.bookingStatus = "searching";
      order.payment = {
        paymentMethod: "Cash",
        amountPaid: 0
      };
      updatedOrder = await DbLayer.createOrder(order);
      draftOrders.delete(order.userPhone);
      console.log(`[Payment] Promoted draft order #${orderId} to database as Cash on Delivery`);
    } else {
      await DbLayer.updateOrder(orderId, {
        status: "Pending",
        bookingStatus: "searching",
        payment: {
          paymentMethod: "Cash",
          amountPaid: 0
        }
      });
      updatedOrder = await DbLayer.getOrderById(orderId);
      console.log(`[Payment] Order #${orderId} confirmed as Cash on Delivery`);
    }
    
    if (order && order.userPhone) {
      await DbLayer.clearCart(order.userPhone).catch(() => {});
      await saveUserRawCartItems(order.userPhone, []).catch(() => {});
      console.log(`[Cart] Cleared cart for user ${order.userPhone} on COD confirmation`);
    }
    
    res.json({
      success: true,
      orderId: orderId,
      order: updatedOrder,
      message: translate("booking_success", req.lang)
    });
  } catch (err) {
    console.error("COD confirmation API failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createPayment = async (req, res) => {
  const { orderId, amount, paymentMethod } = req.body;
  if (!orderId || !amount || !paymentMethod) {
    return res.status(400).json({ error: "orderId, amount, and paymentMethod are required" });
  }
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAmcPay = String(orderId).toUpperCase().startsWith("AMC");
    let amcSub = null;
    let order = null;

    if (isAmcPay) {
      amcSub = await DbLayer.getAmcSubscriptionById(orderId);
      if (!amcSub) {
        return res.status(404).json({ error: "AMC subscription not found" });
      }
    } else {
      order = await DbLayer.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
    }

    let razorpayOrderId = null;
    const isOnline = paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay";
    if (isOnline) {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
      try {
        const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(Number(amount) * 100),
            currency: 'INR',
            receipt: `pay_${orderId}_${Date.now()}`
          })
        });
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
        }
      } catch (err) {
        console.error('[Payments] Razorpay order generation failed:', err.message);
      }
      if (!razorpayOrderId) {
        razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      }

      // Update local storage of razorpayOrderId
      if (isAmcPay) {
        await DbLayer.updateAmcSubscription(orderId, { razorpayOrderId });
      } else if (order) {
        await DbLayer.updateOrder(order.id, { razorpayOrderId });
      }
    }

    res.json({
      success: true,
      orderId: isAmcPay ? orderId : order.id,
      amount: Number(amount),
      paymentMethod,
      razorpayOrderId,
      status: isOnline ? "Initiated" : "Success",
      message: isOnline ? "Razorpay order generated successfully" : "Payment processed successfully"
    });
  } catch (err) {
    console.error("Create payment failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  handleVerifyPayment,
  handlePayPage,
  handlePaymentCallback,
  paymentCod,
  createPayment
};
