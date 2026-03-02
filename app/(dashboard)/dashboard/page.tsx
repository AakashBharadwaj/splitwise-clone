import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: { splits: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute total owed/owing across all groups
  let totalOwed = 0;
  let totalOwing = 0;

  for (const group of groups) {
    for (const expense of group.expenses) {
      const myShare = expense.splits.find((s) => s.userId === session.user.id);
      if (!myShare) continue;

      if (expense.paidById === session.user.id) {
        // I paid — others owe me (my share is "neutral", rest is owed to me)
        const othersShare = expense.amount - myShare.amount;
        totalOwed += othersShare;
      } else {
        // Someone else paid — I owe my share
        totalOwing += myShare.amount;
      }
    }
  }

  const net = totalOwed - totalOwing;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hi, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your expense overview</p>
        </div>
        <Link
          href="/groups/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors text-sm"
        >
          + New Group
        </Link>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Balance</p>
          <p className={`text-2xl font-bold mt-1 ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">You are owed</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">You owe</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{formatCurrency(totalOwing)}</p>
        </div>
      </div>

      {/* Groups */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h2>
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-semibold text-gray-700 mb-2">No groups yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Create a group to start splitting expenses with friends
            </p>
            <Link
              href="/groups/new"
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors text-sm"
            >
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => {
              const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{group.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-xs text-gray-500">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(group.createdAt)}</span>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-500 mb-3">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      {group.expenses.length} expense{group.expenses.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(totalExpenses)} total
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
