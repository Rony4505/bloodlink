export type UserRole = "worker" | "hirer";
export type JobStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Category = {
  id: string;
  nameBn: string;
  nameEn: string;
  blurbBn: string;
  blurbEn: string;
  icon: string;
  workerCount?: number;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  district: string;
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
};

export type Job = {
  id: string;
  hirerId: string;
  workerId?: string;
  categoryId: string;
  title: string;
  description: string;
  district: string;
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

export type PlatformSettings = {
  ownerPin: string;
  siteName: string;
  siteNameBn: string;
  taglineBn: string;
  taglineEn: string;
  contactPhone: string;
  commissionPct: number;
};

export type KajmamaStore = {
  settings: PlatformSettings;
  users: User[];
  jobs: Job[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
};

export type PublicUser = {
  id: string;
  name: string;
  role: UserRole;
  district: string;
  area: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  jobRate: number;
  verified: boolean;
  available: boolean;
  createdAt: string;
  rating: number;
  reviewCount: number;
  phoneMasked: string;
  phone?: string;
};

export type SessionUser = PublicUser & {
  phone: string;
};
