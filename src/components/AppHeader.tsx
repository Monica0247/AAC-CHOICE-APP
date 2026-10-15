import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export function AppHeader({
  userName,
  homeHref,
}: {
  userName: string;
  homeHref: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href={homeHref} className="text-lg font-bold text-slate-900">
        AAC Choice Board
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
