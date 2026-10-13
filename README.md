# No Borders ASBL — Dashboard d’Administration

Dashboard SaaS d'administration moderne, accessible et performant conçu pour **No Borders ASBL** (boutique solidaire, vélos en bambou, vélos adaptés Hase Bikes, ElliptiGO, dons déductibles et gestion d'équipe).

## 🚀 Technologies

- **Framework** : [Next.js 14](https://nextjs.org/) (App Router)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styles** : [Tailwind CSS](https://tailwindcss.com/) & [daisyUI](https://daisyui.com/)
- **Typographie** : Plus Jakarta Sans (chargée via Google Fonts & `@next/font`)
- **Icônes** : [Lucide React](https://lucide.dev/)

## 📦 Fonctionnalités

- **Vue d’ensemble** : KPI financiers et d'activité, courbes de tendances SVG Bézier, donut de statut des commandes, stocks critiques.
- **Produits & Modèles Spécialisés** : Gestion du catalogue (vélos bambou, tandems/trikes adaptés, ElliptiGO, accessoires), jauges de stock, modales d'ajout/modification.
- **Gestion des Commandes** : Suivi des ventes, expéditions bpost & retraits atelier, remboursements.
- **Clients & Partenaires** : Fiches adhérents, volumes d'achats cumulés, géolocalisation.
- **Dons & Mécénat** : Suivi des dons, avancement des projets solidaires et génération des attestations fiscales (SPF Finances).
- **Contenus du Site** : Gestion des articles, événements et pages multilingues (FR / NL / EN).
- **Utilisateurs & Permissions** : Contrôle d'accès granulaire et gestion des rôles.
- **Paramètres** : Configuration des passerelles de paiement, modes de livraison, notifications et langues.

## 🛠️ Démarrage local

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement (port 3001)
npm run dev

# Vérification TypeScript
npm run typecheck

# Linting
npm run lint

# Build de production
npm run build
```

## 🌐 Déploiement sur Vercel

Le projet est entièrement optimisé et prêt pour le déploiement continu sur **Vercel** :

1. Connectez-vous à [Vercel](https://vercel.com).
2. Cliquez sur **Add New...** > **Project**.
3. Importez le dépôt GitHub `https://github.com/josuefox123/dasboard_nobordersasbl`.
4. Laissez les paramètres de build par défaut :
   - **Framework Preset** : `Next.js`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`
5. Cliquez sur **Deploy**.
