# BloodLink

Free humanitarian platform to help people in Bangladesh find blood donors by blood group and location.

## Features

- Bangla / English language toggle
- Donor registration, search, ratings, blood-issue notes
- Auto availability (male 90 days, female 120 days)
- Urgent blood-need posts + account notifications
- Daily 10:00 AM (Asia/Dhaka) update reminder for logged-in users
- Editable privacy page (admin)
- Hidden owner panel at `/owner-hq-7f3m` (not linked in public UI)

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
