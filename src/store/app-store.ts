"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { ApiError, api, errorMessage, setUnauthorizedHandler, tokenStore } from "@/lib/api";
import type {
  ActivityItem,
  Admin,
  Announcement,
  City,
  Complaint,
  ComplaintStatus,
  DonationPost,
  Mayor,
  Place,
  ResidentUser,
  SafetyPolicy,
} from "@/lib/types";

const SEEN_KEY = "roes-mayor-activity-seen";

export type NewPlaceInput = Pick<Place, "name" | "kind" | "category" | "district" | "address" | "lat" | "lng" | "description"> & {
  adminId?: string | null;
};

export interface NewAdminInput {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  gender: "Female" | "Male";
  placeId: string | null;
}

interface Snapshot {
  city: City;
  mayor: Mayor;
  admins: Admin[];
  users: ResidentUser[];
  places: Place[];
  announcements: Announcement[];
  policies: SafetyPolicy[];
  donations: DonationPost[];
  complaints: Complaint[];
  activity: ActivityItem[];
}

interface AppState extends Snapshot {
  hydrated: boolean;
  session: { email: string } | null;
  unreadActivity: number;

  init: () => Promise<void>;
  refresh: () => Promise<ActivityItem[]>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  changePassword: (current: string, next: string) => Promise<boolean>;

  createAdmin: (input: NewAdminInput) => Promise<{ admin: Admin; temporaryPassword: string } | null>;
  promoteUser: (userId: string, placeId: string | null) => Promise<boolean>;
  assignAdminPlace: (adminId: string, placeId: string | null) => Promise<boolean>;
  setAdminFrozen: (adminId: string, frozen: boolean, reason?: string) => Promise<boolean>;

  addPlace: (p: NewPlaceInput) => Promise<boolean>;
  updatePlace: (id: string, p: Partial<NewPlaceInput>) => Promise<boolean>;
  removePlace: (id: string) => Promise<boolean>;

  addPolicy: (p: Omit<SafetyPolicy, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updatePolicy: (id: string, p: Partial<Omit<SafetyPolicy, "id" | "createdAt">>) => Promise<boolean>;
  removePolicy: (id: string) => Promise<boolean>;

  addDonation: (d: Pick<DonationPost, "title" | "category" | "description" | "goal" | "deadline" | "image">) => Promise<boolean>;
  updateDonation: (id: string, d: Partial<DonationPost>) => Promise<boolean>;

  addAnnouncement: (a: { title: string; body: string; pinned?: boolean }) => Promise<boolean>;
  removeAnnouncement: (id: string) => Promise<boolean>;

  replyComplaint: (id: string, text: string) => Promise<boolean>;
  setComplaintStatus: (id: string, status: ComplaintStatus) => Promise<boolean>;
  markComplaintRead: (id: string) => Promise<void>;

  clearUnread: () => void;
  updateMayorContact: (c: { phone: string; office: string }) => Promise<boolean>;
  setMayorPhoto: (photo?: string) => Promise<boolean>;
}

const emptyMayor: Mayor = { id: "", name: "", email: "", phone: "", nationalId: "", city: "", office: "" };
const emptyCity: City = { name: "", country: "", population: 0, areaKm2: 0, districts: 0, center: [3.1478, 101.6953] };

const empty = (): Snapshot => ({
  city: emptyCity,
  mayor: emptyMayor,
  admins: [],
  users: [],
  places: [],
  announcements: [],
  policies: [],
  donations: [],
  complaints: [],
  activity: [],
});

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
};
const unreadCount = (activity: ActivityItem[]) => {
  const seen = readSeen();
  return seen ? activity.filter((a) => a.at > seen).length : 0;
};

