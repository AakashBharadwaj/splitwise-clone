import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">💸</div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">SplitEasy</h1>
        <p className="text-xl text-gray-600 mb-8">
          Split expenses with friends and groups — no daily limits, no fuss.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          Get Started Free
        </Link>
        <p className="mt-6 text-sm text-gray-500">
          Sign in with your Google account — no password needed
        </p>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          {
            icon: "👥",
            title: "Create Groups",
            desc: "Organize expenses by trip, home, or any shared activity",
          },
          {
            icon: "➕",
            title: "Add Expenses",
            desc: "Log who paid and split equally or with custom amounts",
          },
          {
            icon: "⚖️",
            title: "Settle Up",
            desc: "See exactly who owes whom and record payments",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
