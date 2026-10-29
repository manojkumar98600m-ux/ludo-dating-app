const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ error: "Payment is not configured yet." });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res.status(400).json({ verified: false, error: "Missing payment details." });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const received = Buffer.from(razorpay_signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) {
    return res.status(400).json({ verified: false, error: "Payment signature is invalid." });
  }

  // Signature verification alone does not store or activate membership.
  // Confirm captured payment status and persist membership in a trusted database before production use.
  return res.status(200).json({
    verified: true,
    paymentId: razorpay_payment_id,
    membershipActivated: false,
    message: "Signature verified. Membership activation needs a database and captured-payment check."
  });
};