export const useApp = create<AppState>()((set, get) => {
  const apply = (snap: Snapshot) => set({ ...snap, unreadActivity: unreadCount(snap.activity) });

  const load = async () => {
    const snap = await api<Snapshot>("GET", "/mayor/sync");
    apply(snap);
    return snap;
  };

  const act = async (fn: () => Promise<unknown>, opts: { silent?: boolean } = {}) => {
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      if (!opts.silent) toast.error(errorMessage(e));
      if (!(e instanceof ApiError && e.status === 0)) await load().catch(() => undefined);
      return false;
    }
  };

  setUnauthorizedHandler(() => {
    tokenStore.set(null);
    set({ ...empty(), session: null, unreadActivity: 0 });
  });

  return {
    hydrated: false,
    session: null,
    unreadActivity: 0,
    ...empty(),

    init: async () => {
      if (!tokenStore.get()) return set({ hydrated: true });
      try {
        const snap = await load();
        set({ session: { email: snap.mayor.email }, hydrated: true });
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) {
          set({ hydrated: true });
          toast.error(e.message);
          return;
        }
        tokenStore.set(null);
        set({ hydrated: true, session: null });
      }
    },

    refresh: async () => {
      const before = new Set(get().activity.map((a) => a.id));
      try {
        const snap = await load();
        return snap.activity.filter((a) => !before.has(a.id));
      } catch {
        return [];
      }
    },

    login: async (email, password) => {
      try {
        const r = await api<{ token: string; role: string }>("POST", "/auth/login", { email, password });
        if (r.role !== "mayor") return "This website is for the mayor's office only. Admins and residents use the mobile app.";
        tokenStore.set(r.token);
        const snap = await load();
        set({ session: { email: snap.mayor.email } });
        return null;
      } catch (e) {
        tokenStore.set(null);
        return errorMessage(e);
      }
    },

    logout: () => {
      tokenStore.set(null);
      set({ ...empty(), session: null, unreadActivity: 0 });
    },

    changePassword: async (current, next) => {
      try {
        await api("POST", "/auth/password", { current, next });
        return true;
      } catch (e) {
        toast.error(errorMessage(e));
        return false;
      }
    },

    createAdmin: async (input) => {
      try {
        const r = await api<{ admin: Admin; temporaryPassword: string }>("POST", "/mayor/admins", input);
        await load();
        return r;
      } catch (e) {
        toast.error(errorMessage(e));
        return null;
      }
    },
    promoteUser: (userId, placeId) => act(() => api("POST", "/mayor/admins/promote", { userId, placeId })),
    assignAdminPlace: (adminId, placeId) => act(() => api("PATCH", `/mayor/admins/${adminId}/place`, { placeId })),
    setAdminFrozen: (adminId, frozen, reason) => act(() => api("POST", `/mayor/admins/${adminId}/freeze`, { frozen, reason })),

    addPlace: (p) => act(() => api("POST", "/mayor/places", p)),
    updatePlace: (id, p) => {
      const { adminId: _adminId, kind: _kind, ...fields } = p;
      void _adminId;
      void _kind;
      return act(() => api("PATCH", `/mayor/places/${id}`, fields));
    },
    removePlace: (id) => act(() => api("DELETE", `/mayor/places/${id}`)),

    addPolicy: (p) => act(() => api("POST", "/mayor/policies", p)),
    updatePolicy: (id, p) => act(() => api("PATCH", `/mayor/policies/${id}`, p)),
    removePolicy: (id) => act(() => api("DELETE", `/mayor/policies/${id}`)),

    addDonation: (d) => act(() => api("POST", "/mayor/donations", { ...d, image: d.image ?? null })),
    updateDonation: (id, d) => {
      const { image, ...rest } = d;
      const payload: Record<string, unknown> = { ...rest };
      if ("image" in d) payload.image = image ?? null;
      for (const k of ["id", "raised", "donors", "tone", "createdAt"]) delete payload[k];
      return act(() => api("PATCH", `/mayor/donations/${id}`, payload));
    },

    addAnnouncement: (a) => act(() => api("POST", "/mayor/announcements", a)),
    removeAnnouncement: (id) => act(() => api("DELETE", `/mayor/announcements/${id}`)),

    replyComplaint: (id, text) => act(() => api("POST", `/mayor/complaints/${id}/reply`, { text })),
    setComplaintStatus: (id, status) => act(() => api("POST", `/mayor/complaints/${id}/status`, { status })),
    markComplaintRead: async (id) => {
      set((s) => ({ complaints: s.complaints.map((c) => (c.id === id ? { ...c, unread: false } : c)) }));
      await api("POST", `/mayor/complaints/${id}/read`).catch(() => undefined);
    },

    clearUnread: () => {
      const latest = get().activity[0]?.at;
      try {
        if (latest) localStorage.setItem(SEEN_KEY, latest);
      } catch {
        void 0;
      }
      set({ unreadActivity: 0 });
    },
    updateMayorContact: (c) => act(() => api("PATCH", "/mayor/profile", c)),
    setMayorPhoto: (photo) => act(() => api("PUT", "/mayor/profile/photo", { photo: photo ?? null })),
  };
});
