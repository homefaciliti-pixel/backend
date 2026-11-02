const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const getCards = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const cards = await DbLayer.getSavedCards(user.phone);
    res.json({ success: true, cards });
  } catch (err) {
    console.error("Fetch saved cards failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createCard = async (req, res) => {
  const { cardHolderName, cardNumber, expiryDate, cardType } = req.body;
  if (!cardHolderName || !cardNumber || !expiryDate || !cardType) {
    return res.status(400).json({ error: "cardHolderName, cardNumber, expiryDate, and cardType are required" });
  }
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let maskedNumber = cardNumber;
    if (cardNumber.length > 4) {
      maskedNumber = "**** **** **** " + cardNumber.slice(-4);
    }
    const newCard = await DbLayer.createSavedCard({
      userPhone: user.phone,
      cardHolderName,
      cardNumber: maskedNumber,
      expiryDate,
      cardType
    });
    res.json({ success: true, card: newCard, message: "Card saved successfully" });
  } catch (err) {
    console.error("Save card failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getCards,
  createCard
};
