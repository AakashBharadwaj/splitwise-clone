"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={36}
            height={36}
            className="rounded-full ring-2 ring-emerald-100"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
            {user.name?.[0] || "U"}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {user.name}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-medium text-sm text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
