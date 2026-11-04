const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const getBalance = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ success: true, balance: user.walletBalance || 0, message: "Wallet balance retrieved successfully" });
  } catch (err) {
    console.error("Fetch wallet balance failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addMoney = async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newBalance = (user.walletBalance || 0) + Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });
    await DbLayer.createWalletTransaction({
      userPhone: user.phone,
      amount: Number(amount),
      type: 'credit',
      description: 'Money added to wallet'
    });

    res.json({ success: true, balance: newBalance, message: "Money added to wallet successfully" });
  } catch (err) {
    console.error("Add wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deductMoney = async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const newBalance = (user.walletBalance || 0) - Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });
    await DbLayer.createWalletTransaction({
      userPhone: user.phone,
      amount: Number(amount),
      type: 'debit',
      description: 'Money deducted from wallet'
    });

    res.json({ success: true, balance: newBalance, message: "Money deducted from wallet successfully" });
  } catch (err) {
    console.error("Deduct wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getHistory = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await DbLayer.getWalletTransactions(user.phone);
    
    // Calculate the total sum of transactions to find any untracked starting balance
    const transactionSum = transactions.reduce((sum, tx) => {
      if (tx.type === 'credit') {
        return sum + Number(tx.amount);
      } else {
        return sum - Number(tx.amount);
      }
    }, 0);

    const currentBalance = Number(user.walletBalance || 0);
    const discrepancy = currentBalance - transactionSum;

    if (discrepancy > 0) {
      transactions.push({
        id: 0,
        amount: discrepancy,
        type: 'credit',
        description: 'Starting wallet balance',
        senderName: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const mappedTransactions = transactions.map(tx => {
      return {
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        senderName: tx.senderName || user.name || "Guest User",
        createdAt: tx.createdAt
      };
    });

    res.json({
      success: true,
      transactions: mappedTransactions,
      message: "Wallet transactions retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch wallet history failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getRules = (req, res) => {
  res.json({
    success: true,
    rules: [
      { condition: "price <= 800", maxWalletDeduction: 100, description: "Orders up to Rs.800: fixed cap of Rs.100 from wallet" },
      { condition: "price > 800", maxWalletDeductionPercent: 20, description: "Orders above Rs.800: up to 20% of service price from wallet" }
    ],
    message: "Wallet discount rules retrieved successfully"
  });
};
const calculateDiscount = async (req, res) => {
  const { price } = req.body;
  if (price === undefined || isNaN(price) || price < 0) {
    return res.status(400).json({ error: "Invalid price" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const walletBalance = Number(user.walletBalance || 0);
    const servicePrice = Number(price);

    // Tiered wallet discount rule:
    // - Orders <= Rs.800: fixed cap of Rs.100
    // - Orders > Rs.800: 20% of service price (no fixed cap)
    let maxAllowedFromWallet;
    if (servicePrice <= 800) {
      maxAllowedFromWallet = 100;
    } else {
      maxAllowedFromWallet = servicePrice * 0.20;
    }
    const allowedDiscount = Math.min(walletBalance, maxAllowedFromWallet);
    const remainingPrice = Math.max(0, servicePrice - allowedDiscount);

    res.json({
      success: true,
      price: servicePrice,
      walletBalance,
      allowedDiscount,
      remainingPrice,
      rule: servicePrice <= 800 ? "fixed_cap_100" : "percent_20"
    });
  } catch (err) {
    console.error("Calculate wallet discount failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getBalance,
  addMoney,
  deductMoney,
  getHistory,
  getRules,
  calculateDiscount
};
