// Mock Dynamic + SBT storage
// TODO: Remplacer ce mock par le SDK Dynamic (Dynamic.xyz) réel.
// TODO: Brancher les transactions on-chain vers un smart contract SBT burnable.

window.CURRENT_WALLET = null;
window.CURRENT_TICKET = null;
window.CURRENT_EMAIL = null;
window.CURRENT_FIRST_NAME = null;
window.CURRENT_LAST_NAME = null;

const OFFICIAL_ISSUER_WALLET = "0xbaccaa0000000000000000000000000000000001";
const STORAGE_KEY = "BACCHA_DYNAMIC_MOCK_DB";
const WALLET_KEY = "BACCHA_CURRENT_WALLET";
const EMAIL_KEY = "BACCHA_CURRENT_EMAIL";
const FIRSTNAME_KEY = "BACCHA_CURRENT_FIRSTNAME";
const LASTNAME_KEY = "BACCHA_CURRENT_LASTNAME";

const MOCK_DB = {
  ticketsByEmail: {}
};

function loadMockDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.ticketsByEmail) {
      const normalized = {};
      for (const [email, value] of Object.entries(parsed.ticketsByEmail)) {
        if (Array.isArray(value)) {
          normalized[email] = value;
        } else if (value && typeof value === "object") {
          normalized[email] = [value];
        } else {
          normalized[email] = [];
        }
      }
      MOCK_DB.ticketsByEmail = normalized;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      parsed.ticketsByWallet &&
      parsed.walletsByEmail
    ) {
      const migrated = {};
      for (const [email, wallet] of Object.entries(parsed.walletsByEmail)) {
        const ticket = parsed.ticketsByWallet[wallet];
        if (ticket) {
          migrated[email] = [{
            ...ticket,
            wallet: OFFICIAL_ISSUER_WALLET,
            holderEmail: email,
            issuedBy: OFFICIAL_ISSUER_WALLET,
            ticketType: "normal",
            priceCents: 100
          }];
        }
      }
      MOCK_DB.ticketsByEmail = migrated;
      saveMockDb();
    }
  } catch {
    MOCK_DB.ticketsByEmail = {};
  }
}

function saveMockDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function generateTicketId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `BACCHA-${ts}-${rand}`;
}

function normalizeType(ticketType) {
  return ticketType === "vip" ? "vip" : "normal";
}

function getTicketPriceCents(ticketType) {
  return normalizeType(ticketType) === "vip" ? 11000 : 100;
}

function initDynamic() {
  // TODO: Initialiser le provider Dynamic SDK ici.
  loadMockDb();
  const storedEmail = localStorage.getItem(EMAIL_KEY);
  const storedFirstName = localStorage.getItem(FIRSTNAME_KEY);
  const storedLastName = localStorage.getItem(LASTNAME_KEY);

  if (storedEmail) {
    window.CURRENT_EMAIL = storedEmail;
  }
  if (storedFirstName) {
    window.CURRENT_FIRST_NAME = storedFirstName;
  }
  if (storedLastName) {
    window.CURRENT_LAST_NAME = storedLastName;
  }

  window.CURRENT_WALLET = OFFICIAL_ISSUER_WALLET;
  localStorage.setItem(WALLET_KEY, OFFICIAL_ISSUER_WALLET);

  if (window.CURRENT_EMAIL) {
    const userTickets = MOCK_DB.ticketsByEmail[window.CURRENT_EMAIL] || [];
    window.CURRENT_TICKET = userTickets.length ? userTickets[userTickets.length - 1] : null;
  }
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function connectWallet(email, firstName, lastName) {
  // TODO: Utiliser Dynamic pour auth email et exécuter le mint depuis le wallet officiel backend.
  loadMockDb();

  const normalizedEmail = (email || "").trim().toLowerCase();
  const normalizedFirstName = (firstName || "").trim();
  const normalizedLastName = (lastName || "").trim();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error("Adresse email invalide.");
  }
  if (!normalizedFirstName || !normalizedLastName) {
    throw new Error("Nom et prénom invalides.");
  }

  window.CURRENT_EMAIL = normalizedEmail;
  window.CURRENT_FIRST_NAME = normalizedFirstName;
  window.CURRENT_LAST_NAME = normalizedLastName;

  localStorage.setItem(EMAIL_KEY, normalizedEmail);
  localStorage.setItem(FIRSTNAME_KEY, normalizedFirstName);
  localStorage.setItem(LASTNAME_KEY, normalizedLastName);

  window.CURRENT_WALLET = OFFICIAL_ISSUER_WALLET;
  localStorage.setItem(WALLET_KEY, window.CURRENT_WALLET);

  window.CURRENT_TICKET = MOCK_DB.ticketsByEmail[normalizedEmail] || null;

  return {
    wallet: window.CURRENT_WALLET,
    shortWallet: shortAddress(window.CURRENT_WALLET),
    email: window.CURRENT_EMAIL
  };
}

async function getUserTicket() {
  loadMockDb();

  if (!window.CURRENT_EMAIL) {
    const storedEmail = localStorage.getItem(EMAIL_KEY);
    if (storedEmail) {
      window.CURRENT_EMAIL = storedEmail;
    }
  }

  window.CURRENT_WALLET = OFFICIAL_ISSUER_WALLET;

  if (!window.CURRENT_EMAIL) return null;
  const userTickets = MOCK_DB.ticketsByEmail[window.CURRENT_EMAIL] || [];
  const ticket = userTickets.length ? userTickets[userTickets.length - 1] : null;
  window.CURRENT_TICKET = ticket;
  return ticket;
}

async function getUserTickets() {
  loadMockDb();

  if (!window.CURRENT_EMAIL) {
    const storedEmail = localStorage.getItem(EMAIL_KEY);
    if (storedEmail) {
      window.CURRENT_EMAIL = storedEmail;
    }
  }

  if (!window.CURRENT_EMAIL) return [];
  return MOCK_DB.ticketsByEmail[window.CURRENT_EMAIL] || [];
}

async function mintSBTTicket(ticketType = "normal") {
  // TODO: Exécuter le mint on-chain depuis le wallet officiel (custodial/backend).
  loadMockDb();

  if (!window.CURRENT_EMAIL) {
    throw new Error("Email non connecté.");
  }

  const type = normalizeType(ticketType);

  if (typeof consumePaidTicket !== "function") {
    throw new Error("Module Stripe indisponible.");
  }

  consumePaidTicket(window.CURRENT_EMAIL, type);

  const userTickets = MOCK_DB.ticketsByEmail[window.CURRENT_EMAIL] || [];

  const ticket = {
    ticketId: generateTicketId(),
    wallet: OFFICIAL_ISSUER_WALLET,
    event: "Baccha Festival",
    ticketType: type,
    priceCents: getTicketPriceCents(type),
    firstName: window.CURRENT_FIRST_NAME,
    lastName: window.CURRENT_LAST_NAME,
    holderEmail: window.CURRENT_EMAIL,
    issuedBy: OFFICIAL_ISSUER_WALLET,
    mintedAt: new Date().toISOString()
  };

  userTickets.push(ticket);
  MOCK_DB.ticketsByEmail[window.CURRENT_EMAIL] = userTickets;
  saveMockDb();
  window.CURRENT_TICKET = ticket;

  return ticket;
}

