"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Logo, Wordmark } from "@/components/layout/logo";
import { Splash } from "@/components/layout/splash";
import { useApp } from "@/store/app-store";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().min(1, "Enter your official email").email("That doesn't look like a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function Skyline() {
  const bars = [
    [0, 90], [34, 140], [70, 110], [108, 170], [150, 120], [186, 200], [226, 130], [262, 160], [300, 100], [338, 190], [378, 125], [414, 150], [452, 105], [488, 175], [526, 115], [562, 145],
  ];
  return (
    <svg viewBox="0 0 600 220" className="absolute inset-x-0 bottom-0 h-auto w-full opacity-[0.9]" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {bars.map(([x, h], i) => (
        <g key={i}>
          <rect x={x} y={220 - h} width="30" height={h} rx="3" fill="url(#sk)" />
          {Array.from({ length: Math.floor(h / 22) }).map((_, r) => (
            <rect key={r} x={x + 7 + ((r + i) % 2) * 10} y={220 - h + 10 + r * 20} width="5" height="7" rx="1.5" fill="var(--accent)" opacity={(r * 7 + i * 3) % 5 === 0 ? 0.9 : 0.18} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function ForgotDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [busy, setBusy] = useState(false);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setStep("email");
      setCode("");
      setPassword("");
    }
  };

  const sendCode = async () => {
    setBusy(true);
    try {
      await api("POST", "/auth/code", { email, purpose: "reset" });
      setStep("reset");
      toast.success("Code sent", { description: "Check the inbox of the mayor's office." });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await api("POST", "/auth/reset", { email, code, password });
      toast.success("Password updated", { description: "You can now sign in with your new password." });
      close(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        title="Reset your password"
        description={step === "email" ? "We'll email a 6-digit code to the mayor's office address." : "Enter the code we emailed and choose a new password."}
      >
        <DialogBody>
          {step === "email" ? (
            <Field label="Official email" htmlFor="reset-email">
              <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          ) : (
            <div className="space-y-4">
              <Field label="Verification code" htmlFor="reset-code">
                <Input id="reset-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label="New password" htmlFor="reset-password" hint="At least 8 characters with letters and a number.">
                <Input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          {step === "email" ? (
            <Button onClick={sendCode} loading={busy} disabled={!email.includes("@")}>
              Send code
            </Button>
          ) : (
            <Button onClick={reset} loading={busy} disabled={code.length !== 6 || password.length < 8}>
              Update password
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const login = useApp((s) => s.login);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [forgot, setForgot] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const next = () => {
    const n = new URLSearchParams(window.location.search).get("next");
    return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
  };

  useEffect(() => {
    if (hydrated && session) router.replace(next());
  }, [hydrated, session, router]);

  const onSubmit = async (v: FormValues) => {
    setError(null);
    const failure = await login(v.email, v.password);
    if (!failure) {
      toast.success("Welcome back, Mayor", { description: "Your city is up to date." });
      router.replace(next());
    } else {
      setError(failure);
      setShakeKey((k) => k + 1);
    }
  };

  if (!hydrated || session) return <Splash />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      <section className="bg-royal relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]" />
        <div className="relative flex items-center gap-3">
          <Logo size={44} />
          <Wordmark />
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5 text-accent" /> Mayor console
          </span>
          <h1 className="mt-5 text-[44px] font-bold leading-[1.08] tracking-tight">
            Run your city from <span className="text-accent">one royal console.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Appoint admins, watch your residents grow, publish safety policies and hear every citizen — all in one calm, real-time workspace.
          </p>

          <ul className="mt-10 grid max-w-lg gap-3">
            {[
              { i: UserPlus, t: "Watch resident growth and onboarding in real time" },
              { i: Building2, t: "Appoint admins and manage every residence and public place" },
              { i: MessageSquareWarning, t: "Answer public complaints, publish policies and donation drives" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-md">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10"><Icon className="size-[18px] text-accent" /></span>
                <span className="text-sm text-white/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="size-4" /> Protected by role-based access. Only the mayor&apos;s office may sign in here.
        </p>
        <Skyline />
      </section>

      <section className="relative flex min-h-dvh flex-col bg-background">
        <div className="bg-royal flex items-center gap-3 px-6 py-5 text-white lg:hidden">
          <Logo size={36} />
          <Wordmark />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px] animate-fade-up">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Lock className="size-3.5" /> Mayor access
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to manage your city, admins and residents.</p>
            </div>

            <form key={shakeKey} onSubmit={handleSubmit(onSubmit)} noValidate className={cn("space-y-5", shakeKey > 0 && "animate-shake")}>
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive-soft p-3 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Field label="Official email" error={errors.email?.message} htmlFor="email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="username" className="h-11 pl-9" aria-invalid={!!errors.email} {...register("email")} />
                </div>
              </Field>

              <Field label="Password" error={errors.password?.message} htmlFor="password">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="h-11 pl-9 pr-11" aria-invalid={!!errors.password} {...register("password")} />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={watch("remember")} onCheckedChange={(c) => setValue("remember", c === true)} />
                  Keep me signed in
                </label>
                <button type="button" onClick={() => setForgot(true)} className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {isSubmitting ? "Signing in…" : (<>Sign in <ArrowRight /></>)}
              </Button>
            </form>

          </div>
        </div>

        <footer className="px-6 pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Royal Organizing Ecosystem · ROES</footer>
      </section>

      <ForgotDialog open={forgot} onOpenChange={setForgot} />
    </div>
  );
}
