"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { AdminShell } from "@/components/AdminShell";

export function OwnerConsoleClient() {
  return (
    <AdminShell>
      <AdminPanel />
    </AdminShell>
  );
}
