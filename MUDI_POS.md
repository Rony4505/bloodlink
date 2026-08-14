# Mudi POS (মুদি POS)

**বাংলাদেশের মুদি দোকানের সহজ Point of Sale সিস্টেম**

| | |
|---|---|
| **URL** | `/pos` → `http://localhost:3000/pos` |
| **চালু** | `npm install && npm run dev` |
| **ডেটা** | ব্রাউজার `localStorage` (`mudidokan-pos-v2`) |
| **অ্যাডমিন পাস** | `1234` (পণ্য + হিসাব ট্যাব) |

---

## এজেন্টদের জন্য (Agents)

যদি ইউজার **Mudi POS / মুদি POS / mudi pos** চায়:

1. **এই ফাইল (`MUDI_POS.md`) ও `mudi-pos.project.json` পড়ুন**
2. কোড **`src/lib/mudidokan/`** ও **`src/components/mudidokan/`** — BloodLink/Fashion থেকে আলাদা
3. রুট **`/pos`** — `src/app/pos/page.tsx`
4. নতুন ফিচার যোগ করলে এই ডক আপডেট করুন

**মanifest:** `mudi-pos.project.json`

---

## ফিচার

### বিক্রি (`/pos` — বিক্রি ট্যাব)
- রঙিন পণ্য বাটন (বাংলা নাম)
- **ওজন লিখুন** (গ্রাম) → কেজি/লিটার পণ্যের দাম
- USB ওজন মেশিন (Web Serial) + ম্যানুয়াল
- ওজন পণ্য যোগ হলে **ওজন অটো ০**
- বারকোড স্ক্যান / ম্যানুয়াল কোড
- **পণ্য সিলেক্ট** প্যানেল (ফিক্সড ২৮০px, scroll)
  - নাম · দাম · Wt/Pcs · মোট · **× মুছুন**
  - **Cart · Total** → বিক্রি সম্পন্ন modal
- বাকি (due) + গ্রাহক নাম

### পণ্য (🔒 পাসওয়ার্ড)
- যোগ / **এডিট** / মুছুন
- একই নামে **warning**
- বিক্রয় দাম, ক্রয় দাম (লাভ), ইউনিট, রঙ, বারকোড

### হিসাব (🔒 পাসওয়ার্ড)
- তারিখ বেছে বিক্রি / পণ্য / লাভ / বাকি সংগ্রহ
- ইনভয়েস ক্লিক → বিস্তারিত + প্রিন্ট + বাকি সংগ্রহ

---

## ফাইল মানচিত্র

```
src/app/pos/page.tsx              # Route
src/components/mudidokan/
  MudidokanPos.tsx                # Main UI
  ProductCartPanel.tsx            # Fixed cart panel
  DigitalScale.tsx                # Weight display + input
  CheckoutModal.tsx               # বিক্রি সম্পন্ন
  InvoiceDetailsModal.tsx         # Invoice popup
  PosLockModal.tsx                # Password lock
  ReceiptContent.tsx              # Print receipt
src/lib/mudidokan/
  types.ts                        # Product, Sale, CartLine...
  storage.ts                      # localStorage CRUD
  seed.ts                         # Default products
  format.ts                       # ৳ formatting, line totals
  units.ts                        # kg/gram helpers
  use-weight-scale.ts             # Serial scale hook
mudi-pos.project.json             # Project manifest (agents)
MUDI_POS.md                       # This file
```

---

## ডেটা মডেল (সংক্ষেপ)

- **Product:** `name`, `price`, `cost`, `unit`, `color`, `barcode?`
- **Sale:** `invoiceNo`, `items`, `total`, `paid`, `due`, `collections[]`
- **localStorage key:** `mudidokan-pos-v2` (v1 থেকে auto migrate)

---

## ডিপ্লয় নোট

- POS শুধু client-side — Postgres/LBloodLink দরকার নেই
- যেকোনো Next.js deploy-এ `/pos` খুললেই চলবে
- Fashion/BloodLink middleware POS ব্লক করে না

---

## ইউজারকে দিতে (Quick start)

```bash
npm install
npm run dev
```

ব্রাউজার: **http://localhost:3000/pos**
