const Stripe = require("stripe");

function normalizeType(ticketType) {
  return ticketType === "vip" ? "vip" : "normal";
}

function amountForType(ticketType) {
  return normalizeType(ticketType) === "vip" ? 11000 : 100;
}

function getBaseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY manquante" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { email, firstName, lastName, ticketType } = body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: "Nom, prénom et email requis." });
    }

    const normalizedType = normalizeType(ticketType);
    const amountCents = amountForType(normalizedType);
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: String(email).trim().toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Baccha Festival - Ticket ${normalizedType === "vip" ? "VIP" : "Normal"}`
            }
          }
        }
      ],
      success_url: `${baseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment.html?payment=cancel`,
      metadata: {
        email: String(email).trim().toLowerCase(),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        ticketType: normalizedType
      }
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur Stripe" });
  }
};
