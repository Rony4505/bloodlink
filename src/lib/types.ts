export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type Gender = "male" | "female";

export type VerifyChannel = "email" | "phone";

/** How urgent a blood-need post is — shown as Emergency on the homepage. */
export type PostUrgency = "critical" | "urgent" | "moderate";

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
  /** How many times this donor has donated (self-reported / tracked). */
  donationCount: number;
  bloodIssue: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  pendingEmailCodeHash: string | null;
  pendingPhoneCodeHash: string | null;
  pendingResetCodeHash: string | null;
  pendingResetChannel: VerifyChannel | null;
  pendingResetExpiresAt: string | null;
  /** Set when a volunteer created this donor from the portal. */
  createdByVolunteerId: string | null;
  /** How the donor was linked to a volunteer (link = self-register URL). */
  volunteerSource: "link" | "manual" | null;
  /** Manual adds need admin approval before counting as volunteer work. */
  volunteerApproved: boolean;
  /** Last successful donor login (ISO). */
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Registration held until mobile OTP is confirmed. */
export type PendingRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  district: string;
  area: string;
  lastDonationDate: string | null;
  donationCount: number;
  bloodIssue: string;
  /** Legacy dual-OTP field; unused for phone-only register. */
  emailCodeHash: string;
  phoneCodeHash: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  /** Volunteer donor-link registration attribution. */
  createdByVolunteerId: string | null;
  expiresAt: string;
  createdAt: string;
};

/** Public success-story submissions awaiting admin approval. */
export type PendingSuccessStory = {
  id: string;
  name: string;
  handle: string;
  quoteEn: string;
  quoteBn: string;
  createdAt: string;
};

export type ContactRequest = {
  id: string;
  /** donor_phone = seeker revealed a donor number; post_phone = donor unlocked a blood-need poster number */
  kind: "donor_phone" | "post_phone";
  donorId: string | null;
  postId: string | null;
  seekerName: string;
  seekerPhone: string;
  hospital: string;
  /** Logged-in account id when the seeker/viewer had a session. */
  seekerUserId: string | null;
  /** Short code for investigation / support follow-up. */
  auditCode: string;
  /** Snapshot of the person whose number was revealed. */
  targetName: string;
  targetPhone: string;
  targetBloodGroup: string;
  targetDistrict: string;
  targetArea: string;
  /** Extra investigation context (e.g. blood-post patient name). */
  contextNote: string;
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
  urgency: PostUrgency;
  createdAt: string;
};

export type SuccessStory = {
  id: string;
  name: string;
  handle: string;
  quoteEn: string;
  quoteBn: string;
  enabled: boolean;
};

export type VolunteerActivityStatus = "planned" | "in_progress" | "done";

export type Volunteer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  role: string;
  notes: string;
  /** Login username set by admin (unique, lowercase). */
  username: string;
  passwordHash: string;
  enabled: boolean;
  /** Secret token for personal join/work URLs (no public login needed). */
  linkToken: string;
  /** Allow admin push notifications to this volunteer's phone. */
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VolunteerActivity = {
  id: string;
  volunteerId: string;
  title: string;
  description: string;
  activityType: string;
  status: VolunteerActivityStatus;
  activityDate: string;
  /** Progress notes written by the volunteer. */
  volunteerNote: string;
  createdAt: string;
  updatedAt: string;
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
    | "contact_change"
    | "gold_blessing"
    | "new_donor";
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

/** Per-channel admin controls for BloodLink in-app notifications. */
export type NotificationChannelConfig = {
  enabled: boolean;
  /** Special channels (e.g. blood request) stay forced on. */
  locked: boolean;
  /** How often periodic notifications may fire (1 = every day). */
  intervalDays: number;
  /** Hour of day in Asia/Dhaka (0–23) when periodic reminders may start. */
  hourBd: number;
  notes: string;
};

export type NotificationSettings = {
  /** Always-on: every account holder when someone posts a blood need. */
  bloodRequestBroadcast: NotificationChannelConfig;
  /** Morning reminder to update last donation date. */
  dailyDonationReminder: NotificationChannelConfig;
  /** Contact change approve/decline notices. */
  contactChangeAlerts: NotificationChannelConfig;
  /** Admin one-shot announcements to all accounts. */
  systemAnnouncements: NotificationChannelConfig;
  /** Monthly emotional blessing for the current Gold/Platinum top donor. */
  monthlyGoldBlessing: NotificationChannelConfig;
};

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
};

export type BannerSize = "sm" | "md" | "lg" | "leaderboard" | "square";

export type BannerPage =
  | "home"
  | "find"
  | "requests"
  | "about"
  | "ambulance"
  | "healthcare"
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
  /** Optional portrait of the founder shown on About. */
  founderPhotoUrl: string;
  /** Official Facebook page URL shown in footer and About. */
  facebookUrl: string;
  /** Public impact / success stories shown on the homepage. */
  successStories: SuccessStory[];
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
  notificationSettings: NotificationSettings;
  banners: OrgBanner[];
  /** Seconds between auto-slides on public advertisement banners (default 3). */
  bannerSlideIntervalSec: number;
  siteAppearance: SiteAppearance;
  /** Web Push VAPID key pair (generated once and persisted). */
  vapidPublicKey: string;
  vapidPrivateKey: string;
};

export type DatabaseShape = {
  donors: Donor[];
  contactRequests: ContactRequest[];
  contactChangeRequests: ContactChangeRequest[];
  ratings: Rating[];
  posts: BloodPost[];
  notifications: AppNotification[];
  pushSubscriptions: PushSubscriptionRecord[];
  pendingRegistrations: PendingRegistration[];
  pendingSuccessStories: PendingSuccessStory[];
  volunteers: Volunteer[];
  volunteerActivities: VolunteerActivity[];
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
  donationCount: number;
  phoneMasked: string;
  bloodIssue: string;
  avgRating: number | null;
  ratingCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  verified: boolean;
};
