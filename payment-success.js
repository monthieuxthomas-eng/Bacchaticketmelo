const messageEl = document.getElementById("message");

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#ffd0d8" : "#fff6c4";
}

async function initPaymentSuccess() {
  try {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      throw new Error("Session Stripe introuvable.");
    }

    const response = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await response.json();

    if (!response.ok || !data.paid) {
      throw new Error(data.error || "Paiement non validé.");
    }

    registerStripePaidCredit({
      sessionId: data.sessionId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      ticketType: data.ticketType,
      amountTotal: data.amountTotal,
      currency: data.currency
    });

    localStorage.removeItem("BACCHA_PENDING_PAYMENT");
    setMessage("Paiement validé. Redirection vers l’accueil...");

    setTimeout(() => {
      window.location.href = `index.html?payment=success&type=${encodeURIComponent(data.ticketType)}`;
    }, 1200);
  } catch (error) {
    setMessage(error.message || "Erreur de vérification Stripe.", true);
  }
}

initPaymentSuccess();
