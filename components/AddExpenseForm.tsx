"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string };

type Props = {
  groupId: string;
  members: Member[];
  currentUserId: string;
};

export default function AddExpenseForm({ groupId, members, currentUserId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">("equal");
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setDescription("");
    setAmount("");
    setPaidById(currentUserId);
    setSplitType("equal");
    setSplits({});
    setError("");
    setOpen(false);
  }

  function updateSplit(userId: string, value: string) {
    setSplits((prev) => ({ ...prev, [userId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || !amt || amt <= 0) return;

    setLoading(true);
    setError("");

    let splitPayload = undefined;
    if (splitType !== "equal") {
      splitPayload = members.map((m) => ({
        userId: m.id,
        value: parseFloat(splits[m.id] || "0"),
      }));
    }

    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: amt,
        paidById,
        splitType,
        splits: splitPayload,
      }),
    });

    if (res.ok) {
      reset();
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add expense");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors text-sm"
      >
        + Add Expense
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
            <button
              onClick={reset}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Luigi's"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Paid by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid by</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === currentUserId ? "You" : m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Split</label>
              <div className="flex gap-2">
                {(["equal", "exact", "percentage"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                      splitType === type
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom split inputs */}
            {splitType !== "equal" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  {splitType === "percentage" ? "Enter % for each person (must total 100)" : "Enter exact amounts"}
                </p>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-24 truncate">
                      {m.id === currentUserId ? "You" : m.name}
                    </span>
                    <div className="relative flex-1">
                      {splitType === "percentage" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      )}
                      {splitType === "exact" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      )}
                      <input
                        type="number"
                        value={splits[m.id] || ""}
                        onChange={(e) => updateSplit(m.id, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className={`w-full border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          splitType === "exact" ? "pl-7 pr-3" : "pl-3 pr-7"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !description.trim() || !amount}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
