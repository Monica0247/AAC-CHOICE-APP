import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { SetPasswordForm } from "@/components/SetPasswordForm";

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;

  await connectToDatabase();
  const invitedUser = await User.findOne({ inviteToken: token, role: "parent" }).lean();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        {invitedUser ? (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome, {invitedUser.name}
              </h1>
              <p className="text-sm text-slate-500">
                Set a password to access the profiles shared with you.
              </p>
            </div>
            <SetPasswordForm token={token} />
          </>
        ) : (
          <p className="text-center text-sm text-slate-600">
            This invite link is invalid or has already been used. Ask your therapist to
            send a new one.
          </p>
        )}
      </div>
    </main>
  );
}
