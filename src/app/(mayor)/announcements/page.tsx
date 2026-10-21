"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, Globe2, Lock, Megaphone, MoreHorizontal, Pin, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { MayorAvatar } from "@/components/domain/person";
import { compact, nf, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const schema = z.object({
  title: z.string().trim().min(4, "Give the announcement a clear title"),
  body: z.string().trim().min(10, "Write at least a sentence"),
  pinned: z.boolean(),
});
type Values = z.infer<typeof schema>;

function NewAnnouncement({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useApp((s) => s.addAnnouncement);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", pinned: false },
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent title="New public announcement" description="Visible to every user in the city and on the public map.">
        <form
          noValidate
          onSubmit={handleSubmit(async (v) => {
            if (!(await add(v))) return;
            toast.success("Announcement published", { description: "All residents can see it now." });
            reset();
            onOpenChange(false);
          })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-4">
            <Field label="Title" error={errors.title?.message} htmlFor="ann-title">
              <Input id="ann-title" placeholder="e.g. Road closure on Jalan Raja Laut" aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field label="Message" error={errors.body?.message} htmlFor="ann-body">
              <Textarea id="ann-body" rows={5} placeholder="Share what residents need to know…" aria-invalid={!!errors.body} {...register("body")} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox checked={watch("pinned")} onCheckedChange={(c) => setValue("pinned", c === true)} />
              Pin to the top
            </label>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit"><Megaphone /> Publish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AnnouncementsPage() {
  const items = useApp((s) => s.announcements);
  const places = useApp((s) => s.places);
  const remove = useApp((s) => s.removeAnnouncement);
  const [aud, setAud] = useState<"all" | "public" | "private">("all");
  const [placeId, setPlaceId] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const placeName = (id: string | null) => places.find((p) => p.id === id)?.name;
  const counts = useMemo(
    () => ({
      all: items.length,
      public: items.filter((a) => a.audience === "public").length,
      private: items.filter((a) => a.audience === "private").length,
      views: items.reduce((a, b) => a + b.views, 0),
    }),
    [items],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((a) => (aud === "all" || a.audience === aud) && (placeId === "all" || a.placeId === placeId) && (!needle || a.title.toLowerCase().includes(needle) || a.body.toLowerCase().includes(needle)))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [items, aud, placeId, q]);

  const placesWithPrivate = places.filter((p) => items.some((a) => a.placeId === p.id));

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Announcements"
        description="Public notices from you and non-residential admins, and private notices that residential admins send only to their residents."
        actions={<Button onClick={() => setOpen(true)}><Plus /> New public announcement</Button>}
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Announcement summary">
        <StatCard label="All announcements" value={counts.all} icon={<Megaphone />} />
        <StatCard label="Public" value={counts.public} icon={<Globe2 />} tone="info" hint="seen by everyone" />
        <StatCard label="Private" value={counts.private} icon={<Lock />} tone="gold" hint="residence only" />
        <StatCard label="Total views" value={compact.format(counts.views)} icon={<Eye />} tone="success" />
      </section>

      <Card className="mt-4 overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={aud}
            onChange={(v) => { setAud(v); if (v === "public") setPlaceId("all"); }}
            label="Audience"
            options={[
              { value: "all", label: `All ${counts.all}` },
              { value: "public", label: `Public ${counts.public}`, icon: <Globe2 /> },
              { value: "private", label: `Private ${counts.private}`, icon: <Lock /> },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements" className="pl-9 sm:w-64" aria-label="Search announcements" />
            </div>
            <Select value={placeId} onValueChange={setPlaceId}>
              <SelectTrigger className="sm:w-56" aria-label="Place"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All places</SelectItem>
                {placesWithPrivate.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Megaphone />} title="Nothing here yet" description="No announcements match these filters." />
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li key={a.id} className="group flex gap-4 p-4 transition-colors hover:bg-muted/40 sm:p-5">
                {a.author.kind === "mayor" ? <MayorAvatar size={42} className="mt-0.5" /> : <Avatar name={a.author.name} size={42} className="mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {a.pinned && <Pin className="size-3.5 text-accent" aria-label="Pinned" />}
                    <h3 className="text-[15px] font-semibold leading-snug">{a.title}</h3>
                    {a.audience === "public" ? <Badge tone="info"><Globe2 /> Public</Badge> : <Badge tone="gold"><Lock /> Private</Badge>}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {a.author.kind === "mayor" ? "Mayor" : "Admin"} · <span className="text-foreground">{a.author.name}</span>
                    </span>
                    {a.placeId && <span>{placeName(a.placeId)}</span>}
                    <span>{timeAgo(a.createdAt)}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {nf.format(a.views)}</span>
                  </div>
                </div>
                {a.author.kind === "mayor" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem destructive onSelect={async () => { if (await remove(a.id)) toast("Announcement removed"); }}>
                        <Trash2 /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <NewAnnouncement open={open} onOpenChange={setOpen} />
    </>
  );
}
