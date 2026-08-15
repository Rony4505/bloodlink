/** Catalog of volunteer work types shown in admin + portal. */

export type VolunteerTaskCategory =
  | "emergency"
  | "humanitarian"
  | "data"
  | "outreach"
  | "other";

/** Which portal module unlocks when this task type is assigned (open). */
export type VolunteerPortalModule = "donor_add" | "tasks";

export type VolunteerTaskTypeDef = {
  id: string;
  category: VolunteerTaskCategory;
  /** i18n dictionary key */
  labelKey: string;
  portal: VolunteerPortalModule;
};

export const VOLUNTEER_TASK_TYPES: VolunteerTaskTypeDef[] = [
  // Data / website
  {
    id: "donor_add",
    category: "data",
    labelKey: "volunteerTypeDonorAdd",
    portal: "donor_add",
  },
  {
    id: "donor_verify",
    category: "data",
    labelKey: "volunteerTypeDonorVerify",
    portal: "tasks",
  },
  {
    id: "data_entry",
    category: "data",
    labelKey: "volunteerTypeData",
    portal: "tasks",
  },

  // Emergency
  {
    id: "emergency_blood",
    category: "emergency",
    labelKey: "volunteerTypeEmergencyBlood",
    portal: "tasks",
  },
  {
    id: "critical_patient",
    category: "emergency",
    labelKey: "volunteerTypeCriticalPatient",
    portal: "tasks",
  },
  {
    id: "accident_response",
    category: "emergency",
    labelKey: "volunteerTypeAccident",
    portal: "tasks",
  },
  {
    id: "disaster_relief",
    category: "emergency",
    labelKey: "volunteerTypeDisaster",
    portal: "tasks",
  },
  {
    id: "mother_child",
    category: "emergency",
    labelKey: "volunteerTypeMotherChild",
    portal: "tasks",
  },
  {
    id: "night_duty",
    category: "emergency",
    labelKey: "volunteerTypeNightDuty",
    portal: "tasks",
  },
  {
    id: "plasma_seek",
    category: "emergency",
    labelKey: "volunteerTypePlasma",
    portal: "tasks",
  },

  // Humanitarian / medical
  {
    id: "hospital_liaison",
    category: "humanitarian",
    labelKey: "volunteerTypeHospital",
    portal: "tasks",
  },
  {
    id: "blood_camp",
    category: "humanitarian",
    labelKey: "volunteerTypeCamp",
    portal: "tasks",
  },
  {
    id: "thalassemia_support",
    category: "humanitarian",
    labelKey: "volunteerTypeThalassemia",
    portal: "tasks",
  },
  {
    id: "transport_help",
    category: "humanitarian",
    labelKey: "volunteerTypeTransport",
    portal: "tasks",
  },
  {
    id: "call_center",
    category: "humanitarian",
    labelKey: "volunteerTypeCallCenter",
    portal: "tasks",
  },

  // Outreach
  {
    id: "community_outreach",
    category: "outreach",
    labelKey: "volunteerTypeOutreach",
    portal: "tasks",
  },
  {
    id: "awareness_camp",
    category: "outreach",
    labelKey: "volunteerTypeAwareness",
    portal: "tasks",
  },
  {
    id: "social_media",
    category: "outreach",
    labelKey: "volunteerTypeSocial",
    portal: "tasks",
  },

  {
    id: "other",
    category: "other",
    labelKey: "volunteerTypeOther",
    portal: "tasks",
  },
];

export const VOLUNTEER_TASK_TYPE_IDS = VOLUNTEER_TASK_TYPES.map((t) => t.id);

export function getVolunteerTaskType(id: string): VolunteerTaskTypeDef {
  return (
    VOLUNTEER_TASK_TYPES.find((t) => t.id === id) ||
    VOLUNTEER_TASK_TYPES[VOLUNTEER_TASK_TYPES.length - 1]
  );
}

export function volunteerHasOpenModule(
  activities: { activityType: string; status: string }[],
  module: VolunteerPortalModule,
): boolean {
  return activities.some((a) => {
    if (a.status === "done") return false;
    return getVolunteerTaskType(a.activityType).portal === module;
  });
}

export function groupActivitiesByCategory<
  T extends { activityType: string },
>(activities: T[]): Record<VolunteerTaskCategory, T[]> {
  const groups: Record<VolunteerTaskCategory, T[]> = {
    emergency: [],
    humanitarian: [],
    data: [],
    outreach: [],
    other: [],
  };
  for (const a of activities) {
    groups[getVolunteerTaskType(a.activityType).category].push(a);
  }
  return groups;
}
