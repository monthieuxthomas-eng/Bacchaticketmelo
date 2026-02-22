require("dotenv").config();

const path = require("path");
const express = require("express");
const Stripe = require("stripe");

const app = express();
const port = Number(process.env.PORT || 4242);
const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[WARN] STRIPE_SECRET_KEY manquante. Configure .env avant de lancer un paiement réel.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing_key");

function normalizeType(ticketType) {
  return ticketType === "vip" ? "vip" : "normal";
}

function amountForType(ticketType) {
  return normalizeType(ticketType) === "vip" ? 11000 : 100;
}

app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(400).send("Missing STRIPE_WEBHOOK_SECRET");
    }

    try {
      const signature = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(req.body, signature, secret);

      if (event.type === "checkout.session.completed") {
        // TODO: En production, créditer côté backend la réservation/ticket ici.
      }

      return res.json({ received: true });
    } catch (error) {
      return res.status(400).send(`Webhook error: ${error.message}`);
    }
  }
);

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email, firstName, lastName, ticketType } = req.body || {};

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: "Nom, prénom et email requis." });
    }

    const normalizedType = normalizeType(ticketType);
    const amountCents = amountForType(normalizedType);

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
      success_url: `${appBaseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/payment.html?payment=cancel`,
      metadata: {
        email: String(email).trim().toLowerCase(),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        ticketType: normalizedType
      }
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur Stripe" });
  }
});

app.get("/api/verify-session", async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: "session_id requis" });
    }

    const session = await stripe.checkout.sessions.retrieve(String(sessionId));

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Session non payée" });
    }

    return res.json({
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
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Baccha Ticket server running on ${appBaseUrl}`);
});
