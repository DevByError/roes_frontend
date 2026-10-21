"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, KeyRound, Landmark, Monitor, Moon, Palette, Sun, UserCircle2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MayorPhotoPicker } from "@/components/profile/photo-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailRow } from "@/components/domain/read-only";
import { maskId, nf } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const contactSchema = z.object({
  phone: z.string().trim().min(8, "Enter a phone number"),
  office: z.string().trim().min(4, "Enter the office address"),
});
const pwSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "Use at least 8 characters").regex(/[A-Z]/, "Include an uppercase letter").regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export default function ProfilePage() {
  const mayor = useApp((s) => s.mayor);
  const users = useApp((s) => s.users);
  const places = useApp((s) => s.places);
  const updateContact = useApp((s) => s.updateMayorContact);
  const CITY = useApp((s) => s.city);
  const changePassword = useApp((s) => s.changePassword);
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "security" || t === "preferences" ? t : "profile";
  });

  const contact = useForm({ resolver: zodResolver(contactSchema), values: { phone: mayor.phone, office: mayor.office } });
  const pw = useForm({ resolver: zodResolver(pwSchema), defaultValues: { current: "", next: "", confirm: "" } });

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile & settings" description="Your office details, security and how the console looks." />

      <Card className="bg-royal relative mb-6 overflow-hidden border-0 p-6 text-white animate-fade-up sm:p-8">
        <div className="bg-grid absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,black,transparent)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <MayorPhotoPicker />
          <div className="min-w-0 flex-1">
            <Badge className="bg-accent text-accent-foreground"><Landmark /> Mayor</Badge>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{mayor.name}</h2>
            <p className="text-sm text-white/70">Mayor of {mayor.city}{CITY.country ? `, ${CITY.country}` : ""}</p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center sm:gap-6">
            {[
              { v: nf.format(users.length), l: "Users", i: Users },
              { v: places.length, l: "Places", i: Building2 },
              { v: CITY.districts, l: "Districts", i: Landmark },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-xs text-white/60">{s.l}</dt>
                <dd className="tabular mt-1 text-2xl font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profile"><UserCircle2 /> Profile</TabsTrigger>
          <TabsTrigger value="security"><KeyRound /> Security</TabsTrigger>
          <TabsTrigger value="preferences"><Palette /> Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Office details</CardTitle>
                <CardDescription>Identity fields are set by the election commission and cannot be changed.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <DetailRow label="Full name" value={mayor.name} locked />
                <DetailRow label="National ID" value={maskId(mayor.nationalId)} locked mono />
                <DetailRow label="Email" value={mayor.email} locked />
                <DetailRow label="City" value={mayor.city} locked />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Contact</CardTitle>
                <CardDescription>Shown to admins and on public announcements.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form
                noValidate
                className="space-y-4"
                onSubmit={contact.handleSubmit(async (v) => {
                  if (await updateContact(v)) toast.success("Contact details saved");
                })}
              >
                <Field label="Phone" error={contact.formState.errors.phone?.message} htmlFor="mp-phone">
                  <Input id="mp-phone" type="tel" {...contact.register("phone")} />
                </Field>
                <Field label="Office address" error={contact.formState.errors.office?.message} htmlFor="mp-office">
                  <Input id="mp-office" {...contact.register("office")} />
                </Field>
                <Button type="submit" disabled={!contact.formState.isDirty}>Save changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>{CITY.name || "City"} at a glance</CardTitle>
                <CardDescription>Official city figures</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Population", nf.format(CITY.population)],
                ["Area", `${CITY.areaKm2} km²`],
                ["Districts", CITY.districts],
                ["Places on ROES", places.length],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="tabular mt-1 text-xl font-bold">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="max-w-xl">
            <CardHeader>
              <div>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Use a strong password you don&apos;t use anywhere else.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form
                noValidate
                className="space-y-4"
                onSubmit={pw.handleSubmit(async (v) => {
                  if (await changePassword(v.current, v.next)) {
                    toast.success("Password updated");
                    pw.reset();
                  }
                })}
              >
                <Field label="Current password" error={pw.formState.errors.current?.message} htmlFor="pw-cur">
                  <Input id="pw-cur" type="password" autoComplete="current-password" {...pw.register("current")} />
                </Field>
                <Field label="New password" error={pw.formState.errors.next?.message} htmlFor="pw-new" hint="8+ characters, one uppercase letter and one number.">
                  <Input id="pw-new" type="password" autoComplete="new-password" {...pw.register("next")} />
                </Field>
                <Field label="Confirm new password" error={pw.formState.errors.confirm?.message} htmlFor="pw-conf">
                  <Input id="pw-conf" type="password" autoComplete="new-password" {...pw.register("confirm")} />
                </Field>
                <Button type="submit" loading={pw.formState.isSubmitting}>Update password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose how ROES looks on this device.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Segmented
                value={(theme ?? "system") as "light" | "dark" | "system"}
                onChange={setTheme}
                label="Theme"
                options={[
                  { value: "light", label: "Light", icon: <Sun /> },
                  { value: "dark", label: "Dark", icon: <Moon /> },
                  { value: "system", label: "System", icon: <Monitor /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </>
  );
}
