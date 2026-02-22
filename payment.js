const firstNameEl = document.getElementById("payFirstName");
const lastNameEl = document.getElementById("payLastName");
const walletEl = document.getElementById("payWallet");
const emailEl = document.getElementById("payEmail");
const typeEl = document.getElementById("payType");
const amountEl = document.getElementById("payAmount");
const messageEl = document.getElementById("message");
const confirmPayBtn = document.getElementById("confirmPayBtn");

let pending = null;

function formatType(type) {
  return type === "vip" ? "VIP" : "Normal";
}

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#ffd0d8" : "#fff6c4";
}

function loadPendingPayment() {
  const raw = localStorage.getItem("BACCHA_PENDING_PAYMENT");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderSummary(data) {
  firstNameEl.textContent = data.firstName || "-";
  lastNameEl.textContent = data.lastName || "-";
  walletEl.textContent = data.walletAddress || "-";
  emailEl.textContent = data.email || "-";
  typeEl.textContent = formatType(data.ticketType);

  const cents = getTicketPriceCentsForType(data.ticketType);
  amountEl.textContent = `${(cents / 100).toFixed(2)} EUR`;
}

async function onConfirmPayment() {
  try {
    if (!pending) {
      throw new Error("Aucun paiement en attente.");
    }

    confirmPayBtn.disabled = true;
    setMessage("Redirection vers Stripe Checkout...");

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: pending.email,
        firstName: pending.firstName,
        lastName: pending.lastName,
        ticketType: pending.ticketType
      })
    });

    const data = await response.json();
    if (!response.ok || !data.url) {
      throw new Error(data.error || "Impossible de créer la session Stripe.");
    }

    window.location.href = data.url;
  } catch (error) {
    confirmPayBtn.disabled = false;
    setMessage(error.message || "Paiement impossible.", true);
  }
}

function initPaymentPage() {
  pending = loadPendingPayment();
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "cancel") {
    setMessage("Paiement annulé. Tu peux réessayer.", true);
  }

  if (!pending) {
    confirmPayBtn.disabled = true;
    setMessage("Aucun paiement en attente. Retourne à l’accueil pour démarrer un paiement.", true);
    return;
  }

  renderSummary(pending);
  confirmPayBtn.addEventListener("click", onConfirmPayment);
}

initPaymentPage();
