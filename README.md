# Baccha Festival Ticketing

Ce projet permet de générer des tickets SBT (Soulbound Token) pour le Baccha Festival, avec paiement Stripe, email, nom/prénom, et wallet Dynamic.

## Fonctionnalités
- Mint de tickets SBT (non transférables)
- Plusieurs types de tickets : Normal (1€), VIP (110€)
- Paiement sécurisé via Stripe Checkout
- Authentification par email, nom, prénom
- Un wallet unique pour tous les tickets
- QR code pour chaque ticket
- Déploiement optimisé pour Vercel

## Installation
1. Cloner le repo :
   ```
   git clone <URL_NOUVEAU_REPO>
   cd BacchaTicket
   ```
2. Installer les dépendances :
   ```
   npm install
   ```
3. Configurer Stripe dans `.env` :
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   BASE_URL=https://<ton-url-vercel>
   ```
4. Déployer sur Vercel (tous les assets sont prêts)

## Déploiement Vercel
- Assure-toi que les routes dans `vercel.json` ne redirigent pas tout vers `index.html`.
- Les assets CSS/JS sont en chemin absolu (`/style.css`, etc.)
- Les endpoints Stripe sont dans `/api/`

## Problèmes connus
- Si le site s'affiche en noir/blanc, vérifie que `/style.css` est bien servi (pas redirigé).
- Si le paiement ne fonctionne pas, vérifie les clés Stripe et le BASE_URL.

## Licence
MIT
