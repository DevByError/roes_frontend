import { Logo } from "./logo";

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="animate-float">
          <Logo size={56} />
        </div>
        <div className="skeleton h-1.5 w-28 rounded-full" />
      </div>
    </div>
  );
}
