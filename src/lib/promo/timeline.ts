/** Cinematic promo timeline — 40 seconds, 8 scenes. */
export const PROMO_DURATION = 40;

export type PromoSceneId =
  | "emergency"
  | "problem"
  | "brand"
  | "donor"
  | "find"
  | "request"
  | "ambulance"
  | "finale";

export type PromoScene = {
  id: PromoSceneId;
  start: number;
  end: number;
  titleBn: string;
  titleEn?: string;
  linesBn: string[];
  linesEn?: string[];
};

export const PROMO_SCENES: PromoScene[] = [
  {
    id: "emergency",
    start: 0,
    end: 5,
    titleBn: "কখনো কখনো…",
    linesBn: ["এক ব্যাগ রক্তই হয়ে ওঠে", "একটি জীবনের শেষ আশা।"],
    linesEn: ["Sometimes one bag of blood", "becomes a life's last hope."],
  },
  {
    id: "problem",
    start: 5,
    end: 10,
    titleBn: "",
    linesBn: [
      "জরুরি সময়ে সঠিক রক্তদাতা খুঁজে পাওয়া",
      "সবসময় সহজ নয়।",
    ],
    linesEn: ["Finding the right donor in an emergency", "is not always easy."],
  },
  {
    id: "brand",
    start: 10,
    end: 15,
    titleBn: "Blood Link BD",
    linesBn: ["রক্তের প্রয়োজনে, মানুষের পাশে।"],
    linesEn: ["Connect. Donate. Save a Life."],
  },
  {
    id: "donor",
    start: 15,
    end: 20,
    titleBn: "আপনি রক্তদাতা?",
    linesBn: [
      "আপনার রক্তের গ্রুপ ও অবস্থান যুক্ত করুন",
      "Blood Link-এ।",
    ],
    linesEn: ["Register your blood group and district", "on Blood Link BD."],
  },
  {
    id: "find",
    start: 20,
    end: 25,
    titleBn: "রক্ত প্রয়োজন?",
    linesBn: [
      "রক্তের গ্রুপ ও জেলা অনুযায়ী",
      "খুঁজে নিন সম্ভাব্য রক্তদাতা।",
    ],
    linesEn: ["Search for potential donors", "by blood group and district."],
  },
  {
    id: "request",
    start: 25,
    end: 30,
    titleBn: "জরুরি রক্ত প্রয়োজন?",
    linesBn: [
      "একটি পোস্টের মাধ্যমে পৌঁছে দিন",
      "আপনার প্রয়োজনের খবর।",
    ],
    linesEn: ["Post an emergency request", "to reach donors quickly."],
  },
  {
    id: "ambulance",
    start: 30,
    end: 34,
    titleBn: "",
    linesBn: [
      "রক্তের পাশাপাশি,",
      "দেশের ৬৪ জেলার",
      "Ambulance Service Information।",
    ],
    linesEn: ["Ambulance service information", "for all 64 districts."],
  },
  {
    id: "finale",
    start: 34,
    end: 40,
    titleBn: "রক্তের প্রয়োজনে, মানুষের পাশে।",
    linesBn: ["Donate Blood. Find Blood. Save Lives.", "bloodlinkbd.org"],
    linesEn: ["Blood Link BD", "bloodlinkbd.org"],
  },
];

export function getSceneAtTime(t: number): PromoScene {
  const clamped = Math.max(0, Math.min(PROMO_DURATION, t));
  for (const scene of PROMO_SCENES) {
    if (clamped >= scene.start && clamped < scene.end) return scene;
  }
  return PROMO_SCENES[PROMO_SCENES.length - 1];
}

export function sceneProgress(t: number, scene: PromoScene): number {
  return Math.max(0, Math.min(1, (t - scene.start) / (scene.end - scene.start)));
}
