# BloodLink

Free humanitarian platform to help people in Bangladesh find blood donors by blood group and location.

> **Mudi POS (মুদি POS):** This repo also contains a grocery store POS at **`/pos`**.  
> See **[MUDI_POS.md](./MUDI_POS.md)** for full docs. Run `npm run dev` → `http://localhost:3000/pos`

> **PitchLive (Cricket):** Live cricket score + video rental at **`/cricket`**.  
> See **[CRICKET_LIVE.md](./CRICKET_LIVE.md)**. Demo: `/cricket/t/demo` (PIN `1234`).

## Features

- Bangla / English language toggle
- Donor registration, search, ratings, blood-issue notes
- Auto availability (male 90 days, female 120 days)
- Urgent blood-need posts + account notifications
- Daily 10:00 AM (Asia/Dhaka) update reminder for logged-in users
- Editable privacy page (admin)
- Hidden owner panel at `/bloodlinkbd.admin.rony4505` (not linked in public UI)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env` and set a strong `AUTH_SECRET` before deploying.

## Security notes

- Passwords are hashed with bcrypt
- Sessions use signed httpOnly cookies
- Donor phones stay masked in public search
- Contact reveal requires seeker name, phone, and hospital/place
- Local donor data is stored in `/data` (gitignored)
