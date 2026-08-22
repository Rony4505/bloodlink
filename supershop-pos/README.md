# LOOM — Supershop & Clothing POS

Point-of-sale web app for clothing shops and supershops. Built with Next.js 16.

## Features

- PIN login / till lock
- POS terminal with search, categories, size & color variants
- Cart, discount, cash / card / bKash / Nagad checkout
- Product & inventory management
- Sales history + printable receipt
- Dashboard (today revenue, low stock, recent sales)
- Shop settings (name, address, currency, PIN)

## Quick start

```bash
cd supershop-pos
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo PIN:** `1234`

## Notes

- Data is stored in `supershop-pos/data/store.json` (created on first run).
- Change `AUTH_SECRET` in production (see `.env.example`).
- Seed catalog includes clothing + grocery sample SKUs (BDT).
