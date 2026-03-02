import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, simplifyDebts, type Balance } from "@/lib/utils";
import AddMemberForm from "@/components/AddMemberForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import SettleUpButton from "@/components/SettleUpButton";
import DeleteExpenseButton from "@/components/DeleteExpenseButton";
import Image from "next/image";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: {
      id,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        include: {
          paidBy: true,
          splits: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        include: { fromUser: true, toUser: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  const myMembership = group.members.find((m) => m.userId === session.user.id);
  const isAdmin = myMembership?.role === "admin";

  // Compute balances
  const balanceMap: Record<string, number> = {};
  for (const m of group.members) {
    balanceMap[m.userId] = 0;
  }

  for (const expense of group.expenses) {
    // Payer gets credited full amount
    balanceMap[expense.paidById] = (balanceMap[expense.paidById] || 0) + expense.amount;
    // Each person in split gets debited their share
    for (const split of expense.splits) {
      balanceMap[split.userId] = (balanceMap[split.userId] || 0) - split.amount;
    }
  }

  // Apply settlements
  for (const s of group.settlements) {
    balanceMap[s.fromUserId] = (balanceMap[s.fromUserId] || 0) + s.amount;
    balanceMap[s.toUserId] = (balanceMap[s.toUserId] || 0) - s.amount;
  }

  const balances: Balance[] = group.members.map((m) => ({
    userId: m.userId,
    name: m.user.name || m.user.email || "Unknown",
    image: m.user.image,
    amount: Math.round((balanceMap[m.userId] || 0) * 100) / 100,
  }));

  const suggestedSettlements = simplifyDebts([...balances]);

  const myBalance = balances.find((b) => b.userId === session.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{group.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-500 text-sm">{group.description}</p>
            )}
          </div>
        </div>
        <AddExpenseForm
          groupId={group.id}
          members={group.members.map((m) => ({ id: m.userId, name: m.user.name || m.user.email || "?" }))}
          currentUserId={session.user.id}
        />
      </div>

      {/* My balance */}
      {myBalance && (
        <div
          className={`rounded-2xl p-5 ${
            myBalance.amount > 0
              ? "bg-emerald-50 border border-emerald-200"
              : myBalance.amount < 0
              ? "bg-red-50 border border-red-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <p className="text-sm font-medium text-gray-600">Your balance in this group</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              myBalance.amount > 0
                ? "text-emerald-600"
                : myBalance.amount < 0
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {myBalance.amount > 0 ? "+" : ""}
            {formatCurrency(myBalance.amount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {myBalance.amount > 0
              ? "You are owed money"
              : myBalance.amount < 0
              ? "You owe money"
              : "You're all settled up"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          {group.expenses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-gray-500 text-sm">No expenses yet. Add the first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.expenses.map((expense) => {
                const myShare = expense.splits.find((s) => s.userId === session.user.id);
                const iPaid = expense.paidById === session.user.id;
                return (
                  <div
                    key={expense.id}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {expense.description}
                          </h3>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                            {expense.splitType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(expense.createdAt)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Paid by{" "}
                          <span className="font-medium text-gray-700">
                            {iPaid ? "you" : expense.paidBy.name || expense.paidBy.email}
                          </span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                        {myShare && (
                          <p
                            className={`text-xs mt-0.5 font-medium ${
                              iPaid ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {iPaid
                              ? `you get back ${formatCurrency(expense.amount - myShare.amount)}`
                              : `you owe ${formatCurrency(myShare.amount)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Split details */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                      {expense.splits.map((split) => (
                        <span
                          key={split.id}
                          className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg"
                        >
                          {split.user.name?.split(" ")[0] || split.user.email}: {formatCurrency(split.amount)}
                        </span>
                      ))}
                    </div>

                    {(iPaid || isAdmin) && (
                      <div className="mt-2 flex justify-end">
                        <DeleteExpenseButton expenseId={expense.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent settlements */}
          {group.settlements.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Recent Settlements
              </h3>
              <div className="space-y-2">
                {group.settlements.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      <span className="font-medium">
                        {s.fromUserId === session.user.id ? "You" : s.fromUser.name}
                      </span>{" "}
                      paid{" "}
                      <span className="font-medium">
                        {s.toUserId === session.user.id ? "you" : s.toUser.name}
                      </span>
                    </span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Balances + Members */}
        <div className="space-y-6">
          {/* Settle up suggestions */}
          {suggestedSettlements.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Suggested Settlements</h2>
              <div className="space-y-3">
                {suggestedSettlements.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 flex-1">
                      <span className="font-medium">
                        {s.from.id === session.user.id ? "You" : s.from.name}
                      </span>{" "}
                      →{" "}
                      <span className="font-medium">
                        {s.to.id === session.user.id ? "you" : s.to.name}
                      </span>
                      <br />
                      <span className="text-emerald-600 font-semibold">
                        {formatCurrency(s.amount)}
                      </span>
                    </p>
                    {s.from.id === session.user.id && (
                      <SettleUpButton
                        groupId={group.id}
                        toUserId={s.to.id}
                        toUserName={s.to.name}
                        amount={s.amount}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All balances */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Balances</h2>
            <div className="space-y-3">
              {balances.map((b) => (
                <div key={b.userId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {b.image ? (
                      <Image
                        src={b.image}
                        alt={b.name}
                        width={28}
                        height={28}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold shrink-0">
                        {b.name[0]}
                      </div>
                    )}
                    <span className="text-sm text-gray-700 truncate">
                      {b.userId === session.user.id ? "You" : b.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      b.amount > 0
                        ? "text-emerald-600"
                        : b.amount < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {b.amount > 0 ? "+" : ""}
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Members ({group.members.length})
            </h2>
            <div className="space-y-3 mb-4">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  {m.user.image ? (
                    <Image
                      src={m.user.image}
                      alt={m.user.name || ""}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                      {(m.user.name || m.user.email || "?")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.userId === session.user.id ? "You" : (m.user.name || m.user.email)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <AddMemberForm groupId={group.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
