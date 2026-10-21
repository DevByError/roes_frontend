"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KindBadge } from "@/components/domain/badges";
import { LocationPicker } from "@/components/places/location-picker";
import { MAP_BOUNDS } from "@/lib/map-config";
import { useApp } from "@/store/app-store";
import type { Place } from "@/lib/types";

export const CATEGORIES = {
  residential: ["Condominium", "Apartment", "Landed community", "Gated community", "Flats"],
  "non-residential": ["Shopping mall", "Hospital", "Transport hub", "Culture", "Park", "Market", "School", "Government office", "Place of worship", "Sports facility"],
} as const;

const [[S, W], [N, E]] = MAP_BOUNDS;
const NO_ADMIN = "none";

const schema = z.object({
  name: z.string().trim().min(3, "Enter the place name"),
  kind: z.enum(["residential", "non-residential"]),
  category: z.string().min(1, "Choose a category"),
  district: z.string().trim().min(2, "Enter the district"),
  address: z.string().trim().min(6, "Enter the street address"),
  description: z.string().trim().min(10, "Add a short description (10+ characters)"),
  lat: z.number({ error: "Enter a latitude" }).min(S, "Outside the city map").max(N, "Outside the city map"),
  lng: z.number({ error: "Enter a longitude" }).min(W, "Outside the city map").max(E, "Outside the city map"),
  adminId: z.string(),
});
type Values = z.infer<typeof schema>;

export function PlaceDialog({ place, open, onOpenChange }: { place: Place | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const admins = useApp((s) => s.admins);
  const places = useApp((s) => s.places);
  const CITY = useApp((s) => s.city);
  const add = useApp((s) => s.addPlace);
  const update = useApp((s) => s.updatePlace);
  const editing = !!place;

  const defaults = useMemo<Values>(
    () =>
      place
        ? { name: place.name, kind: place.kind, category: place.category, district: place.district, address: place.address, description: place.description, lat: place.lat, lng: place.lng, adminId: place.adminId ?? NO_ADMIN }
        : { name: "", kind: "residential", category: "Condominium", district: "", address: "", description: "", lat: CITY.center[0], lng: CITY.center[1], adminId: NO_ADMIN },
    [place, CITY.center],
  );
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const kind = watch("kind");
  const lat = watch("lat");
  const lng = watch("lng");
  const categories = place && !(CATEGORIES[kind] as readonly string[]).includes(place.category) ? [place.category, ...CATEGORIES[kind]] : CATEGORIES[kind];

  const adminLabel = (a: (typeof admins)[number]) => {
    const pl = places.find((p) => p.id === a.placeId);
    return `${a.name} · ${a.status === "frozen" ? "frozen" : pl ? pl.name : "no place yet"}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit place" : "Add a place"} description={editing ? "Update the details of this place." : "Register a new residence or public place in the city."} className="sm:max-w-3xl">
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(async (v) => {
            const { adminId, ...fields } = v;
            if (place) {
              if (!(await update(place.id, fields))) return;
              toast.success(`${v.name} was updated`);
            } else {
              if (!(await add({ ...fields, adminId: adminId === NO_ADMIN ? null : adminId }))) return;
              toast.success(`${v.name} was added`, { description: adminId === NO_ADMIN ? "It shows as unassigned until you pick an admin." : undefined });
            }
            onOpenChange(false);
          })}
        >
          <DialogBody className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Place name" error={errors.name?.message} htmlFor="pl-name">
                <Input id="pl-name" placeholder="e.g. Taman Bukit Residences" aria-invalid={!!errors.name} {...register("name")} />
              </Field>
              <Field label="Type" hint={editing ? "The type cannot be changed after the place is created." : "Residential places have residents; non-residential places only have visitors."}>
                {editing ? (
                  <div><KindBadge kind={kind} /></div>
                ) : (
                  <Controller control={control} name="kind" render={({ field }) => (
                    <Segmented
                      value={field.value}
                      onChange={(v) => { field.onChange(v); setValue("category", CATEGORIES[v][0]); }}
                      label="Place type"
                      options={[{ value: "residential", label: "Residential" }, { value: "non-residential", label: "Non-residential" }]}
                    />
                  )} />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="pl-cat">
                  <Controller control={control} name="category" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="pl-cat"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="District" error={errors.district?.message} htmlFor="pl-district">
                  <Input id="pl-district" placeholder="e.g. Bangsar" aria-invalid={!!errors.district} {...register("district")} />
                </Field>
              </div>
              <Field label="Street address" error={errors.address?.message} htmlFor="pl-address">
                <Input id="pl-address" placeholder="e.g. 12, Jalan Harmoni 3/4, Kuala Lumpur" aria-invalid={!!errors.address} {...register("address")} />
              </Field>
              <Field label="Description" error={errors.description?.message} htmlFor="pl-desc">
                <Textarea id="pl-desc" rows={3} placeholder="What is this place and who is it for?" aria-invalid={!!errors.description} {...register("description")} />
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="Location" error={errors.lat?.message ?? errors.lng?.message} hint="Click the map or type the coordinates.">
                <LocationPicker lat={lat} lng={lng} kind={kind} onChange={(la, ln) => { setValue("lat", la, { shouldValidate: true }); setValue("lng", ln, { shouldValidate: true }); }} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude" htmlFor="pl-lat">
                  <Input id="pl-lat" type="number" step="any" inputMode="decimal" aria-invalid={!!errors.lat} {...register("lat", { valueAsNumber: true })} />
                </Field>
                <Field label="Longitude" htmlFor="pl-lng">
                  <Input id="pl-lng" type="number" step="any" inputMode="decimal" aria-invalid={!!errors.lng} {...register("lng", { valueAsNumber: true })} />
                </Field>
              </div>
              {!editing && (
                <Field label="Admin (optional)" htmlFor="pl-admin" hint="You can also assign one later from the Manage tab.">
                  <Controller control={control} name="adminId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="pl-admin"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ADMIN}>Assign later</SelectItem>
                        {admins.map((a) => <SelectItem key={a.id} value={a.id} disabled={a.status === "frozen"}>{adminLabel(a)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{editing ? "Save changes" : "Add place"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
