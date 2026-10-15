import { logoutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Sign out
      </button>
    </form>
  );
}
