"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { CalendarClock, CheckCircle2, HeartHandshake, Lock, Pencil, Plus, RotateCcw, Users, Wallet } from "lucide-react";
import { COVER_ASPECT, ImageField } from "@/components/donations/image-field";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, money, nf } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { DonationPost } from "@/lib/types";

const CATEGORIES = ["Disaster relief", "Education", "Food security", "Health", "Community", "Environment"];
const COVERS = [
  "from-(--cover-1-from) via-(--cover-1-via) to-(--cover-1-to)",
  "from-(--cover-2-from) via-(--cover-2-via) to-(--cover-2-to)",
  "from-(--cover-3-from) via-(--cover-3-via) to-(--cover-3-to)",
  "from-(--cover-4-from) via-(--cover-4-via) to-(--cover-4-to)",
];

const schema = z.object({
  title: z.string().trim().min(4, "Give the campaign a clear title"),
  category: z.string().min(1),
  description: z.string().trim().min(20, "Explain where the money goes (20+ characters)"),
  goal: z.number({ error: "Enter a goal amount" }).min(500, "Minimum goal is RM 500").max(5_000_000),
  deadline: z.string().min(1, "Choose an end date"),
});
type Values = z.infer<typeof schema>;

function DonationDialog({ post, open, onOpenChange }: { post: DonationPost | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useApp((s) => s.addDonation);
  const update = useApp((s) => s.updateDonation);
  const [image, setImage] = useState<string | undefined>(post?.image);
  const [defaultEnd] = useState(() => format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: post
      ? { title: post.title, category: post.category, description: post.description, goal: post.goal, deadline: format(parseISO(post.deadline), "yyyy-MM-dd") }
      : { title: "", category: "Community", description: "", goal: 10000, deadline: defaultEnd },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={post ? "Edit donation post" : "New donation post"} description="Residents see this in the donation section and can contribute." className="sm:max-w-xl">
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(async (v) => {
            const deadline = new Date(v.deadline + "T23:59:00").toISOString();
            if (post) {
              if (!(await update(post.id, { ...v, deadline, image }))) return;
              toast.success("Campaign updated");
            } else {
              if (!(await add({ ...v, deadline, image }))) return;
              toast.success("Donation post published", { description: "Residents can start donating now." });
            }
            onOpenChange(false);
          })}
        >
          <DialogBody className="space-y-4">
            <Field label="Cover image" htmlFor="don-image" hint="Shown at the same 2:1 size on the campaign card and in the resident app.">
              <ImageField id="don-image" value={image} onChange={setImage} />
            </Field>
            <Field label="Campaign title" error={errors.title?.message} htmlFor="don-title">
              <Input id="don-title" placeholder="e.g. Winter blankets for families" aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="don-cat">
                <Controller control={control} name="category" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="don-cat"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
              <Field label="Goal (MYR)" error={errors.goal?.message} htmlFor="don-goal">
                <Input id="don-goal" type="number" inputMode="numeric" min={0} step={100} aria-invalid={!!errors.goal} {...register("goal", { valueAsNumber: true })} />
              </Field>
            </div>
            <Field label="Ends on" error={errors.deadline?.message} htmlFor="don-deadline">
              <Input id="don-deadline" type="date" aria-invalid={!!errors.deadline} {...register("deadline")} />
            </Field>
            <Field label="Description" error={errors.description?.message} htmlFor="don-desc">
              <Textarea id="don-desc" rows={4} placeholder="Tell residents who this helps and how funds are used." aria-invalid={!!errors.description} {...register("description")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{post ? "Save changes" : "Publish campaign"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DonationsPage() {
  const donations = useApp((s) => s.donations);
  const update = useApp((s) => s.updateDonation);
  const [editing, setEditing] = useState<DonationPost | null>(null);
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const openDialog = (d: DonationPost | null) => { setEditing(d); setNonce((n) => n + 1); setOpen(true); };

  const raised = donations.reduce((a, d) => a + d.raised, 0);
  const donors = donations.reduce((a, d) => a + d.donors, 0);
  const active = donations.filter((d) => d.status === "active").length;
  const goal = donations.reduce((a, d) => a + d.goal, 0);

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Donations"
        description="Publish donation posts. Residents see them in the donation section of the app and can contribute."
        actions={<Button onClick={() => openDialog(null)}><Plus /> New donation post</Button>}
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Donation summary">
        <StatCard label="Total raised" value={money.format(raised)} icon={<Wallet />} tone="success" hint={`${Math.round((raised / Math.max(goal, 1)) * 100)}% of all goals`} />
        <StatCard label="Active campaigns" value={active} icon={<HeartHandshake />} hint={`${donations.length - active} closed`} />
        <StatCard label="Donors" value={nf.format(donors)} icon={<Users />} tone="info" hint="contributions received" />
        <StatCard label="Combined goal" value={money.format(goal)} icon={<CheckCircle2 />} tone="gold" />
      </section>

      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {donations.map((d, i) => {
          const pct = Math.min(100, Math.round((d.raised / d.goal) * 100));
          const days = differenceInCalendarDays(parseISO(d.deadline), new Date());
          const closed = d.status === "closed";
          return (
            <li key={d.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <Card className="overflow-hidden">
                <div className={cn("relative flex items-end justify-between bg-gradient-to-br p-4 text-white", COVER_ASPECT, !d.image && COVERS[d.tone % COVERS.length])}>
                  {d.image ? (
                    <>
                      <img src={d.image} alt={`${d.title} cover`} loading="lazy" className="absolute inset-0 size-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/25" />
                    </>
                  ) : (
                    <>
                      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom_right,black,transparent)]" />
                      <HeartHandshake className="absolute right-4 top-4 size-10 text-white/25" />
                    </>
                  )}
                  <Badge className="relative bg-black/35 text-white backdrop-blur">{d.category}</Badge>
                  <Badge className={cn("relative", closed ? "bg-black/45 text-white" : "bg-accent text-accent-foreground")}>
                    {closed ? <><Lock /> Closed</> : <><CalendarClock /> {days >= 0 ? `${days} days left` : "Ended"}</>}
                  </Badge>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold leading-snug">{d.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="tabular text-xl font-bold leading-none">{money.format(d.raised)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">raised of {money.format(d.goal)}</p>
                    </div>
                    <span className="tabular text-sm font-semibold">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.title} progress`}>
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, pct)}%`, background: pct >= 100 ? "var(--status-good)" : "var(--series-1)" }} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" /> {nf.format(d.donors)} donors</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(d)}><Pencil /> Edit</Button>
                      {closed ? (
                        <Button size="sm" onClick={async () => { if (await update(d.id, { status: "active" })) toast.success("Campaign reopened"); }}><RotateCcw /> Reopen</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={async () => { if (await update(d.id, { status: "closed" })) toast("Campaign closed", { description: "Residents can no longer donate." }); }}><Lock /> Close</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <DonationDialog key={`${editing?.id ?? "new"}-${nonce}`} post={editing} open={open} onOpenChange={setOpen} />
    </>
  );
}
