const Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res.status(503).json({ error: "Payment is not configured yet." });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: 5000,
      currency: "INR",
      receipt: "ludo_membership_" + Date.now(),
      notes: { plan: "six_month_membership", duration_months: "6" }
    });
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error.message);
    return res.status(500).json({ error: "Could not create payment order." });
  }
};
