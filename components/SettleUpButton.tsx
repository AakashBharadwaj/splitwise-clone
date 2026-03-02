"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Props = {
  groupId: string;
  toUserId: string;
  toUserName: string;
  amount: number;
};

export default function SettleUpButton({ groupId, toUserId, toUserName, amount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleSettle() {
    setLoading(true);
    const res = await fetch("/api/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, toUserId, amount }),
    });

    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
    setConfirm(false);
  }

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
        >
          No
        </button>
        <button
          onClick={handleSettle}
          disabled={loading}
          className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "..." : "Yes"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-medium transition-colors whitespace-nowrap"
    >
      Settle up
    </button>
  );
}
