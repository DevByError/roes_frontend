"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Car, Eye, Flame, HeartPulse, Info, Pencil, Plus, Search, ShieldAlert, ShieldCheck, Trash2, Waves, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { SeverityBadge } from "@/components/domain/badges";
import { cn, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { SafetyPolicy } from "@/lib/types";

const CATEGORIES: { value: string; icon: LucideIcon }[] = [
  { value: "Fire", icon: Flame },
  { value: "Flood", icon: Waves },
  { value: "Health", icon: HeartPulse },
  { value: "Traffic", icon: Car },
  { value: "Crime", icon: ShieldAlert },
  { value: "General", icon: Info },
];
const iconFor = (c: string) => CATEGORIES.find((x) => x.value === c)?.icon ?? Info;

const schema = z.object({
  title: z.string().trim().min(4, "Give the policy a clear title"),
  category: z.string().min(1),
  severity: z.enum(["info", "important", "critical"]),
  summary: z.string().trim().min(10, "Add a one-line summary residents will see first").max(160, "Keep the summary under 160 characters"),
  content: z.string().trim().min(20, "Describe the policy in a few lines"),
  published: z.boolean(),
});
type Values = z.infer<typeof schema>;

function PolicyDialog({ policy, open, onOpenChange }: { policy: SafetyPolicy | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useApp((s) => s.addPolicy);
  const update = useApp((s) => s.updatePolicy);
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: policy
      ? { title: policy.title, category: policy.category, severity: policy.severity, summary: policy.summary, content: policy.content, published: policy.published }
      : { title: "", category: "General", severity: "info", summary: "", content: "", published: true },
  });
  const published = watch("published");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={policy ? "Edit safety policy" : "New safety policy"} description="Published policies appear in every resident's profile." className="sm:max-w-xl">
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(async (v) => {
            if (policy) {
              if (!(await update(policy.id, v))) return;
              toast.success("Policy updated");
            } else {
              if (!(await add(v))) return;
              toast.success(v.published ? "Policy published" : "Draft saved", { description: v.published ? "Residents can now read it in their profile." : "Only you can see this draft." });
            }
            onOpenChange(false);
          })}
        >
          <DialogBody className="space-y-4">
            <Field label="Title" error={errors.title?.message} htmlFor="pol-title">
              <Input id="pol-title" placeholder="e.g. Fire safety & evacuation" aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="pol-cat">
                <Controller control={control} name="category" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pol-cat"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
              <Field label="Importance" htmlFor="pol-sev">
                <Controller control={control} name="severity" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pol-sev"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </Field>
            </div>
            <Field label="Summary" error={errors.summary?.message} htmlFor="pol-sum" hint="Shown first in the resident's profile.">
              <Input id="pol-sum" aria-invalid={!!errors.summary} {...register("summary")} />
            </Field>
            <Field label="Full policy" error={errors.content?.message} htmlFor="pol-content">
              <Textarea id="pol-content" rows={7} placeholder={"1. First step…\n2. Second step…"} aria-invalid={!!errors.content} {...register("content")} />
            </Field>
            <Controller control={control} name="published" render={({ field }) => (
              <label className="flex items-center justify-between gap-4 rounded-xl border p-3">
                <span>
                  <span className="block text-sm font-medium">{published ? "Published" : "Draft"}</span>
                  <span className="block text-xs text-muted-foreground">{published ? "Visible to all residents." : "Hidden until you publish."}</span>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
              </label>
            )} />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{policy ? "Save changes" : "Create policy"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SafetyPage() {
  const policies = useApp((s) => s.policies);
  const update = useApp((s) => s.updatePolicy);
  const remove = useApp((s) => s.removePolicy);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SafetyPolicy | null>(null);
  const [dialog, setDialog] = useState(false);
  const [preview, setPreview] = useState<SafetyPolicy | null>(null);
  const [confirm, setConfirm] = useState<SafetyPolicy | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return policies.filter(
      (p) =>
        (filter === "all" || (filter === "published" ? p.published : !p.published)) &&
        (!needle || p.title.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)),
    );
  }, [policies, filter, q]);
  const pub = policies.filter((p) => p.published).length;

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Safety policies"
        description="Create and manage the safety information every resident can read in their profile."
        actions={<Button onClick={() => { setEditing(null); setDialog(true); }}><Plus /> New policy</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <Segmented
          value={filter}
          onChange={setFilter}
          label="Filter policies"
          options={[
            { value: "all", label: `All ${policies.length}` },
            { value: "published", label: `Published ${pub}` },
            { value: "draft", label: `Drafts ${policies.length - pub}` },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies" className="pl-9" aria-label="Search policies" />
        </div>
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState icon={<ShieldCheck />} title="No policies yet" description="Create your first safety policy so residents know what to do in an emergency." action={<Button onClick={() => { setEditing(null); setDialog(true); }}><Plus /> New policy</Button>} /></Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => {
            const Icon = iconFor(p.category);
            return (
              <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Card className={cn("flex h-full flex-col p-5 transition-shadow hover:shadow-[var(--shadow-pop)]", !p.published && "border-dashed")}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn("grid size-11 place-items-center rounded-xl", p.severity === "critical" ? "bg-destructive-soft text-destructive" : p.severity === "important" ? "bg-warning-soft text-warning-ink" : "bg-info-soft text-info")}>
                      <Icon className="size-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <SeverityBadge severity={p.severity} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><Badge tone="neutral">{p.category}</Badge> Updated {timeAgo(p.updatedAt)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                      <Switch
                        checked={p.published}
                        onCheckedChange={async (v) => { if (await update(p.id, { published: v })) toast(v ? "Policy published" : "Moved to drafts"); }}
                        aria-label={`Publish ${p.title}`}
                      />
                      {p.published ? "Published" : "Draft"}
                    </label>
                    <div className="flex items-center">
                      <Tooltip content="Preview as resident"><Button variant="ghost" size="icon-sm" aria-label="Preview" onClick={() => setPreview(p)}><Eye /></Button></Tooltip>
                      <Tooltip content="Edit"><Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => { setEditing(p); setDialog(true); }}><Pencil /></Button></Tooltip>
                      <Tooltip content="Delete"><Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive hover:bg-destructive-soft" onClick={() => setConfirm(p)}><Trash2 /></Button></Tooltip>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <PolicyDialog key={editing?.id ?? "new"} policy={editing} open={dialog} onOpenChange={setDialog} />

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        {preview && (
          <DialogContent title="Resident view" description="This is how the policy appears in a resident's profile.">
            <DialogBody>
              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-3 flex items-center gap-2"><SeverityBadge severity={preview.severity} /><Badge tone="neutral">{preview.category}</Badge></div>
                <h3 className="text-base font-semibold">{preview.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{preview.summary}</p>
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">{preview.content}</pre>
              </div>
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <DialogContent title="Delete this policy?" description={`"${confirm.title}" will be removed from every resident's profile.`}>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Keep it</Button></DialogClose>
              <Button variant="destructive" onClick={async () => { const ok = await remove(confirm.id); setConfirm(null); if (ok) toast("Policy deleted"); }}><Trash2 /> Delete</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
