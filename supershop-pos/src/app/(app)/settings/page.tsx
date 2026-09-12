import { SettingsForm } from "@/components/SettingsForm";
import { readStore } from "@/lib/store";

export default async function SettingsPage() {
  const store = await readStore();
  const settings = {
    shopName: store.settings.shopName,
    tagline: store.settings.tagline,
    address: store.settings.address,
    phone: store.settings.phone,
    currency: store.settings.currency,
  };

  return (
    <div>
      <div className="mb-4 anim-rise">
        <h1 className="display text-4xl font-semibold md:text-5xl">Settings</h1>
        <p className="text-[var(--ink-soft)]/75">
          Shop identity, currency, and till PIN.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
