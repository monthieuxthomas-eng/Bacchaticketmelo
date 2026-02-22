const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY manquante" });
  }

  try {
    const sessionId = req.query?.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: "session_id requis" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Session non payée" });
    }

    return res.status(200).json({
      paid: true,
      sessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      email: session.metadata?.email || session.customer_email || "",
      firstName: session.metadata?.firstName || "",
      lastName: session.metadata?.lastName || "",
      ticketType: session.metadata?.ticketType || "normal"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur de vérification" });
  }
};
