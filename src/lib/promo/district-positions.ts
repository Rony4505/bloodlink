import { DISTRICTS } from "@/lib/districts";

/** Approximate lon/lat → normalized 0–1 map space (Bangladesh bounds). */
const GEO: Partial<Record<string, [number, number]>> = {
  Bagerhat: [89.75, 22.66],
  Bandarban: [92.22, 22.19],
  Barguna: [90.12, 22.15],
  Barishal: [90.35, 22.7],
  Bhola: [90.65, 22.69],
  Bogura: [89.37, 24.85],
  Brahmanbaria: [91.11, 23.96],
  Chandpur: [90.65, 23.22],
  Chattogram: [91.83, 22.35],
  Chuadanga: [89.03, 23.64],
  "Cox's Bazar": [91.98, 21.44],
  Cumilla: [91.18, 23.46],
  Dhaka: [90.41, 23.81],
  Dinajpur: [88.63, 25.63],
  Faridpur: [89.84, 23.61],
  Feni: [91.41, 23.02],
  Gaibandha: [89.54, 25.33],
  Gazipur: [90.43, 24.0],
  Gopalganj: [89.82, 23.01],
  Habiganj: [91.41, 24.38],
  Jamalpur: [89.94, 24.92],
  Jashore: [89.21, 23.17],
  Jhalokathi: [90.2, 22.64],
  Jhenaidah: [89.2, 23.54],
  Joypurhat: [89.02, 25.1],
  Khagrachhari: [91.97, 23.11],
  Khulna: [89.55, 22.82],
  Kishoreganj: [90.78, 24.44],
  Kurigram: [89.66, 25.81],
  Kushtia: [89.12, 23.9],
  Lakshmipur: [90.83, 22.94],
  Lalmonirhat: [89.45, 25.92],
  Madaripur: [90.21, 23.17],
  Magura: [89.42, 23.49],
  Manikganj: [90.0, 23.86],
  Meherpur: [88.64, 23.76],
  Moulvibazar: [91.77, 24.48],
  Munshiganj: [90.53, 23.46],
  Mymensingh: [90.41, 24.75],
  Naogaon: [88.95, 24.8],
  Narail: [89.5, 23.17],
  Narayanganj: [90.57, 23.62],
  Narsingdi: [90.72, 23.92],
  Natore: [89.0, 24.41],
  Netrokona: [90.73, 24.88],
  Nilphamari: [88.85, 25.93],
  Noakhali: [91.1, 22.87],
  Pabna: [89.24, 24.0],
  Panchagarh: [88.56, 26.33],
  Patuakhali: [90.35, 22.36],
  Pirojpur: [89.98, 22.58],
  Rajbari: [89.64, 23.76],
  Rajshahi: [88.6, 24.37],
  Rangamati: [92.18, 22.65],
  Rangpur: [89.24, 25.75],
  Satkhira: [89.07, 22.71],
  Shariatpur: [90.43, 23.25],
  Sherpur: [90.02, 25.02],
  Sirajganj: [89.71, 24.45],
  Sunamganj: [91.4, 25.07],
  Sylhet: [91.87, 24.89],
  Tangail: [89.92, 24.25],
  Thakurgaon: [88.49, 26.03],
};

const LON_MIN = 88.0;
const LON_MAX = 93.0;
const LAT_MIN = 20.5;
const LAT_MAX = 26.5;

function toMap(lon: number, lat: number) {
  return {
    x: (lon - LON_MIN) / (LON_MAX - LON_MIN),
    y: 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN),
  };
}

export type DistrictPoint = { name: string; x: number; y: number };

export function getDistrictMapPoints(): DistrictPoint[] {
  return DISTRICTS.map((name, i) => {
    const geo = GEO[name];
    if (geo) {
      const { x, y } = toMap(geo[0], geo[1]);
      return { name, x, y };
    }
    const angle = (i / DISTRICTS.length) * Math.PI * 2;
    const r = 0.12 + (i % 5) * 0.03;
    return { name, x: 0.52 + Math.cos(angle) * r, y: 0.48 + Math.sin(angle) * r * 0.65 };
  });
}

/** Simplified Bangladesh outline (normalized map coords). */
export const BD_OUTLINE: [number, number][] = [
  [0.12, 0.72], [0.18, 0.55], [0.28, 0.42], [0.38, 0.35], [0.52, 0.28],
  [0.68, 0.22], [0.82, 0.28], [0.92, 0.42], [0.95, 0.58], [0.88, 0.72],
  [0.72, 0.82], [0.55, 0.88], [0.38, 0.85], [0.22, 0.78], [0.12, 0.72],
];
