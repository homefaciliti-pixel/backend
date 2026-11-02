const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const lookup = async (req, res) => {
  const { code } = req.params;
  try {
    const user = await DbLayer.getUserByReferralCode(code);
    if (!user) {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    res.json({
      success: true,
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email,
        locality: user.locality
      },
      message: "Referral user found successfully"
    });
  } catch (err) {
    console.error("Referral lookup failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const apply = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Referral code is required" });
  }

  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Prevent self-referral
    if (currentUser.referralCode === code) {
      return res.status(400).json({ error: "Cannot apply your own referral code" });
    }

    // Find referrer
    const referrer = await DbLayer.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    // Check if current user has already applied a code
    const alreadyApplied = await DbLayer.getReferralApplied(currentUser.phone);
    if (alreadyApplied) {
      return res.status(400).json({ error: "Referral code already applied" });
    }

    // Reward only the referrer (the one who referred) with ₹500
    const newReferrerBalance = (referrer.walletBalance || 0) + 500.0;

    const referralRecord = {
      userPhone: currentUser.phone,
      referrerPhone: referrer.phone,
      appliedAt: new Date().toISOString()
    };

    await Promise.all([
      DbLayer.updateUser(referrer.phone, { walletBalance: newReferrerBalance }),
      DbLayer.createReferralApplied(referralRecord),
      DbLayer.createWalletTransaction({
        userPhone: referrer.phone,
        amount: 500.0,
        type: 'credit',
        description: `Referral bonus from ${currentUser.name || 'Guest'} (${currentUser.phone})`,
        senderName: currentUser.name || 'Guest User'
      })
    ]);

    res.json({
      success: true,
      message: `Referral code successfully applied! The referrer received ₹500.`,
      newBalance: currentUser.walletBalance || 0
    });
  } catch (err) {
    console.error("Apply referral code failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  lookup,
  apply
};
