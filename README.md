# Nutrice — Point of Sale (POS) Progressive Web App

Nutrice is a lightweight, high-performance Progressive Web App (PWA) designed to streamline in-store operations, sales tracking, and inventory management for a retail popsicle business. Built with React and Firebase, it delivers real-time cloud synchronization, offline-first reliability, and a native-like mobile experience.

---

## Key Features

- **Real-Time Data Sync:** Live inventory tracking, order updates, and sales recording powered by Firebase Firestore.
- **Dynamic Catalog Management:** 42-item structured product catalog with inline editing and multi-tier price filtering.
- **Session & Shift Management:** Session-persistent states allowing staff to track daily cash flows, active registers, and historical sales across shifts.
- **Analytics & Daily Reporting:** Instant summaries of revenue, item turnover rates, and transaction velocity.
- **PWA & Mobile-First UX:** Standalone install capability (iOS Home Screen / Android PWA), adaptive layouts with Tailwind CSS, and custom toast notifications.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend & Database:** Firebase (Firestore, Realtime Updates)
- **Deployment & Hosting:** Vercel

---

## Project Structure

```text
nutrice-pos/
├── public/
│   ├── favicon.ico
│   ├── manifest.json          # PWA configuration
│   └── icons/                 # App launcher & PWA icons
├── src/
│   ├── assets/                # Static media and local resources
│   ├── components/            # Reusable UI elements (Modals, Toasts, Cards)
│   ├── context/               # Global state & session providers
│   ├── hooks/                 # Custom React hooks (Firebase listeners, Cart logic)
│   ├── services/              # Firebase configuration & database APIs
│   ├── utils/                 # Price calculations, formatters, and helpers
│   ├── App.jsx                # Main application component
│   └── index.jsx              # Entry point
├── tailwind.config.js
└── package.json
