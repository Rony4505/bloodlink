import { DISTRICTS } from "./districts";

export type AmbulanceType = "government" | "non_government";

export type AmbulanceEntry = {
  id: string;
  district: string;
  name: string;
  type: AmbulanceType;
  phone: string;
  note?: string;
};

export const NATIONAL_AMBULANCES: AmbulanceEntry[] = [
  {
    id: "nat-999",
    district: "",
    name: "National Emergency Service",
    type: "government",
    phone: "999",
    note: "Police, Fire, Ambulance — Bangladesh",
  },
  {
    id: "nat-16263",
    district: "",
    name: "National Health Helpline",
    type: "government",
    phone: "16263",
    note: "Health information and emergency guidance",
  },
  {
    id: "nat-redcrescent",
    district: "",
    name: "Bangladesh Red Crescent Society",
    type: "non_government",
    phone: "01811458825",
    note: "National Red Crescent ambulance coordination",
  },
];

function slug(district: string) {
  return district.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export const DISTRICT_AMBULANCES: AmbulanceEntry[] = DISTRICTS.flatMap(
  (district) => {
    const s = slug(district);
    return [
      {
        id: `${s}-gov-1`,
        district,
        name: `${district} District Hospital / Civil Surgeon Ambulance`,
        type: "government" as const,
        phone: "999",
        note: "Ask for district hospital ambulance via national emergency 999",
      },
      {
        id: `${s}-ngo-1`,
        district,
        name: `${district} Red Crescent / Private Ambulance`,
        type: "non_government" as const,
        phone: "999",
        note: "Local Red Crescent unit or private ambulance — confirm locally",
      },
    ];
  },
);

export function listAmbulances(district?: string): AmbulanceEntry[] {
  if (!district) {
    return [...NATIONAL_AMBULANCES, ...DISTRICT_AMBULANCES];
  }
  const local = DISTRICT_AMBULANCES.filter(
    (a) => a.district.toLowerCase() === district.toLowerCase(),
  );
  return [...NATIONAL_AMBULANCES, ...local];
}
