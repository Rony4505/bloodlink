"use client";

import { useEffect, useState } from "react";
import { kmApi } from "@/lib/kajmama/client";
import { useKm } from "./KmSession";

type AdminData = {
  stats: { users: number; workers: number; jobs: number; bookings: number; completed: number };
  users: {
    id: string;
    name: string;
    phone: string;
    role: string;
    verified: boolean;
    blocked: boolean;
    district: string;
  }[];
};

export function KmAdmin() {
  const { lang } = useKm();
  const bn = lang === "bn";
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const d = await kmApi<AdminData>("/api/kajmama/admin");
    setData(d);
    setAuthed(true);
  }

  useEffect(() => {
    let live = true;
    kmApi<AdminData>("/api/kajmama/admin")
      .then((d) => {
        if (!live) return;
        setData(d);
        setAuthed(true);
      })
      .catch(() => {
        if (live) setAuthed(false);
      });
    return () => {
      live = false;
    };
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await kmApi("/api/kajmama/admin", {
        method: "POST",
        body: JSON.stringify({ action: "login", pin }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন হয়নি");
    }
  }

  async function act(action: string, userId: string, extra: Record<string, unknown>) {
    await kmApi("/api/kajmama/admin", {
      method: "POST",
      body: JSON.stringify({ action, userId, ...extra }),
    });
    await load();
  }

  if (!authed) {
    return (
      <div className="km-page km-wrap">
        <h1>Kajmama Admin</h1>
        <form className="km-form km-card" onSubmit={login}>
          <label className="km-label">
            PIN
            <input className="km-input" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          {error ? <p className="km-error">{error}</p> : null}
          <button className="km-btn dark" type="submit">
            {bn ? "ঢুকুন" : "Enter"}
          </button>
          <p className="km-hint">Demo PIN: 1122</p>
        </form>
      </div>
    );
  }

  return (
    <div className="km-page km-wrap">
      <h1>Kajmama Admin</h1>
      <div className="km-grid-3" style={{ margin: "1rem 0" }}>
        <div className="km-card">
          <p className="km-muted">Users</p>
          <h2 style={{ margin: 0 }}>{data?.stats.users}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">Workers</p>
          <h2 style={{ margin: 0 }}>{data?.stats.workers}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">Completed</p>
          <h2 style={{ margin: 0 }}>{data?.stats.completed}</h2>
        </div>
      </div>
      <div className="km-card" style={{ overflowX: "auto" }}>
        <table className="km-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>District</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{u.role}</td>
                <td>{u.district}</td>
                <td>
                  <button
                    type="button"
                    className="km-btn ghost sm"
                    onClick={() => void act("verify", u.id, { verified: !u.verified })}
                  >
                    {u.verified ? "Unverify" : "Verify"}
                  </button>{" "}
                  <button
                    type="button"
                    className="km-btn ghost sm"
                    onClick={() => void act("block", u.id, { blocked: !u.blocked })}
                  >
                    {u.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
