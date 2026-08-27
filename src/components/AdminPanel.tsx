"use client";

import { useEffect, useState } from "react";
import { AdminPopup, AdminSettingsPanel } from "@/components/AdminPopup";
import { AdminVolunteersPanel } from "@/components/AdminVolunteersPanel";
import { DonationBadge } from "@/components/DonationBadge";
import { PasswordField } from "@/components/PasswordField";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  AD_BANNER_ASPECT,
  AD_BANNER_HEIGHT,
  AD_BANNER_WIDTH,
  BANNER_SLIDE_INTERVAL_OPTIONS,
  DEFAULT_BANNER_SLIDE_INTERVAL_SEC,
  defaultSiteAppearance,
} from "@/lib/site-cms";
import type {
  BannerPage,
  BannerPlacement,
  BannerSize,
  NotificationSettings,
  OrgBanner,
  SiteAppearance,
} from "@/lib/types";
import { defaultNotificationSettings } from "@/lib/notification-settings";

type AdminDonor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  donationCount?: number;
  nextEligibleDate: string | null;
  bloodIssue: string;
  avgRating: number | null;
  ratingCount: number;
  createdAt?: string;
};

type ContactRequest = {
  id: string;
  kind?: "donor_phone" | "post_phone" | string;
  seekerName: string;
  seekerPhone: string;
  hospital: string;
  createdAt: string;
  auditCode?: string;
  seekerUserId?: string | null;
  seekerAccountName?: string | null;
  seekerAccountEmail?: string | null;
  donorId: string | null;
  postId?: string | null;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: string;
  donorDistrict: string;
  donorArea: string;
  donorEmail?: string;
  contextNote?: string;
};

type AdminBloodPost = {
  id: string;
  posterName: string;
  posterPhone: string;
  patientName: string;
  relation: string;
  bloodGroup: string;
  unitsNeeded: number;
  district: string;
  area: string;
  hospital: string;
  neededBy: string;
  message: string;
  urgency: "critical" | "urgent" | "moderate" | string;
  createdAt: string;
};

