const ticketSection = document.getElementById("ticketSection");
const emptySection = document.getElementById("emptySection");
const messageEl = document.getElementById("message");

const ticketFirstNameEl = document.getElementById("ticketFirstName");
const ticketLastNameEl = document.getElementById("ticketLastName");
const ticketEmailEl = document.getElementById("ticketEmail");
const ticketIdEl = document.getElementById("ticketId");
const ticketTypeEl = document.getElementById("ticketType");
const ticketWalletEl = document.getElementById("ticketWallet");
const ticketCountEl = document.getElementById("ticketCount");
const ticketsListEl = document.getElementById("ticketsList");

const downloadPngBtn = document.getElementById("downloadPngBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");

let currentTicketData = null;

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#ffd0d8" : "#fff6c4";
}

function buildTicketPayload(ticket) {
  return {
    firstName: ticket.firstName || "",
    lastName: ticket.lastName || "",
    ticketId: ticket.ticketId,
    ticketType: ticket.ticketType || "normal",
    wallet: ticket.wallet,
    event: "Baccha Festival"
  };
}

function formatTicketType(type) {
  return type === "vip" ? "VIP" : "Normal";
}

function renderTicketsList(tickets) {
  const count = tickets.length;
  ticketCountEl.textContent = `${count} ticket${count > 1 ? "s" : ""}`;

  if (!count) {
    ticketsListEl.innerHTML = "<p class='helper-text'>Aucun ticket.</p>";
    return;
  }

  ticketsListEl.innerHTML = tickets
    .map(
      (ticket) =>
        `<div class="ticket-row"><span>${ticket.ticketId}</span><strong>${formatTicketType(ticket.ticketType)}</strong></div>`
    )
    .join("");
}

function renderTicket(ticket) {
  if (!ticket) {
    ticketSection.classList.add("hidden");
    emptySection.classList.remove("hidden");
    return;
  }

  ticketFirstNameEl.textContent = ticket.firstName || "-";
  ticketLastNameEl.textContent = ticket.lastName || "-";
  ticketEmailEl.textContent = ticket.holderEmail || "-";
  ticketIdEl.textContent = ticket.ticketId;
  ticketTypeEl.textContent = formatTicketType(ticket.ticketType);
  ticketWalletEl.textContent = ticket.wallet;

  currentTicketData = buildTicketPayload(ticket);
  generateQRCode(JSON.stringify(currentTicketData));

  emptySection.classList.add("hidden");
  ticketSection.classList.remove("hidden");
}

function downloadBlob(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function onDownloadQr() {
  const qrContainer = document.getElementById("qrcode");
  const qrCanvas = qrContainer ? qrContainer.querySelector("canvas") : null;
  const qrImage = qrContainer ? qrContainer.querySelector("img") : null;

  if (qrCanvas) {
    const pngUrl = qrCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `baccha-ticket-${Date.now()}.png`;
    link.click();
    setMessage("QR téléchargé (PNG).");
    return;
  }

  if (qrImage) {
    const link = document.createElement("a");
    link.href = qrImage.src;
    link.download = `baccha-ticket-${Date.now()}.png`;
    link.click();
    setMessage("QR téléchargé (PNG).");
    return;
  }

  setMessage("QR indisponible pour le téléchargement.", true);
}

function onDownloadJson() {
  if (!currentTicketData) {
    setMessage("Aucun ticket à télécharger.", true);
    return;
  }

  downloadBlob(
    `baccha-ticket-${currentTicketData.ticketId}.json`,
    "application/json;charset=utf-8",
    JSON.stringify(currentTicketData, null, 2)
  );

  setMessage("Ticket téléchargé (JSON).");
}

async function initTicketPage() {
  initDynamic();

  const ticket = await getUserTicket();
  const tickets = typeof getUserTickets === "function" ? await getUserTickets() : ticket ? [ticket] : [];
  renderTicket(ticket);
  renderTicketsList(tickets);

  downloadPngBtn.addEventListener("click", onDownloadQr);
  downloadJsonBtn.addEventListener("click", onDownloadJson);
}

initTicketPage();
