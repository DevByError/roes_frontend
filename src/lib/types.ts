export type PlaceKind = "residential" | "non-residential";

export interface City {
  name: string;
  country: string;
  population: number;
  areaKm2: number;
  districts: number;
  center: [number, number];
}

export interface Mayor {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  city: string;
  office: string;
  photo?: string;
}

export interface HouseRule {
  id: string;
  title: string;
  text: string;
}

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  category: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  adminId: string | null;
  description: string;
  houseRules: { residents: HouseRule[]; visitors: HouseRule[] };
  createdAt: string;
}

export type AdminStatus = "active" | "frozen";

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  gender: "Female" | "Male";
  placeId: string | null;
  status: AdminStatus;
  frozenReason?: string;
  frozenAt?: string;
  promotedFromUserId?: string;
  createdAt: string;
  lastActiveAt: string;
}

export type UserStatus = "verified" | "pending" | "frozen";

export interface ResidentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  gender: "Female" | "Male";
  placeId: string;
  unit: string;
  status: UserStatus;
  role: "user" | "admin";
  joinedAt: string;
  lastActiveAt: string;
  reportsCount: number;
}

export type Audience = "public" | "private";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  author: { kind: "mayor" | "admin"; name: string };
  placeId: string | null;
  createdAt: string;
  views: number;
  pinned?: boolean;
}

export type PolicySeverity = "info" | "important" | "critical";

export interface SafetyPolicy {
  id: string;
  title: string;
  category: string;
  severity: PolicySeverity;
  summary: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationPost {
  id: string;
  title: string;
  category: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  deadline: string;
  status: "active" | "closed";
  tone: number;
  image?: string;
  createdAt: string;
}

export type ComplaintStatus = "new" | "in_review" | "resolved" | "rejected";

export interface ComplaintMessage {
  id: string;
  from: "user" | "mayor";
  text: string;
  at: string;
}

export interface Complaint {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: ComplaintStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: ComplaintMessage[];
  unread: boolean;
}

export interface ActivityItem {
  id: string;
  kind: "user" | "complaint" | "admin" | "donation" | "policy" | "announcement";
  text: string;
  at: string;
}