type ContactChangeRequest = {
  id: string;
  donorId: string;
  donorName: string;
  currentEmail: string;
  currentPhone: string;
  requestedEmail: string | null;
  requestedPhone: string | null;
  note: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function AdminPanel() {
  const { t, locale } = useLocale();
  const { reload: reloadAppearance } = useSiteAppearance();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [posts, setPosts] = useState<AdminBloodPost[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [changeRequests, setChangeRequests] = useState<ContactChangeRequest[]>(
    [],
  );
  const [stats, setStats] = useState({
    totalDonors: 0,
    availableNow: 0,
    totalRequests: 0,
    totalPosts: 0,
  });
  const [tab, setTab] = useState<
    "donors" | "posts" | "contacts" | "volunteers" | "settings"
  >("donors");
  const [printFromDate, setPrintFromDate] = useState("");
  const [printToDate, setPrintToDate] = useState("");
  const [settingsPanel, setSettingsPanel] = useState<
    null | "storage" | "backup" | "features" | "notifications" | "appearance" | "ads" | "privacy" | "credentials" | "verify"
  >(null);
  const [savePopup, setSavePopup] = useState(false);

  const [settingsUser, setSettingsUser] = useState("");
  const [privacyBn, setPrivacyBn] = useState("");
  const [privacyEn, setPrivacyEn] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [tempCodes, setTempCodes] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  function flashSaved(message?: string) {
    setSettingsMsg(message || t.saved);
    setSavePopup(true);
  }
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageBackend, setStorageBackend] = useState("file");
  const [storageHost, setStorageHost] = useState("");
  const [storageSaving, setStorageSaving] = useState(false);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [platformOptions, setPlatformOptions] = useState({
    hospitalAccess: { enabled: false, notes: "" },
    orgAds: { enabled: false, notes: "" },
    futureServices: { enabled: false, notes: "" },
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    () => defaultNotificationSettings(),
  );
  const [pushAllow, setPushAllow] = useState<{
    donorCount: number;
    allowedUsers: number;
    subscriptions: number;
    donors: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      bloodGroup: string;
      allowed: boolean;
      subscriptionCount: number;
    }>;
  }>({
    donorCount: 0,
    allowedUsers: 0,
    subscriptions: 0,
    donors: [],
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState({
    titleEn: "",
    titleBn: "",
    bodyEn: "",
    bodyBn: "",
    href: "/dashboard",
  });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [banners, setBanners] = useState<OrgBanner[]>([]);
  const [bannerSlideIntervalSec, setBannerSlideIntervalSec] = useState(
    DEFAULT_BANNER_SLIDE_INTERVAL_SEC,
  );
  const [bannerIntervalSaving, setBannerIntervalSaving] = useState(false);
  const [bannerDraft, setBannerDraft] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    size: "leaderboard" as BannerSize,
    page: "all" as BannerPage,
    placement: "after-hero" as BannerPlacement,
  });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [siteAppearance, setSiteAppearance] = useState<SiteAppearance>(
    defaultSiteAppearance(),
  );
  const [appearanceUploading, setAppearanceUploading] = useState<
    "logo" | "hero" | "founder" | null
  >(null);
  const [pendingStories, setPendingStories] = useState<
    {
      id: string;
      name: string;
      handle: string;
      quoteEn: string;
      quoteBn: string;
      createdAt: string;
    }[]
  >([]);

  async function loadPendingStories() {
    const res = await fetch("/api/admin/stories");
    if (!res.ok) return;
    const data = await res.json();
    setPendingStories(Array.isArray(data.stories) ? data.stories : []);
  }

  async function decideStory(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || t.errorGeneric);
      return;
    }
    await loadPendingStories();
    if (action === "approve") {
      await loadSettings();
      await reloadAppearance();
      flashSaved();
    }
  }

  async function deletePublishedStory(id: string) {
    if (!window.confirm(t.adminDeleteStoryConfirm)) return;
    const res = await fetch("/api/admin/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete-published" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || t.errorGeneric);
      return;
    }
    await loadSettings();
    await reloadAppearance();
    flashSaved();
  }

  async function loadData() {
    const res = await fetch("/api/admin/donors");
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data.donors) ? [...data.donors] : [];
    list.sort(
      (a, b) =>
        (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0),
    );
    setDonors(list);
    const postList = Array.isArray(data.posts) ? [...data.posts] : [];
    postList.sort(
      (a, b) =>
        (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0),
    );
    setPosts(postList);
    setRequests(data.contactRequests || []);
    setStats({
      totalDonors: data.stats?.totalDonors ?? list.length,
      availableNow: data.stats?.availableNow ?? 0,
      totalRequests: data.stats?.totalRequests ?? 0,
      totalPosts: data.stats?.totalPosts ?? postList.length,
    });
    setAuthed(true);

    const changeRes = await fetch("/api/admin/contact-changes");
    if (changeRes.ok) {
      const changeData = await changeRes.json();
      setChangeRequests(changeData.requests || []);
    }
  }

  async function decideChange(id: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin/contact-changes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    if (res.ok) {
      await loadData();
      return;
    }
    const data = await res.json().catch(() => ({}));
    window.alert(data.error || t.errorGeneric);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const data = await res.json();
    setSettingsUser(data.username);
    setPrivacyBn(data.privacyBn);
    setPrivacyEn(data.privacyEn);
    setVerifyEmail(data.verifyEmail || "");
    setVerifyPhone(data.verifyPhone || "");
    setEmailVerified(Boolean(data.emailVerified));
    setPhoneVerified(Boolean(data.phoneVerified));
    if (data.platformOptions) {
      setPlatformOptions({
        hospitalAccess: {
          enabled: Boolean(data.platformOptions.hospitalAccess?.enabled),
          notes: data.platformOptions.hospitalAccess?.notes || "",
        },
        orgAds: {
          enabled: Boolean(data.platformOptions.orgAds?.enabled),
          notes: data.platformOptions.orgAds?.notes || "",
        },
        futureServices: {
          enabled: Boolean(data.platformOptions.futureServices?.enabled),
          notes: data.platformOptions.futureServices?.notes || "",
        },
      });
    }
    if (data.notificationSettings) {
      setNotificationSettings({
        ...defaultNotificationSettings(),
        ...data.notificationSettings,
        bloodRequestBroadcast: {
          ...defaultNotificationSettings().bloodRequestBroadcast,
          ...data.notificationSettings.bloodRequestBroadcast,
          locked: true,
          enabled: true,
        },
        dailyDonationReminder: {
          ...defaultNotificationSettings().dailyDonationReminder,
          ...data.notificationSettings.dailyDonationReminder,
        },
        contactChangeAlerts: {
          ...defaultNotificationSettings().contactChangeAlerts,
          ...data.notificationSettings.contactChangeAlerts,
        },
        systemAnnouncements: {
          ...defaultNotificationSettings().systemAnnouncements,
          ...data.notificationSettings.systemAnnouncements,
        },
        monthlyGoldBlessing: {
          ...defaultNotificationSettings().monthlyGoldBlessing,
          ...data.notificationSettings.monthlyGoldBlessing,
        },
      });
    }
    if (data.pushAllow) {
      setPushAllow({
        donorCount: Number(data.pushAllow.donorCount) || 0,
        allowedUsers: Number(data.pushAllow.allowedUsers) || 0,
        subscriptions: Number(data.pushAllow.subscriptions) || 0,
        donors: Array.isArray(data.pushAllow.donors)
          ? data.pushAllow.donors.map(
              (d: {
                id?: string;
                name?: string;
                email?: string;
                phone?: string;
                bloodGroup?: string;
                allowed?: boolean;
                subscriptionCount?: number;
              }) => ({
                id: String(d.id || ""),
                name: String(d.name || ""),
                email: String(d.email || ""),
                phone: String(d.phone || ""),
                bloodGroup: String(d.bloodGroup || ""),
                allowed: Boolean(d.allowed),
                subscriptionCount: Number(d.subscriptionCount) || 0,
              }),
            )
          : [],
      });
    }
    setBanners(Array.isArray(data.banners) ? data.banners : []);
    setBannerSlideIntervalSec(
      typeof data.bannerSlideIntervalSec === "number"
        ? data.bannerSlideIntervalSec
        : DEFAULT_BANNER_SLIDE_INTERVAL_SEC,
    );
    if (data.siteAppearance) {
      setSiteAppearance({
        ...defaultSiteAppearance(),
        ...data.siteAppearance,
      });
    }
    await loadPendingStories();
  }

  async function saveBannerSlideInterval(sec: number) {
    setBannerIntervalSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "banner-slide-interval", bannerSlideIntervalSec: sec }),
      });
      if (!res.ok) {
        setSettingsMsg(t.errorGeneric);
        return;
      }
      const data = await res.json();
      setBannerSlideIntervalSec(data.bannerSlideIntervalSec ?? sec);
      flashSaved(t.saved);
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setBannerIntervalSaving(false);
    }
  }

  async function saveBanners(next: OrgBanner[]) {
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "banners", banners: next }),
    });
    if (!res.ok) {
      setSettingsMsg(t.errorGeneric);
      return;
    }
    const data = await res.json();
    setBanners(data.banners || next);
    flashSaved(t.saved);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    const title = bannerDraft.title.trim();
    if (!title) return;
    const next: OrgBanner[] = [
      ...banners,
      {
        id: crypto.randomUUID(),
        title,
        imageUrl: bannerDraft.imageUrl.trim(),
        linkUrl: bannerDraft.linkUrl.trim(),
        enabled: true,
        size: bannerDraft.size,
        pages: [bannerDraft.page],
        placement: bannerDraft.placement,
      },
    ];
    setBannerDraft({
      title: "",
      imageUrl: "",
      linkUrl: "",
      size: "leaderboard",
      page: "all",
      placement: "after-hero",
    });
    setBanners(next);
    await saveBanners(next);
  }

  async function saveSiteAppearance(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "site-appearance",
        siteAppearance,
      }),
    });
    if (!res.ok) {
      setSettingsMsg(t.errorGeneric);
      return;
    }
    const data = await res.json();
    if (data.siteAppearance) setSiteAppearance(data.siteAppearance);
    flashSaved(t.saved);
    reloadAppearance();
  }

  async function uploadAppearanceImage(
    file: File | null,
    field: "logoUrl" | "heroBackgroundUrl" | "founderPhotoUrl",
  ) {
    if (!file) return;
    setAppearanceUploading(
      field === "logoUrl" ? "logo" : field === "heroBackgroundUrl" ? "hero" : "founder",
    );
    setSettingsMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      let data: { error?: string; url?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setSettingsMsg(data.error || t.uploadFailed);
        return;
      }
      const nextAppearance = {
        ...siteAppearance,
        [field]: data.url || "",
      };
      setSiteAppearance(nextAppearance);

      const saveRes = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "site-appearance",
          siteAppearance: nextAppearance,
        }),
      });
      if (!saveRes.ok) {
        setSettingsMsg(t.uploadSavedLocalFail);
        return;
      }
      const saveData = await saveRes.json();
      if (saveData.siteAppearance) setSiteAppearance(saveData.siteAppearance);
      flashSaved(t.uploadSaved);
      reloadAppearance();
    } catch {
      setSettingsMsg(t.uploadFailed);
    } finally {
      setAppearanceUploading(null);
    }
  }

  function urgencyLabel(urgency: string) {
    if (urgency === "critical") return t.urgencyCritical;
    if (urgency === "urgent") return t.urgencyUrgent;
    return t.urgencyModerate;
  }

  function dhakaDay(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  }

  function formatAddedAt(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function donorsForPrint(): AdminDonor[] {
    return donors.filter((d) => {
      const day = dhakaDay(d.createdAt);
      if (!day) return !printFromDate && !printToDate;
      if (printFromDate && day < printFromDate) return false;
      if (printToDate && day > printToDate) return false;
      return true;
    });
  }

  function printDonors() {
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const list = donorsForPrint();
    if (!list.length) {
      window.alert(t.noDonorsInRange);
      return;
    }
    const rangeLabel =
      printFromDate || printToDate
        ? `${printFromDate || "…"} → ${printToDate || "…"}`
        : "all dates";
    const rows = list
      .map(
        (d, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.bloodGroup)}</td>
            <td>${escapeHtml(d.gender)}</td>
            <td>${escapeHtml(d.phone)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${escapeHtml(d.district)}</td>
            <td>${escapeHtml(d.area)}</td>
            <td>${d.available ? "Yes" : "No"}</td>
            <td>${escapeHtml(d.lastDonationDate || "-")}</td>
            <td>${escapeHtml(formatAddedAt(d.createdAt))}</td>
          </tr>`,
      )
      .join("");
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>BloodLink Donors</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px;color:#111}
  h1{margin:0 0 4px;font-size:20px}
  p{margin:0 0 16px;font-size:12px;color:#444}
  table{border-collapse:collapse;width:100%;font-size:11px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f3f3f3}
  @media print{button{display:none}}
</style></head><body>
  <h1>BloodLink — Donor registry</h1>
  <p>Generated ${new Date().toLocaleString()} · ${list.length} donors · Added: ${rangeLabel} · Admin only</p>
  <table>
    <thead><tr>
      <th>#</th><th>Name</th><th>Blood</th><th>Gender</th><th>Phone</th>
      <th>Email</th><th>District</th><th>Area</th><th>Available</th><th>Last donation</th><th>Added on</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      window.alert(t.errorGeneric);
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  async function savePlatformOptions(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "platform-options",
        platformOptions,
      }),
    });
    if (res.ok) flashSaved(t.saved); else setSettingsMsg(t.errorGeneric);
  }

  async function saveNotificationSettings(e: React.FormEvent) {
    e.preventDefault();
    setNotifSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notifications",
          notificationSettings: {
            ...notificationSettings,
            bloodRequestBroadcast: {
              ...notificationSettings.bloodRequestBroadcast,
              enabled: true,
              locked: true,
            },
          },
        }),
      });
      if (!res.ok) {
        setSettingsMsg(t.errorGeneric);
        return;
      }
      const data = await res.json();
      if (data.notificationSettings) {
        setNotificationSettings({
          ...defaultNotificationSettings(),
          ...data.notificationSettings,
        });
      }
      flashSaved(t.saved);
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setNotifSaving(false);
    }
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setBroadcastSending(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notification-broadcast",
          ...broadcastDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsMsg(data.error || t.errorGeneric);
        return;
      }
      setBroadcastDraft({
        titleEn: "",
        titleBn: "",
        bodyEn: "",
        bodyBn: "",
        href: "/dashboard",
      });
      flashSaved(
        locale === "bn"
          ? `${data.sent || 0} জন অ্যাকাউন্টধারীকে পাঠানো হয়েছে`
          : `Sent to ${data.sent || 0} account holders`,
      );
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setBroadcastSending(false);
    }
  }

  async function loadStorage() {
    const res = await fetch("/api/admin/storage");
    if (!res.ok) return;
    const data = await res.json();
    setStorageReady(Boolean(data.databaseReady));
    setStorageBackend(data.storage?.backend || "file");
    setStorageHost(data.activeHost || "");
    if (!data.databaseReady && data.storage?.error) {
      setSettingsMsg(data.storage.error);
    }
  }

  async function saveStorage(e: React.FormEvent) {
    e.preventDefault();
    setStorageSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = await res.json();
      setStorageHost(data.activeHost || "");
      setStorageBackend(data.storage?.backend || "file");
      if (!res.ok) {
        setSettingsMsg(data.error || t.errorGeneric);
        setStorageReady(false);
        return;
      }
      const ready = Boolean(data.databaseReady);
      setStorageReady(ready);
      if (ready) {
        setDatabaseUrl("");
        setSettingsMsg(
          data.activeHost
            ? `${t.storageReady} (${data.activeHost})`
            : t.storageReady,
        );
        setSavePopup(true);
        await loadData();
      } else {
        setSettingsMsg(data.error || t.storageNotReady);
      }
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setStorageSaving(false);
    }
  }

  async function downloadBackup() {
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        setSettingsMsg(t.backupRestoreFailed);
        return;
      }
      const blob = await res.blob();
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bloodlink-backup-${stamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      flashSaved(t.backupDownload);
    } catch {
      setSettingsMsg(t.backupRestoreFailed);
    }
  }

  async function restoreBackup(e: React.FormEvent) {
    e.preventDefault();
    if (!backupFile) return;
    if (
      !window.confirm(
        "Restore this backup? Current live data will be replaced with the backup file.",
      )
    ) {
      return;
    }
    setBackupRestoring(true);
    setSettingsMsg("");
    try {
      const text = await backupFile.text();
      const payload = JSON.parse(text);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsMsg(data.error || t.backupRestoreFailed);
        return;
      }
      setSettingsMsg(
        `${t.backupRestoreSuccess} (${data.donorCount ?? 0} donors)`,
      );
      setSavePopup(true);
      setBackupFile(null);
      await loadData();
      await loadStorage();
    } catch {
      setSettingsMsg(t.backupRestoreFailed);
    } finally {
      setBackupRestoring(false);
    }
  }

  async function uploadBannerImage(file: File | null) {
    if (!file) return;
    setBannerUploading(true);
    setSettingsMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsMsg(data.error || t.errorGeneric);
        return;
      }
      setBannerDraft((d) => ({ ...d, imageUrl: data.url || "" }));
      flashSaved(t.saved);
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setBannerUploading(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) {
          setAuthed(false);
          return;
        }
        await loadData();
        await loadSettings();
        await loadStorage();
      })
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      await loadData();
      await loadSettings();
      await loadStorage();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function removeDonor(id: string) {
    if (!window.confirm("Delete this donor?")) return;
    const res = await fetch(`/api/admin/donors?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await loadData();
  }

  async function savePrivacy() {
    setSettingsMsg("");
    const res = await fetch("/api/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacyBn, privacyEn }),
    });
    if (res.ok) flashSaved(t.saved); else setSettingsMsg(t.errorGeneric);
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "credentials",
        currentPassword,
        newUsername: newUsername || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsMsg(data.error || t.errorGeneric);
      return;
    }
    flashSaved(t.saved);
    setCurrentPassword("");
    setNewPassword("");
    await loadSettings();
  }

  async function setupVerify(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify-setup",
        email: verifyEmail,
        phone: verifyPhone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsMsg(data.error || t.errorGeneric);
      return;
    }
    const bits = [];
    if (data.emailCode) bits.push(`Email code: ${data.emailCode}`);
    if (data.phoneCode) bits.push(`Phone code: ${data.phoneCode}`);
    setTempCodes(bits.join(" | "));
    flashSaved(t.saved);
    await loadSettings();
  }

  async function confirmCode(channel: "email" | "phone") {
    const code = channel === "email" ? emailCode : phoneCode;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-code", channel, code }),
    });
    const data = await res.json();
    setSettingsMsg(res.ok ? t.saved : data.error || t.errorGeneric);
    if (res.ok) setSavePopup(true);
    await loadSettings();
  }

  if (checking) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <span className="btn-primary pointer-events-none opacity-80">
              {t.adminDonors}
            </span>
            <span className="btn-ghost pointer-events-none opacity-55">
              {t.adminVolunteers}
            </span>
            <span className="btn-ghost pointer-events-none opacity-55">
              {t.adminSettings}
            </span>
          </div>
        </div>
        <p className="rounded-2xl bg-white/80 p-6 text-[color-mix(in_oklab,var(--ink)_70%,white)]">
          {t.loading}
        </p>
      </div>
    );
  }

  if (!authed) {
    return (
      <form
        onSubmit={login}
        className="mx-auto max-w-md space-y-3 rounded-2xl bg-white/80 p-6"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.adminUsername}</span>
          <input
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <PasswordField
          id="admin-login-password"
          label={t.adminPassword}
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t.loading : t.adminLogin}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={tab === "donors" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("donors")}
          >
            {t.adminDonors}
          </button>
          <button
            type="button"
            className={tab === "posts" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("posts")}
          >
            {t.adminBloodPosts}
          </button>
          <button
            type="button"
            className={tab === "contacts" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("contacts")}
          >
            {t.adminContactLog}
          </button>
          <button
            type="button"
            className={tab === "volunteers" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("volunteers")}
          >
            {t.adminVolunteers}
          </button>
          <button
            type="button"
            className={tab === "settings" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("settings")}
          >
            {t.adminSettings}
          </button>
        </div>
        <button type="button" className="btn-ghost" onClick={logout}>
          {t.logout}
        </button>
      </div>

      {tab === "volunteers" ? <AdminVolunteersPanel /> : null}

      {tab === "contacts" ? (
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/90 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[linear-gradient(160deg,#fff8f4,#ffffff)] px-5 py-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
                {t.adminContactLog}
              </h2>
              <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">
                {t.adminContactLogHint}
              </p>
            </div>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--blood)_12%,white)] px-3 py-1 text-xs font-bold text-[var(--blood-deep)]">
              {t.adminRequests}: {stats.totalRequests}
            </span>
          </div>

          {!requests.length ? (
            <p className="px-5 py-8 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.noContactLogs}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {requests.map((r) => {
                const isPost = r.kind === "post_phone";
                return (
                  <li
                    key={r.id}
                    className={`px-5 py-4 text-sm ${
                      isPost
                        ? "bg-[color-mix(in_oklab,var(--sage)_5%,white)]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isPost
                            ? "bg-[var(--sage)] text-white"
                            : "bg-[var(--blood)] text-white"
                        }`}
                      >
                        {isPost ? t.contactKindPost : t.contactKindDonor}
                      </span>
                      <span className="text-xs font-semibold text-[var(--blood-deep)]">
                        {t.postedAt}: {formatAddedAt(r.createdAt)}
                      </span>
                      {r.auditCode ? (
                        <span className="rounded-md bg-[color-mix(in_oklab,var(--ink)_8%,white)] px-2 py-0.5 font-mono text-[10px]">
                          {t.auditCode}: {r.auditCode}
                        </span>
                      ) : null}
                    </div>

                    {isPost ? (
                      <>
                        <p className="mt-2 font-semibold text-[var(--ink)]">
                          {t.postContactUser}: {r.seekerName} · {r.seekerPhone}
                        </p>
                        {r.seekerAccountEmail ? (
                          <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                            {t.seekerAccount}: {r.seekerAccountEmail}
                          </p>
                        ) : null}
                        <p className="mt-2">
                          {t.postContactPoster}: {r.donorName} · {r.donorPhone} ·{" "}
                          {r.donorBloodGroup}
                        </p>
                        <p className="mt-1">
                          {r.donorArea}, {r.donorDistrict}
                          {r.hospital ? ` · ${t.hospital}: ${r.hospital}` : ""}
                        </p>
                        {r.contextNote ? (
                          <p className="mt-1 text-xs font-medium text-[var(--sage)]">
                            {r.contextNote}
                          </p>
                        ) : null}
                        {r.postId ? (
                          <a
                            href={`/requests/${r.postId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs font-semibold text-[var(--blood-deep)] underline"
                          >
                            {t.viewDetails}
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="mt-2 font-semibold text-[var(--ink)]">
                          {t.seekerContacted}: {r.seekerName} · {r.seekerPhone}
                        </p>
                        {r.seekerAccountName || r.seekerAccountEmail ? (
                          <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                            {t.seekerAccount}: {r.seekerAccountName || "—"}
                            {r.seekerAccountEmail
                              ? ` · ${r.seekerAccountEmail}`
                              : ""}
                          </p>
                        ) : null}
                        <p className="mt-2">
                          {t.contactedDonor}: {r.donorName} · {r.donorBloodGroup}{" "}
                          · {r.donorPhone}
                          {r.donorEmail && r.donorEmail !== "—"
                            ? ` · ${r.donorEmail}`
                            : ""}
                        </p>
                        <p className="mt-1">
                          {r.donorArea}, {r.donorDistrict}
                          {r.hospital ? ` · ${t.hospital}: ${r.hospital}` : ""}
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "posts" ? (
        <section className="overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-white/90 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[linear-gradient(160deg,#fff1f0,#fff8f6)] px-5 py-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
                {t.adminBloodPosts}
              </h2>
              <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">
                {t.adminBloodPostsHint}
              </p>
            </div>
            <span className="rounded-full bg-[var(--blood)] px-3 py-1 text-xs font-bold text-white">
              {t.totalBloodPosts}: {stats.totalPosts}
            </span>
          </div>

          {!posts.length ? (
            <p className="px-5 py-8 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.noPosts}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-4 transition hover:bg-[color-mix(in_oklab,var(--blood)_5%,white)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--blood)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {p.bloodGroup}
                        </span>
                        <span className="rounded-full bg-[color-mix(in_oklab,var(--blood)_14%,white)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--blood-deep)]">
                          {urgencyLabel(p.urgency)}
                        </span>
                        <span className="text-xs font-semibold text-[var(--blood-deep)]">
                          {t.postedAt}: {formatAddedAt(p.createdAt)}
                        </span>
                      </div>
                      <p className="font-semibold text-[var(--ink)]">
                        {p.patientName} · {p.unitsNeeded}{" "}
                        {locale === "bn" ? "ব্যাগ" : "bag(s)"} · {p.hospital}
                      </p>
                      <p>
                        {p.area}, {p.district} · {t.neededBy}: {p.neededBy}
                      </p>
                      <p>
                        {t.posterName}: {p.posterName} · {p.posterPhone}
                        {p.relation ? ` · ${p.relation}` : ""}
                      </p>
                      {p.message ? (
                        <p className="text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                          {p.message}
                        </p>
                      ) : null}
                    </div>
                    <a
                      href={`/requests/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost shrink-0 text-[var(--blood-deep)]"
                    >
                      {t.viewDetails}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "donors" ? (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/80 px-5 py-4 text-sm">
            <span>
              {t.totalDonors}: <strong>{stats.totalDonors}</strong>
            </span>
            <span>
              {t.availableNow}: <strong>{stats.availableNow}</strong>
            </span>
            <span>
              {t.totalBloodPosts}: <strong>{stats.totalPosts}</strong>
            </span>
            <span>
              {t.adminRequests}: <strong>{stats.totalRequests}</strong>
            </span>
            <label className="flex items-center gap-2 text-xs">
              <span>{t.printFromDate}</span>
              <input
                type="date"
                className="field py-1 text-sm"
                value={printFromDate}
                onChange={(e) => setPrintFromDate(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <span>{t.printToDate}</span>
              <input
                type="date"
                className="field py-1 text-sm"
                value={printToDate}
                onChange={(e) => setPrintToDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-ghost ml-auto"
              onClick={printDonors}
            >
              {printFromDate || printToDate ? t.printByDate : t.printPdf}
            </button>
          </div>

          <section className="rounded-2xl bg-white/80 p-5 print:shadow-none">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminDonors}
            </h2>
            <ul className="mt-4 space-y-3">
              {donors.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 border-b border-[var(--line)] pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <DonationBadge count={d.donationCount || 0} />
                      <span>
                        {d.name} · {d.bloodGroup} ·{" "}
                        {d.gender === "female" ? t.female : t.male}
                      </span>
                    </p>
                    <p>
                      {d.phone} · {d.email}
                    </p>
                    <p>
                      {d.area}, {d.district} ·{" "}
                      {d.available ? t.available : t.unavailable}
                      {d.avgRating != null
                        ? ` · ★ ${d.avgRating} (${d.ratingCount})`
                        : ""}
                      {` · ${t.donationCountLabel}: ${d.donationCount || 0}`}
                    </p>
                    <p>
                      {t.bloodIssue}: {d.bloodIssue || t.noBloodIssue}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--blood-deep)]">
                      {t.donorAddedOn}: {formatAddedAt(d.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost text-[var(--blood)]"
                    onClick={() => removeDonor(d.id)}
                  >
                    {t.delete}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminContactChanges}
            </h2>
            {!changeRequests.length ? (
              <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                {t.noChangeRequests}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {changeRequests.map((r) => (
                  <li
                    key={r.id}
                    className="border-b border-[var(--line)] pb-3 text-sm"
                  >
                    <p className="font-semibold">
                      {r.donorName} · {r.status}
                    </p>
                    <p className="mt-1">
                      {t.email}: {r.currentEmail}
                      {r.requestedEmail ? ` → ${r.requestedEmail}` : ""}
                    </p>
                    <p className="mt-1">
                      {t.phone}: {r.currentPhone}
                      {r.requestedPhone ? ` → ${r.requestedPhone}` : ""}
                    </p>
                    {r.note ? <p className="mt-1">{r.note}</p> : null}
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.status === "pending" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => decideChange(r.id, "approved")}
                        >
                          {t.accept}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost text-[var(--blood)]"
                          onClick={() => decideChange(r.id, "rejected")}
                        >
                          {t.reject}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                  {t.adminContactLog}
                </h2>
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                  {t.adminContactLogHint}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setTab("contacts")}
              >
                {t.adminContactLog} ({stats.totalRequests})
              </button>
            </div>
          </section>
        </>
      ) : null}

      {tab === "settings" ? (
        <div className="space-y-6">
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">{t.settingsMenuHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["storage", t.storageSetup],
              ["backup", t.backupTitle],
              ["notifications", t.notificationSettings],
              ["features", t.futureFeatures],
              ["appearance", t.siteAppearance],
              ["ads", t.orgBanners],
              ["privacy", t.adminPrivacy],
              ["credentials", t.changeCredentials],
              ["verify", t.verifyContacts],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSettingsPanel(id)}
                className="rounded-2xl border border-[var(--line)] bg-white/90 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
                  {label}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--sage)]">{t.openSettings} →</p>
              </button>
            ))}
          </div>

          <AdminSettingsPanel
            open={settingsPanel === "storage"}
            title={t.storageSetup}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.storageSetup}
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
              {t.storageSetupBody}
            </p>
            <p
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                storageReady
                  ? "bg-[color-mix(in_oklab,var(--sage)_14%,white)] text-[var(--sage)]"
                  : "bg-[color-mix(in_oklab,var(--blood)_12%,white)] text-[var(--blood-deep)]"
              }`}
            >
              {storageReady ? t.storageReady : t.storageNotReady}
              {" · "}
              backend: {storageBackend}
              {storageHost ? ` · host: ${storageHost}` : ""}
            </p>
            <p className="text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.storageVolumeTip}
            </p>
            <form onSubmit={saveStorage} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.storageUrlLabel}</span>
                <input
                  className="field"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="postgresql://...@proxy.rlwy.net:....../railway"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.storageUrlHint}
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 font-semibold text-white transition hover:bg-[#265a42] disabled:opacity-55"
                disabled={storageSaving}
              >
                {storageSaving ? t.loading : t.storageSave}
              </button>
            </form>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "backup"}
            title={t.backupTitle}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.backupTitle}
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
              {t.backupBody}
            </p>
            <p className="text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.backupRotatingHint}
            </p>
            <button
              type="button"
              onClick={() => void downloadBackup()}
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--blood-deep)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              {t.backupDownload}
            </button>
            <form onSubmit={restoreBackup} className="space-y-3 border-t border-[var(--line)] pt-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.backupRestoreLabel}</span>
                <input
                  className="field"
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => setBackupFile(e.target.files?.[0] ?? null)}
                />
                <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.backupRestoreHint}
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full border border-[var(--blood-deep)] px-5 py-3 font-semibold text-[var(--blood-deep)] transition hover:bg-[color-mix(in_oklab,var(--blood)_8%,white)] disabled:opacity-55"
                disabled={backupRestoring || !backupFile}
              >
                {backupRestoring ? t.loading : t.backupRestoreButton}
              </button>
            </form>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "notifications"}
            title={t.notificationSettings}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-5">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
                  {t.notificationSettings}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                  {t.notificationSettingsBody}
                </p>
              </div>

              <div className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_20%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--blood-deep)]">
                  {t.pushAllowStats}
                </p>
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_72%,white)]">
                  {t.pushAllowStatsBody
                    .replace("{allowed}", String(pushAllow.allowedUsers))
                    .replace("{donors}", String(pushAllow.donorCount))
                    .replace("{subs}", String(pushAllow.subscriptions))}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.pushAllowListHint}
                </p>
                {pushAllow.donors.length ? (
                  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-[var(--line)] bg-white/90">
                    <table className="w-full min-w-[28rem] text-left text-xs">
                      <thead className="sticky top-0 bg-[color-mix(in_oklab,var(--sand)_40%,white)] text-[10px] uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        <tr>
                          <th className="px-3 py-2 font-semibold">{t.name}</th>
                          <th className="px-3 py-2 font-semibold">{t.email}</th>
                          <th className="px-3 py-2 font-semibold">{t.bloodGroup}</th>
                          <th className="px-3 py-2 font-semibold">{t.pushAllowStatus}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pushAllow.donors.map((d) => (
                          <tr
                            key={d.id}
                            className="border-t border-[var(--line)] align-top"
                          >
                            <td className="px-3 py-2">
                              <p className="font-semibold text-[var(--ink)]">{d.name}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-[color-mix(in_oklab,var(--ink)_45%,white)]">
                                {d.id.slice(0, 8)}…
                              </p>
                              <p className="mt-0.5 text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                                {d.phone}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                              {d.email}
                            </td>
                            <td className="px-3 py-2 font-semibold text-[var(--blood-deep)]">
                              {d.bloodGroup}
                            </td>
                            <td className="px-3 py-2">
                              {d.allowed ? (
                                <span className="inline-flex rounded-full bg-[color-mix(in_oklab,var(--sage)_18%,white)] px-2 py-0.5 font-semibold text-[var(--sage)]">
                                  {t.pushAllowYes}
                                  {d.subscriptionCount > 1
                                    ? ` · ${d.subscriptionCount}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-[color-mix(in_oklab,var(--blood)_12%,white)] px-2 py-0.5 font-semibold text-[var(--blood-deep)]">
                                  {t.pushAllowNo}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>

              <form onSubmit={saveNotificationSettings} className="space-y-4">
                {(
                  [
                    [
                      "bloodRequestBroadcast",
                      t.notifBloodRequest,
                      t.notifBloodRequestHint,
                      true,
                    ],
                    [
                      "dailyDonationReminder",
                      t.notifDailyReminder,
                      t.notifDailyReminderHint,
                      false,
                    ],
                    [
                      "contactChangeAlerts",
                      t.notifContactChange,
                      t.notifContactChangeHint,
                      false,
                    ],
                    [
                      "systemAnnouncements",
                      t.notifSystem,
                      t.notifSystemHint,
                      false,
                    ],
                    [
                      "monthlyGoldBlessing",
                      t.notifGoldBlessing,
                      t.notifGoldBlessingHint,
                      false,
                    ],
                  ] as const
                ).map(([key, title, hint, alwaysOn]) => {
                  const channel = notificationSettings[key];
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-[var(--line)] bg-[linear-gradient(160deg,#fffdfb,#f8f1ea)] p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--ink)]">{title}</p>
                            {alwaysOn ? (
                              <span className="rounded-full bg-[color-mix(in_oklab,var(--blood)_14%,white)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--blood-deep)]">
                                {t.notifAlwaysOn}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_58%,white)]">
                            {hint}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={alwaysOn ? true : channel.enabled}
                            disabled={alwaysOn}
                            onChange={(e) =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], enabled: e.target.checked },
                              }))
                            }
                          />
                          {alwaysOn || channel.enabled ? t.enabled : t.disabled}
                        </label>
                      </div>

                      {!alwaysOn ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="block text-sm">
                            <span className="mb-1 block font-medium">{t.notifIntervalDays}</span>
                            <input
                              className="field"
                              type="number"
                              min={1}
                              max={30}
                              value={channel.intervalDays}
                              onChange={(e) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    intervalDays: Math.max(
                                      1,
                                      Math.min(30, Number(e.target.value) || 1),
                                    ),
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="mb-1 block font-medium">{t.notifHourBd}</span>
                            <input
                              className="field"
                              type="number"
                              min={0}
                              max={23}
                              value={channel.hourBd}
                              onChange={(e) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    hourBd: Math.max(
                                      0,
                                      Math.min(23, Number(e.target.value) || 0),
                                    ),
                                  },
                                }))
                              }
                            />
                          </label>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-[var(--sage)]">
                          {t.notifBloodLockedNote}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[var(--blood-deep)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-55"
                  disabled={notifSaving}
                >
                  {notifSaving ? t.loading : t.saveNotificationSettings}
                </button>
              </form>

              <div className="border-t border-[var(--line)] pt-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
                  {t.notifBroadcastTitle}
                </h3>
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {t.notifBroadcastBody}
                </p>
                <form onSubmit={sendBroadcast} className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">{t.notifTitleEn}</span>
                      <input
                        className="field"
                        value={broadcastDraft.titleEn}
                        onChange={(e) =>
                          setBroadcastDraft((p) => ({ ...p, titleEn: e.target.value }))
                        }
                        required
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">{t.notifTitleBn}</span>
                      <input
                        className="field"
                        value={broadcastDraft.titleBn}
                        onChange={(e) =>
                          setBroadcastDraft((p) => ({ ...p, titleBn: e.target.value }))
                        }
                        required
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">{t.notifBodyEn}</span>
                    <textarea
                      className="field min-h-20"
                      value={broadcastDraft.bodyEn}
                      onChange={(e) =>
                        setBroadcastDraft((p) => ({ ...p, bodyEn: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">{t.notifBodyBn}</span>
                    <textarea
                      className="field min-h-20"
                      value={broadcastDraft.bodyBn}
                      onChange={(e) =>
                        setBroadcastDraft((p) => ({ ...p, bodyBn: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">{t.notifHref}</span>
                    <input
                      className="field"
                      value={broadcastDraft.href}
                      onChange={(e) =>
                        setBroadcastDraft((p) => ({ ...p, href: e.target.value }))
                      }
                      placeholder="/dashboard"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full border border-[var(--blood-deep)] px-5 py-3 font-semibold text-[var(--blood-deep)] transition hover:bg-[color-mix(in_oklab,var(--blood)_8%,white)] disabled:opacity-55"
                    disabled={
                      broadcastSending || !notificationSettings.systemAnnouncements.enabled
                    }
                  >
                    {broadcastSending ? t.loading : t.notifSendBroadcast}
                  </button>
                </form>
              </div>
            </div>
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "features"}
            title={t.futureFeatures}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.futureFeatures}
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.futureFeaturesBody}
            </p>
            <form onSubmit={savePlatformOptions} className="mt-2 space-y-5">
              {(
                [
                  ["hospitalAccess", t.hospitalAccess, t.hospitalAccessHint],
                  ["orgAds", t.orgAds, t.orgAdsHint],
                  ["futureServices", t.futureServices, t.futureServicesHint],
                ] as const
              ).map(([key, title, hint]) => (
                <div
                  key={key}
                  className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{title}</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={platformOptions[key].enabled}
                        onChange={(e) =>
                          setPlatformOptions((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], enabled: e.target.checked },
                          }))
                        }
                      />
                      {platformOptions[key].enabled
                        ? t.featureEnabled
                        : t.featureDisabled}
                    </label>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                    {hint}
                  </p>
                  <label className="mt-3 block text-sm">
                    <span className="mb-1 block font-medium">{t.featureNotes}</span>
                    <textarea
                      className="field min-h-16"
                      value={platformOptions[key].notes}
                      onChange={(e) =>
                        setPlatformOptions((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], notes: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
              <button type="submit" className="btn-primary">
                {t.saveChanges}
              </button>
            </form>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "appearance"}
            title={t.siteAppearance}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.siteAppearance}
            </h2>
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.siteAppearanceHint}
            </p>
            <form onSubmit={saveSiteAppearance} className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium">{t.logoUpload}</span>
                <input
                  className="field"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={appearanceUploading === "logo"}
                  onChange={(e) => {
                    void uploadAppearanceImage(
                      e.target.files?.[0] || null,
                      "logoUrl",
                    );
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                className="field md:col-span-2"
                placeholder={t.logoUrl}
                value={siteAppearance.logoUrl}
                onChange={(e) =>
                  setSiteAppearance((s) => ({ ...s, logoUrl: e.target.value }))
                }
              />
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium">
                  {t.heroBackgroundUpload}
                </span>
                <input
                  className="field"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={appearanceUploading === "hero"}
                  onChange={(e) => {
                    void uploadAppearanceImage(
                      e.target.files?.[0] || null,
                      "heroBackgroundUrl",
                    );
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                className="field md:col-span-2"
                placeholder={t.heroBackgroundUrl}
                value={siteAppearance.heroBackgroundUrl}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    heroBackgroundUrl: e.target.value,
                  }))
                }
              />
              <input
                className="field md:col-span-2"
                placeholder={t.brandName}
                value={siteAppearance.brand}
                onChange={(e) =>
                  setSiteAppearance((s) => ({ ...s, brand: e.target.value }))
                }
              />
              <input
                className="field"
                placeholder={t.taglineEnLabel}
                value={siteAppearance.taglineEn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({ ...s, taglineEn: e.target.value }))
                }
              />
              <input
                className="field"
                placeholder={t.taglineBnLabel}
                value={siteAppearance.taglineBn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({ ...s, taglineBn: e.target.value }))
                }
              />
              <textarea
                className="field min-h-20"
                placeholder={t.heroSupportEnLabel}
                value={siteAppearance.heroSupportEn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    heroSupportEn: e.target.value,
                  }))
                }
              />
              <textarea
                className="field min-h-20"
                placeholder={t.heroSupportBnLabel}
                value={siteAppearance.heroSupportBn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    heroSupportBn: e.target.value,
                  }))
                }
              />
              <input
                className="field"
                placeholder={t.aboutTitleEnLabel}
                value={siteAppearance.aboutTitleEn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    aboutTitleEn: e.target.value,
                  }))
                }
              />
              <input
                className="field"
                placeholder={t.aboutTitleBnLabel}
                value={siteAppearance.aboutTitleBn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    aboutTitleBn: e.target.value,
                  }))
                }
              />
              <textarea
                className="field min-h-24"
                placeholder={t.aboutBodyEnLabel}
                value={siteAppearance.aboutBodyEn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    aboutBodyEn: e.target.value,
                  }))
                }
              />
              <textarea
                className="field min-h-24"
                placeholder={t.aboutBodyBnLabel}
                value={siteAppearance.aboutBodyBn}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    aboutBodyBn: e.target.value,
                  }))
                }
              />
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium">{t.founderPhotoUpload}</span>
                <span className="mb-2 block text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                  {t.uploadImageHint}
                </span>
                <input
                  className="field"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  disabled={appearanceUploading === "founder"}
                  onChange={(e) => {
                    void uploadAppearanceImage(
                      e.target.files?.[0] || null,
                      "founderPhotoUrl",
                    );
                    e.target.value = "";
                  }}
                />
                {appearanceUploading === "founder" ? (
                  <span className="mt-1 block text-xs">{t.bannerUploading}</span>
                ) : null}
              </label>
              {siteAppearance.founderPhotoUrl ? (
                <div className="md:col-span-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={siteAppearance.founderPhotoUrl}
                    alt={t.creatorName}
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-[color-mix(in_oklab,var(--blood)_25%,white)]"
                  />
                </div>
              ) : null}
              <input
                className="field md:col-span-2"
                placeholder={t.founderPhotoUrl}
                value={siteAppearance.founderPhotoUrl}
                onChange={(e) =>
                  setSiteAppearance((s) => ({
                    ...s,
                    founderPhotoUrl: e.target.value,
                  }))
                }
              />
              <button type="submit" className="btn-primary md:col-span-2">
                {t.saveAppearance}
              </button>
            </form>

            <div className="mt-8 space-y-3 border-t border-[var(--line)] pt-6">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
                {t.adminPendingStories}
              </h3>
              <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                {t.adminPendingStoriesHint}
              </p>
              {pendingStories.length === 0 ? (
                <p className="text-sm opacity-70">{t.adminNoPendingStories}</p>
              ) : (
                <ul className="space-y-3">
                  {pendingStories.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {s.name}
                        {s.handle ? (
                          <span className="ml-2 font-normal opacity-70">
                            {s.handle}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-2 leading-relaxed">
                        {s.quoteBn || s.quoteEn}
                      </p>
                      <p className="mt-1 text-xs opacity-60">
                        {new Date(s.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-[#2f6b4f] px-3 py-1.5 text-xs font-semibold text-white"
                          onClick={() => void decideStory(s.id, "approve")}
                        >
                          {t.adminApproveStory}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
                          onClick={() => void decideStory(s.id, "reject")}
                        >
                          {t.adminRejectStory}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-8 space-y-3 border-t border-[var(--line)] pt-6">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
                {t.adminPublishedStories}
              </h3>
              <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                {t.adminPublishedStoriesHint}
              </p>
              {(siteAppearance.successStories || []).length === 0 ? (
                <p className="text-sm opacity-70">{t.adminNoPublishedStories}</p>
              ) : (
                <ul className="space-y-3">
                  {(siteAppearance.successStories || []).map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {s.name}
                        {s.handle ? (
                          <span className="ml-2 font-normal opacity-70">
                            {s.handle}
                          </span>
                        ) : null}
                        {!s.enabled ? (
                          <span className="ml-2 text-xs text-[var(--blood)]">
                            ({t.disabled})
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-2 leading-relaxed">
                        {s.quoteBn || s.quoteEn}
                      </p>
                      <button
                        type="button"
                        className="mt-3 rounded-full border border-[var(--blood)] px-3 py-1.5 text-xs font-semibold text-[var(--blood)]"
                        onClick={() => void deletePublishedStory(s.id)}
                      >
                        {t.adminDeleteStory}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "ads"}
            title={t.orgBanners}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.orgBanners}
            </h2>
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.orgBannersHint}
            </p>
            <label className="block max-w-xs text-sm">
              <span className="mb-1 block font-medium">{t.orgBannerSlideInterval}</span>
              <select
                className="field"
                value={bannerSlideIntervalSec}
                disabled={bannerIntervalSaving}
                onChange={(e) => {
                  const sec = Number(e.target.value);
                  setBannerSlideIntervalSec(sec);
                  void saveBannerSlideInterval(sec);
                }}
              >
                {BANNER_SLIDE_INTERVAL_OPTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} {t.orgBannerSlideIntervalUnit}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {t.orgBannerSlideIntervalHint}
              </span>
            </label>
            <div
              className="rounded-xl border border-[color-mix(in_oklab,var(--accent)_35%,white)] bg-[color-mix(in_oklab,var(--accent)_8%,white)] p-4 text-sm"
              role="note"
            >
              <p className="font-semibold text-[var(--ink)]">{t.orgBannerSizeTitle}</p>
              <ul className="mt-2 space-y-1 text-[color-mix(in_oklab,var(--ink)_75%,white)]">
                <li>
                  <span className="font-medium">{t.orgBannerSizeDimensions}</span>
                  <span className="ml-2 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    ({AD_BANNER_WIDTH}×{AD_BANNER_HEIGHT} px · {AD_BANNER_ASPECT})
                  </span>
                </li>
                <li>{t.orgBannerSizeRatio}</li>
                <li>{t.orgBannerSizeDisplay}</li>
                <li>{t.orgBannerSizeFormats}</li>
              </ul>
            </div>
            <form onSubmit={addBanner} className="grid gap-3 md:grid-cols-3">
              <input
                className="field md:col-span-3"
                placeholder={t.bannerTitle}
                value={bannerDraft.title}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, title: e.target.value }))
                }
                required
              />
              <label className="block text-sm md:col-span-3">
                <span className="mb-1 block font-medium">{t.bannerUpload}</span>
                <input
                  className="field"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={bannerUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    void uploadBannerImage(file);
                    e.target.value = "";
                  }}
                />
                {bannerUploading ? (
                  <span className="mt-1 block text-xs">{t.bannerUploading}</span>
                ) : (
                  <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {t.orgBannerSizeDimensions} · {t.orgBannerSizeRatio}
                  </span>
                )}
              </label>
              <input
                className="field"
                placeholder={t.bannerImage}
                value={bannerDraft.imageUrl}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, imageUrl: e.target.value }))
                }
              />
              <input
                className="field md:col-span-2"
                placeholder={t.bannerLink}
                value={bannerDraft.linkUrl}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, linkUrl: e.target.value }))
                }
              />
              <label className="block text-sm md:col-span-3">
                <span className="mb-1 block font-medium">{t.bannerPage}</span>
                <select
                  className="field"
                  value={bannerDraft.page}
                  onChange={(e) =>
                    setBannerDraft((d) => ({
                      ...d,
                      page: e.target.value as BannerPage,
                    }))
                  }
                >
                  <option value="home">{t.bannerPageHome}</option>
                  <option value="find">{t.bannerPageFind}</option>
                  <option value="requests">{t.bannerPageRequests}</option>
                  <option value="about">{t.bannerPageAbout}</option>
                  <option value="ambulance">{t.bannerPageAmbulance}</option>
                  <option value="all">{t.bannerPageAll}</option>
                </select>
                <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.orgBannerSizeDisplay}
                </span>
              </label>
              {bannerDraft.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerDraft.imageUrl}
                  alt=""
                  className="aspect-[820/150] w-full max-w-xl object-cover md:col-span-3"
                />
              ) : null}
              <button type="submit" className="btn-primary md:col-span-3">
                {t.addBanner}
              </button>
            </form>
            <ul className="space-y-2">
              {banners.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{b.title}</span>
                    <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                      {(b.pages || []).join(", ")} · 820×150 · dual placement
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) => {
                          const next = banners.map((x) =>
                            x.id === b.id
                              ? { ...x, enabled: e.target.checked }
                              : x,
                          );
                          setBanners(next);
                          void saveBanners(next);
                        }}
                      />
                      {b.enabled ? t.featureEnabled : t.featureDisabled}
                    </label>
                    <button
                      type="button"
                      className="btn-ghost text-[var(--blood)]"
                      onClick={() => {
                        const next = banners.filter((x) => x.id !== b.id);
                        setBanners(next);
                        void saveBanners(next);
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "privacy"}
            title={t.adminPrivacy}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminPrivacy}
            </h2>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Privacy (BN)</span>
              <textarea
                className="field min-h-40"
                value={privacyBn}
                onChange={(e) => setPrivacyBn(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Privacy (EN)</span>
              <textarea
                className="field min-h-40"
                value={privacyEn}
                onChange={(e) => setPrivacyEn(e.target.value)}
              />
            </label>
            <button type="button" className="btn-primary" onClick={savePrivacy}>
              {t.saveChanges}
            </button>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "credentials"}
            title={t.changeCredentials}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.changeCredentials}
            </h2>
            <p className="mt-1 text-sm">
              {t.adminUsername}: <strong>{settingsUser}</strong>
            </p>
            <form onSubmit={saveCredentials} className="mt-3 space-y-3">
              <PasswordField
                id="admin-current-password"
                label={t.currentPassword}
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                autoComplete="current-password"
              />
              <input
                className="field"
                placeholder={t.newUsername}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <PasswordField
                id="admin-new-password"
                label={t.newPassword}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <button type="submit" className="btn-primary">
                {t.saveChanges}
              </button>
            </form>
          </div>

          
          </AdminSettingsPanel>

          <AdminSettingsPanel
            open={settingsPanel === "verify"}
            title={t.verifyContacts}
            onClose={() => setSettingsPanel(null)}
            wide
          >
            <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.verifyContacts}
            </h2>
            <p className="mt-1 text-sm">
              Email: {emailVerified ? t.verified : t.notVerified} · Phone:{" "}
              {phoneVerified ? t.verified : t.notVerified}
            </p>
            <form onSubmit={setupVerify} className="mt-3 space-y-3">
              <input
                className="field"
                type="email"
                placeholder={t.verifyEmail}
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
              />
              <input
                className="field"
                placeholder={t.verifyPhone}
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                {t.sendCodes}
              </button>
            </form>
            {tempCodes ? (
              <p className="mt-2 text-xs text-[var(--blood-deep)]">{tempCodes}</p>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <input
                  className="field"
                  placeholder={`Email ${t.enterCode}`}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => confirmCode("email")}
                >
                  {t.verify} email
                </button>
              </div>
              <div className="space-y-2">
                <input
                  className="field"
                  placeholder={`Phone ${t.enterCode}`}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => confirmCode("phone")}
                >
                  {t.verify} phone
                </button>
              </div>
            </div>
          </div>
          </AdminSettingsPanel>

          <AdminPopup
            open={savePopup}
            title={t.savedPopupTitle}
            body={settingsMsg || t.savedPopupBody}
            confirmLabel={t.close}
            onClose={() => setSavePopup(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
