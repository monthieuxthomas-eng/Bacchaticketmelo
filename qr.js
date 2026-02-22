function generateQRCode(text) {
  const target = document.getElementById("qrcode");
  if (!target) return;

  // Nettoie le précédent QR avant de regénérer
  target.innerHTML = "";

  // qrcode.js global (chargé depuis CDN dans index.html)
  new QRCode(target, {
    text,
    width: 180,
    height: 180,
    colorDark: "#111111",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}
