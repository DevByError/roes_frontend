import {
  Building2,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "Overview" | "People" | "Community";
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "City analytics at a glance", group: "Overview" },
  { href: "/new-users", label: "New users", icon: UserPlus, description: "Who joined and when", group: "Overview" },
  { href: "/admins", label: "Admins", icon: UserCog, description: "Create, assign and freeze admins", group: "People" },
  { href: "/users", label: "Users", icon: Users, description: "Everyone registered in your city", group: "People" },
  { href: "/places", label: "Places", icon: Building2, description: "Create and manage places", group: "People" },
  { href: "/announcements", label: "Announcements", icon: Megaphone, description: "Public and private notices", group: "Community" },
  { href: "/safety", label: "Safety policies", icon: ShieldCheck, description: "Rules every resident can read", group: "Community" },
  { href: "/donations", label: "Donations", icon: HeartHandshake, description: "Campaigns for the community", group: "Community" },
  { href: "/complaints", label: "Public complaints", icon: MessageSquareWarning, description: "Messages sent to the mayor", group: "Community" },
];
