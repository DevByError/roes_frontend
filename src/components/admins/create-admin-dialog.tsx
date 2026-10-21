"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BadgeCheck, Mail, Search, UserCog, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonCell } from "@/components/domain/person";
import { NO_PLACE, PlaceSelect, ReplaceWarning } from "./place-select";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const schema = z.object({
  name: z.string().trim().min(3, "Enter the admin's full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a phone number"),
  nationalId: z.string().trim().min(6, "Enter the national ID"),
  gender: z.enum(["Female", "Male"]),
  placeId: z.string().min(1),
});
type Values = z.infer<typeof schema>;

function NewAccount({ onDone }: { onDone: () => void }) {
  const createAdmin = useApp((s) => s.createAdmin);
  const places = useApp((s) => s.places);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", nationalId: "", gender: "Female", placeId: NO_PLACE },
  });

  const submit = async (v: Values) => {
    const created = await createAdmin({ ...v, placeId: v.placeId === NO_PLACE ? null : v.placeId });
    if (!created) return;
    const place = places.find((p) => p.id === v.placeId);
    toast.success(`${created.admin.name} is now an admin`, {
      description: `${place ? `Assigned to ${place.name}. ` : "Assign a place when ready. "}Temporary password: ${created.temporaryPassword}`,
      duration: 60000,
    });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <DialogBody className="space-y-4">
        <Field label="Full name" error={errors.name?.message} htmlFor="adm-name">
          <Input id="adm-name" placeholder="e.g. Nur Aina Binti Hassan" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email?.message} htmlFor="adm-email">
            <Input id="adm-email" type="email" placeholder="name@roes.city" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Phone" error={errors.phone?.message} htmlFor="adm-phone">
            <Input id="adm-phone" type="tel" placeholder="+60 12-345 6789" aria-invalid={!!errors.phone} {...register("phone")} />
          </Field>
          <Field label="National ID" error={errors.nationalId?.message} htmlFor="adm-nid">
            <Input id="adm-nid" placeholder="900101-14-1234" aria-invalid={!!errors.nationalId} {...register("nationalId")} />
          </Field>
          <Field label="Gender" htmlFor="adm-gender">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="adm-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <Field label="Assign to place" hint="Residential admins manage residents. Non-residential admins manage a public place." htmlFor="adm-place">
          <Controller
            control={control}
            name="placeId"
            render={({ field }) => (
              <>
                <PlaceSelect id="adm-place" value={field.value} onChange={field.onChange} allowNone />
                <ReplaceWarning placeId={watch("placeId")} />
              </>
            )}
          />
        </Field>
        <div className="flex items-start gap-2.5 rounded-xl bg-primary-soft p-3 text-[13px] text-primary">
          <Mail className="mt-0.5 size-4 shrink-0" />
          <p>The admin receives a temporary password by email and must set their own on first sign-in. Personal details cannot be edited afterwards.</p>
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" loading={isSubmitting}><UserPlus /> Create admin</Button>
      </DialogFooter>
    </form>
  );
}

function PromoteUser({ onDone }: { onDone: () => void }) {
  const users = useApp((s) => s.users);
  const places = useApp((s) => s.places);
  const promote = useApp((s) => s.promoteUser);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState(NO_PLACE);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users
      .filter((u) => u.role === "user" && u.status === "verified")
      .filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [users, q]);
  const selected = users.find((u) => u.id === userId);

  return (
    <>
      <DialogBody className="space-y-4">
        <Field label="Find a verified user" htmlFor="promo-q">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="promo-q" className="pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </Field>
        <ul className="space-y-1" role="listbox" aria-label="Users">
          {results.map((u) => {
            const active = u.id === userId;
            return (
              <li key={u.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setUserId(u.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors",
                    active ? "border-primary bg-primary-soft" : "border-transparent hover:bg-muted",
                  )}
                >
                  <PersonCell name={u.name} sub={`${places.find((p) => p.id === u.placeId)?.name} · ${u.unit}`} />
                  {active && <BadgeCheck className="size-5 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {!results.length && <li className="py-6 text-center text-sm text-muted-foreground">No verified users match.</li>}
        </ul>
        <Field label="Assign to place" htmlFor="promo-place">
          <PlaceSelect id="promo-place" value={placeId} onChange={setPlaceId} allowNone />
          <ReplaceWarning placeId={placeId} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          disabled={!selected}
          onClick={async () => {
            if (!selected) return;
            if (!(await promote(selected.id, placeId === NO_PLACE ? null : placeId))) return;
            toast.success(`${selected.name} is now an admin`, { description: "Their role was upgraded from user to admin." });
            onDone();
          }}
        >
          <UserCog /> Give admin role
        </Button>
      </DialogFooter>
    </>
  );
}

export function CreateAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add an admin" description="Create a new account or give the admin role to an existing user." className="sm:max-w-xl">
        <Tabs defaultValue="new" className="flex min-h-0 flex-1 flex-col">
          <div className="px-5 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1"><UserPlus /> New account</TabsTrigger>
              <TabsTrigger value="promote" className="flex-1"><UserCog /> Existing user</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="new" className="mt-0 flex min-h-0 flex-1 flex-col pt-2">
            <NewAccount onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="promote" className="mt-0 flex min-h-0 flex-1 flex-col pt-2">
            <PromoteUser onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
