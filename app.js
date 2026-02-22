// Gestion UI Baccha Festival SBT (mode mock)
const connectBtn = document.getElementById("connectBtn");
const payBtn = document.getElementById("payBtn");
const mintBtn = document.getElementById("mintBtn");
const firstNameInput = document.getElementById("firstNameInput");
const lastNameInput = document.getElementById("lastNameInput");
const emailInput = document.getElementById("emailInput");
const ticketTypeSelect = document.getElementById("ticketTypeSelect");

const walletStatus = document.getElementById("walletStatus");
const paymentStatus = document.getElementById("paymentStatus");
const messageEl = document.getElementById("message");

const mintSection = document.getElementById("mintSection");
const ticketSection = document.getElementById("ticketSection");

const ticketFirstNameEl = document.getElementById("ticketFirstName");
const ticketLastNameEl = document.getElementById("ticketLastName");
const ticketEmailEl = document.getElementById("ticketEmail");
const ticketIdEl = document.getElementById("ticketId");
const ticketTypeEl = document.getElementById("ticketType");
const ticketWalletEl = document.getElementById("ticketWallet");

function getSelectedTicketType() {
  return ticketTypeSelect.value === "vip" ? "vip" : "normal";
}

function formatTicketType(type) {
  return type === "vip" ? "VIP" : "Normal";
}

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#ffd0d8" : "#fff6c4";
}

function setWalletStatus(wallet) {
  if (!wallet) {
    walletStatus.textContent = "Wallet non connecté";
    return;
  }

  const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  const email = window.CURRENT_EMAIL || "email inconnu";
  const fullName = `${window.CURRENT_FIRST_NAME || ""} ${window.CURRENT_LAST_NAME || ""}`.trim();
  walletStatus.textContent = `Connecté : ${shortWallet} (${email})${fullName ? ` - ${fullName}` : ""}`;
}

function setPaymentStatus() {
  if (!window.CURRENT_EMAIL) {
    paymentStatus.textContent = "Paiement non effectué";
    return;
  }

  const type = getSelectedTicketType();
  const paid = hasPaidTicket(window.CURRENT_EMAIL, type);
  if (!paid) {
    paymentStatus.textContent = `Paiement ${formatTicketType(type)} non effectué`;
    return;
  }

  const record = getPaymentRecord(window.CURRENT_EMAIL);
  const credits = record && record.credits ? record.credits : { normal: 0, vip: 0 };
  paymentStatus.textContent = `Crédits paiement - Normal: ${credits.normal || 0} / VIP: ${credits.vip || 0}`;
}

function renderTicket(ticket) {
  if (!ticket) {
    // Aucun ticket: on masque la carte ticket
    ticketSection.classList.add("hidden");
    mintSection.classList.remove("hidden");
    return;
  }

  ticketFirstNameEl.textContent = ticket.firstName || "-";
  ticketLastNameEl.textContent = ticket.lastName || "-";
  ticketEmailEl.textContent = ticket.holderEmail || "-";
  ticketIdEl.textContent = ticket.ticketId;
  ticketTypeEl.textContent = formatTicketType(ticket.ticketType);
  ticketWalletEl.textContent = ticket.wallet;

  const qrPayload = {
    ticketId: ticket.ticketId,
    wallet: ticket.wallet,
    event: "Baccha Festival",
    ticketType: ticket.ticketType,
    firstName: ticket.firstName || "",
    lastName: ticket.lastName || ""
  };

  // Génère le QR code avec le payload demandé
  generateQRCode(JSON.stringify(qrPayload));

  ticketSection.classList.remove("hidden");
  mintSection.classList.remove("hidden");
}

function updateButtonsState() {
  const isConnected = Boolean(window.CURRENT_WALLET);
  const selectedType = getSelectedTicketType();
  const hasPaid = Boolean(window.CURRENT_EMAIL && hasPaidTicket(window.CURRENT_EMAIL, selectedType));

  payBtn.disabled = !isConnected;
  mintBtn.disabled = !isConnected || !hasPaid;
}

async function refreshUI() {
  const ticket = await getUserTicket();
  setWalletStatus(window.CURRENT_WALLET);
  setPaymentStatus();
  renderTicket(ticket);
  updateButtonsState();
}

async function onConnect() {
  try {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    if (!firstName || !lastName) {
      throw new Error("Nom et prénom obligatoires pour se connecter.");
    }
    if (!email) {
      throw new Error("Adresse email obligatoire pour se connecter avec Dynamic.");
    }

    setMessage("Connexion wallet en cours...");
    const result = await connectWallet(email, firstName, lastName);
    setMessage(`Wallet connecté : ${result.shortWallet} (${result.email})`);
    await refreshUI();
  } catch (error) {
    setMessage(error.message || "Erreur de connexion", true);
  }
}

async function onPay() {
  try {
    if (!window.CURRENT_EMAIL) {
      throw new Error("Connecte-toi d'abord avant de payer.");
    }

    const ticketType = getSelectedTicketType();
    const pendingPayment = {
      email: window.CURRENT_EMAIL,
      firstName: window.CURRENT_FIRST_NAME,
      lastName: window.CURRENT_LAST_NAME,
      walletAddress: window.CURRENT_WALLET,
      ticketType,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("BACCHA_PENDING_PAYMENT", JSON.stringify(pendingPayment));
    window.location.href = "payment.html";
  } catch (error) {
    setMessage(error.message || "Erreur de paiement Stripe", true);
  }
}

function handlePaymentReturnMessage() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const type = params.get("type");

  if (paymentStatus === "success") {
    setMessage(`Paiement ${formatTicketType(type)} validé. Tu peux maintenant mint ton ticket.`);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function onMint() {
  try {
    setMessage("Mint du ticket SBT en cours...");
    const ticket = await mintSBTTicket(getSelectedTicketType());
    setMessage(`Ticket ${formatTicketType(ticket.ticketType)} créé : ${ticket.ticketId}`);
    renderTicket(ticket);
    setPaymentStatus();
    updateButtonsState();
  } catch (error) {
    setMessage(error.message || "Erreur pendant le mint", true);
    await refreshUI();
  }
}

function initApp() {
  // Initialisation du provider mock Dynamic
  initDynamic();

  connectBtn.addEventListener("click", onConnect);
  payBtn.addEventListener("click", onPay);
  mintBtn.addEventListener("click", onMint);
  ticketTypeSelect.addEventListener("change", () => {
    setPaymentStatus();
    updateButtonsState();
  });

  handlePaymentReturnMessage();
  refreshUI();
}

initApp();
