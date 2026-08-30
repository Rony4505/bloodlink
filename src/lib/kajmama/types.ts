export type UserRole = "worker" | "hirer";
export type JobStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "in_progress"
  | "completed"
  | "paid"
  | "cancelled";

export type MobileBankingType = "bkash" | "nagad" | "rocket" | "upay";

export type AdPlacement =
  | "home_hero"
  | "home_categories"
  | "home_premium"
  | "workers_top"
  | "workers_sidebar"
  | "profile_sidebar"
  | "jobs_top"
  | "all_pages";

export type Category = {
  id: string;
  nameBn: string;
  nameEn: string;
  blurbBn: string;
  blurbEn: string;
  icon: string;
  workerCount?: number;
};

export type PackagePlan = {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  durationDays: number;
  premium: boolean;
  featuresBn: string[];
  featuresEn: string[];
  active: boolean;
};

export type WorkerPayout = {
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  mobileBanking: string;
  mobileBankingType: MobileBankingType | "";
};

export type AdminBankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
};

export type AdminMobileAccount = {
  id: string;
  type: MobileBankingType;
  number: string;
  name: string;
};

export type Advertisement = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  ctaBn: string;
  ctaEn: string;
  placement: AdPlacement;
  active: boolean;
};

export type SupportMessage = {
  id: string;
  visitorKey: string;
  from: "visitor" | "admin";
  name: string;
  text: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  district: string;
  upazila: string;
  area: string;
  createdAt: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  jobRate: number;
  verified: boolean;
  available: boolean;
  blocked: boolean;
  packageId: string;
  packageExpiresAt: string | null;
  payout: WorkerPayout;
};

export type Job = {
  id: string;
  hirerId: string;
  workerId?: string;
  categoryId: string;
  title: string;
  description: string;
  district: string;
  upazila: string;
  area: string;
  budget: number;
  whenText: string;
  status: JobStatus;
  createdAt: string;
};

export type Booking = {
  id: string;
  jobId: string;
  hirerId: string;
  workerId: string;
  status: BookingStatus;
  price: number;
  commissionPct: number;
  siteFee: number;
  workerPayout: number;
  paidAt?: string;
  paymentMethod?: string;
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  bookingId: string;
  fromUserId: string;
  text: string;
  createdAt: string;
};

export type Review = {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  href: string;
  kind: string;
  read: boolean;
  createdAt: string;
};

export type KajmamaPushSub = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
};

export type PlatformSettings = {
  ownerPin: string;
  siteName: string;
  siteNameBn: string;
  taglineBn: string;
  taglineEn: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  contactFacebook: string;
  commissionPct: number;
  banks: AdminBankAccount[];
  mobiles: AdminMobileAccount[];
  vapidPublicKey: string;
  vapidPrivateKey: string;
};

export type KajmamaStore = {
  settings: PlatformSettings;
  categories: Category[];
  packages: PackagePlan[];
  ads: Advertisement[];
  users: User[];
  jobs: Job[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  support: SupportMessage[];
  notifications: AppNotification[];
  pushSubs: KajmamaPushSub[];
};

export type PublicUser = {
  id: string;
  name: string;
  role: UserRole;
  district: string;
  upazila: string;
  area: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  jobRate: number;
  verified: boolean;
  premium: boolean;
  packageId: string;
  packageName?: string;
  packageExpiresAt: string | null;
  available: boolean;
  createdAt: string;
  rating: number;
  reviewCount: number;
  phoneMasked: string;
  phone?: string;
};

export type SessionUser = PublicUser & {
  phone: string;
  payout?: WorkerPayout;
};

export const AD_PLACEMENTS: { id: AdPlacement; bn: string; en: string }[] = [
  { id: "home_hero", bn: "হোম — হিরোর নিচে", en: "Home — under hero" },
  { id: "home_categories", bn: "হোম — ক্যাটাগরির নিচে", en: "Home — under categories" },
  { id: "home_premium", bn: "হোম — প্রিমিয়ামের নিচে", en: "Home — under premium" },
  { id: "workers_top", bn: "কর্মী তালিকার উপরে", en: "Workers — top" },
  { id: "workers_sidebar", bn: "কর্মী তালিকা সাইডবার", en: "Workers — sidebar" },
  { id: "profile_sidebar", bn: "প্রোফাইল সাইডবার", en: "Profile sidebar" },
  { id: "jobs_top", bn: "কাজ পেজের উপরে", en: "Jobs — top" },
  { id: "all_pages", bn: "সব পেজ (উপরে)", en: "Every page — top" },
];

export const BUSY_BOOKING_STATUSES: BookingStatus[] = ["accepted", "in_progress", "completed"];
