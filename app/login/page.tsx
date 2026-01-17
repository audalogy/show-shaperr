"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrCreateUserId, setUserData } from "@/lib/userId";

export default function LoginPage() {
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const trimmedName = displayName.trim();
    if (trimmedName) {
      // Generate or retrieve UUID for this display name
      const uuid = getOrCreateUserId(trimmedName);
      // Store both UUID and display name
      setUserData(uuid, trimmedName);
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">Login (Mock Auth)</h1>
        <p className="mb-4 text-sm text-gray-600">
          Enter any user ID to continue. This is a mock authentication for the MVP.
        </p>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter user ID (e.g., user-123)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
          />
          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
