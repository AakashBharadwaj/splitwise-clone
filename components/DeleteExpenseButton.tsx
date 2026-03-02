"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Are you sure?</span>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        No
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Yes, delete"}
      </button>
    </div>
  );
}
