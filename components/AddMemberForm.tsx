"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(`${data.user.name || email} added!`);
      setEmail("");
      router.refresh();
      setTimeout(() => { setSuccess(""); setOpen(false); }, 2000);
    } else {
      setError(data.error || "Failed to add member");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-gray-200 text-gray-500 py-2 rounded-xl text-sm hover:border-emerald-300 hover:text-emerald-600 transition-colors"
      >
        + Add member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="friend@example.com"
        autoFocus
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); setEmail(""); }}
          className="flex-1 border border-gray-200 text-gray-500 py-1.5 rounded-xl text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex-1 bg-emerald-600 text-white py-1.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
