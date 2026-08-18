# PitchLive — Cricket Live Score (রেন্ট)

**ক্লাব/টুর্নামেন্টের জন্য লাইভ ক্রিকেট স্কোর + ভিডিও প্ল্যাটফর্ম**

| | |
|---|---|
| **URL** | `/cricket` → `http://localhost:3000/cricket` |
| **ডেমো ক্লাব** | `/cricket/t/demo` (পিন `1234`) |
| **রেন্ট অ্যাডমিন** | `/cricket/admin` (ওনার পিন `4505`) |
| **ডেটা** | `data/cricket-store.json` (সার্ভার ফাইল) |

---

## এজেন্টদের জন্য

ইউজার **PitchLive / cricket score / লাইভ স্কোর** চাইলে:

1. এই ফাইল ও `cricket-live.project.json` পড়ুন
2. কোড **`src/lib/cricket/`** ও **`src/components/cricket/`** — অন্য অ্যাপ থেকে আলাদা রাখুন
3. রুট **`/cricket`**
4. নতুন ফিচার হলে এই ডক আপডেট করুন

---

## ফিচার

### দর্শক
- লাইভ স্ট্রিমের **নিচে TV-স্টাইল স্কোর লাইন** (international match এর মতো)
- **No ball** হলে স্কোরলাইনে অটো **FREE HIT** দেখায় (পরের লিগ্যাল বল পর্যন্ত)
- স্ট্রিমের **ভিতরে on-video গ্রাফিক্স** — Batter / Bowler / Partnership / Team Batting / Bowling / Teams / **Player vs Teams** / **Next match schedule**
- auto refresh ~2s
- YouTube / Facebook Live ভিডিও embed
- স্কোরকার্ড + কমেন্টারি
- শেয়ারযোগ্য ম্যাচ লিংক

### স্কোরার
- বড় বাটন: `0 1 2 3 4 6 W WD NB Bye LB`
- Undo last ball
- স্ট্রাইকার / নন-স্ট্রাইক / বোলার নাম
- **টিম লিস্ট / প্রিন্ট** — ম্যাচের আগে ১১ জন + রোল; **blank print**-এ নাম ও রোল দুটোই ফাঁকা
- **স্ট্রিম গ্রাফিক্স** — Batting XI, Bowling, যেকোনো প্লেয়ার, **দল অনুযায়ী পারফরম্যান্স**, **next match**
- ক্রিকেট রুলস: ওভার শেষে স্ট্রাইক চেঞ্জ, উইকেটে নতুন ব্যাটার, no-ball → free hit
- প্লেয়ার পারফরম্যান্স হিস্ট্রি সেভ (পরে দেখা যায়)
- **টুর্নামেন্ট stats** — player-wise ও team-wise রিপোর্ট (প্রিন্ট)
- ২য় ইনিংস + টার্গেট
- ভিডিও লিংক সেট + ম্যাচ লাইভ/শেষ
- নতুন ম্যাচে **scheduled time** (স্ট্রিম শিডিউল গ্রাফিক্সের জন্য)

### রেন্ট (ওনার)
- ক্লাব/টেন্যান্ট তৈরি (slug + পিন + প্ল্যান)
- মেয়াদ বাড়ানো, চালু/বন্ধ
- প্রতি ক্লাব আলাদা পাবলিক লিংক

---

## ফাইল মানচিত্র

```
src/app/cricket/...
src/app/api/cricket/...
src/components/cricket/
src/lib/cricket/
CRICKET_LIVE.md
cricket-live.project.json
public/cricket-mockups/
```
