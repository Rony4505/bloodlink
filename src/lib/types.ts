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
  titleEn?: string;
  bodyEn?: string;
  titleBn?: string;
  bodyBn?: string;
  type:
    | "blood_request"
    | "daily_update"
    | "system"
    | "contact_change";
  href: string;
  postId?: string | null;
  read: boolean;
  createdAt: string;
};

export type ContactChangeRequest = {
  id: string;
  donorId: string;
  currentEmail: string;
  currentPhone: string;
  requestedEmail: string | null;
  requestedPhone: string | null;
  note: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt: string | null;
};

export type PlatformFeatureOption = {
  enabled: boolean;
  notes: string;
};

export type PlatformOptions = {
  hospitalAccess: PlatformFeatureOption;
  orgAds: PlatformFeatureOption;
  futureServices: PlatformFeatureOption;
};

export type BannerSize = "sm" | "md" | "lg" | "leaderboard" | "square";

export type BannerPage =
  | "home"
  | "find"
  | "requests"
  | "about"
  | "ambulance"
  | "all";

export type BannerPlacement = "after-hero" | "mid-content" | "before-footer";

export type OrgBanner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
  size: BannerSize;
  pages: BannerPage[];
  placement: BannerPlacement;
};

/** Empty string fields fall back to i18n dictionary defaults. */
export type SiteAppearance = {
  logoUrl: string;
  heroBackgroundUrl: string;
  brand: string;
  taglineEn: string;
  taglineBn: string;
  heroSupportEn: string;
  heroSupportBn: string;
  aboutTitleEn: string;
  aboutTitleBn: string;
  aboutBodyEn: string;
  aboutBodyBn: string;
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
  platformOptions: PlatformOptions;
  banners: OrgBanner[];
  siteAppearance: SiteAppearance;
};

export type DatabaseShape = {
  donors: Donor[];
  contactRequests: ContactRequest[];
  contactChangeRequests: ContactChangeRequest[];
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
