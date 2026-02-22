// Mock Stripe payment flow
// TODO: Remplacer ce mock par Stripe Checkout/Payment Element côté backend sécurisé.

const PAYMENT_STORAGE_KEY = "BACCHA_STRIPE_PAYMENTS";
const PROCESSED_SESSIONS_KEY = "BACCHA_STRIPE_PROCESSED_SESSIONS";
const TICKET_PRICES_CENTS = {
  normal: 100,
  vip: 11000
};

function loadPayments() {
  const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePayments(payments) {
  localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
}

function loadProcessedSessions() {
  const raw = localStorage.getItem(PROCESSED_SESSIONS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProcessedSessions(processed) {
  localStorage.setItem(PROCESSED_SESSIONS_KEY, JSON.stringify(processed));
}

function normalizeType(ticketType) {
  return ticketType === "vip" ? "vip" : "normal";
}

function getTicketPriceCentsForType(ticketType) {
  const type = normalizeType(ticketType);
  return TICKET_PRICES_CENTS[type];
}

function getOrCreatePaymentState(email) {
  const normalizedEmail = email.toLowerCase();
  const payments = loadPayments();

  if (!payments[normalizedEmail]) {
    payments[normalizedEmail] = {
      credits: {
        normal: 0,
        vip: 0
      },
      history: []
    };
  }

  return { payments, normalizedEmail, state: payments[normalizedEmail] };
}

function hasPaidTicket(email, ticketType) {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase();
  const payments = loadPayments();
  const state = payments[normalizedEmail];
  if (!state || !state.credits) return false;

  if (ticketType) {
    const type = normalizeType(ticketType);
    return (state.credits[type] || 0) > 0;
  }

  return (state.credits.normal || 0) > 0 || (state.credits.vip || 0) > 0;
}

function getPaymentRecord(email) {
  if (!email) return null;
  const payments = loadPayments();
  return payments[email.toLowerCase()] || { credits: { normal: 0, vip: 0 }, history: [] };
}

function consumePaidTicket(email, ticketType) {
  if (!email) throw new Error("Email requis pour consommer un paiement.");

  const type = normalizeType(ticketType);
  const { payments, normalizedEmail, state } = getOrCreatePaymentState(email);

  if ((state.credits[type] || 0) <= 0) {
    throw new Error(`Paiement requis pour un ticket ${type.toUpperCase()}.`);
  }

  state.credits[type] -= 1;
  savePayments(payments);

  return {
    email: normalizedEmail,
    ticketType: type,
    remainingCredits: state.credits[type]
  };
}

async function payTicketWithStripe({ email, firstName, lastName, ticketType = "normal", cardData = null }) {
  if (!email || !firstName || !lastName) {
    throw new Error("Nom, prénom et email requis pour le paiement.");
  }

  const type = normalizeType(ticketType);
  const amountCents = getTicketPriceCentsForType(type);
  const normalizedEmail = email.trim().toLowerCase();
  const { payments, state } = getOrCreatePaymentState(normalizedEmail);

  // Mock de succès de paiement Stripe.
  // TODO: Créer une session Stripe Checkout et rediriger l'utilisateur.
  await new Promise((resolve) => setTimeout(resolve, 700));

  const paymentEntry = {
    status: "paid",
    provider: "stripe",
    amountCents,
    currency: "EUR",
    ticketType: type,
    paidAt: new Date().toISOString(),
    customer: {
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    },
    paymentMethod: cardData
      ? {
          brand: "card",
          last4: cardData.cardLast4 || "0000",
          expiry: cardData.expiry || "--/--"
        }
      : null,
    mockSessionId: `cs_test_${Date.now()}`
  };

  state.credits[type] = (state.credits[type] || 0) + 1;
  state.history.push(paymentEntry);

  savePayments(payments);

  return {
    ...paymentEntry,
    credits: state.credits
  };
}

function registerStripePaidCredit({ sessionId, email, firstName, lastName, ticketType, amountTotal, currency }) {
  if (!sessionId || !email) {
    throw new Error("Session Stripe invalide.");
  }

  const processed = loadProcessedSessions();
  if (processed[sessionId]) {
    return { alreadyProcessed: true };
  }

  const type = normalizeType(ticketType);
  const normalizedEmail = String(email).trim().toLowerCase();
  const { payments, state } = getOrCreatePaymentState(normalizedEmail);

  const paymentEntry = {
    status: "paid",
    provider: "stripe",
    amountCents: Number(amountTotal || getTicketPriceCentsForType(type)),
    currency: String(currency || "eur").toUpperCase(),
    ticketType: type,
    paidAt: new Date().toISOString(),
    customer: {
      email: normalizedEmail,
      firstName: String(firstName || "").trim(),
      lastName: String(lastName || "").trim()
    },
    stripeSessionId: sessionId
  };

  state.credits[type] = (state.credits[type] || 0) + 1;
  state.history.push(paymentEntry);
  savePayments(payments);

  processed[sessionId] = { createdAt: new Date().toISOString(), email: normalizedEmail, ticketType: type };
  saveProcessedSessions(processed);

  return { alreadyProcessed: false, credits: state.credits };
}
