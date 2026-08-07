export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type Gender = "male" | "female";

export type Donor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  bloodIssue: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactRequest = {
  id: string;
  donorId: string;
  seekerName: string;
  seekerPhone: string;
  hospital: string;
  createdAt: string;
  ipHash: string;
};

export type Rating = {
  id: string;
  donorId: string;
  seekerName: string;
  seekerPhone: string;
  stars: number;
  comment: string;
  createdAt: string;
};

export type BloodPost = {
  id: string;
  posterName: string;
  posterPhone: string;
  patientName: string;
  relation: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  district: string;
  area: string;
  hospital: string;
  neededBy: string;
  message: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "blood_request" | "daily_update" | "system";
  href: string;
  postId?: string | null;
  read: boolean;
  createdAt: string;
};

export type AdminSettings = {
  username: string;
  passwordHash: string;
  verifyEmail: string;
  verifyPhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  pendingEmailCodeHash: string | null;
  pendingPhoneCodeHash: string | null;
  privacyBn: string;
  privacyEn: string;
};

export type DatabaseShape = {
  donors: Donor[];
  contactRequests: ContactRequest[];
  ratings: Rating[];
  posts: BloodPost[];
  notifications: AppNotification[];
  admin: AdminSettings;
};

export type PublicDonor = {
  id: string;
  name: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  phoneMasked: string;
  bloodIssue: string;
  avgRating: number | null;
  ratingCount: number;
};
