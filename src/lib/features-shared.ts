/**
 * Launch switches. Safe to import from client code (no server-only imports here).
 *
 * Verification is deliberately split in three, so it can be phased in:
 *  - collectDocuments : sellers upload documents and buyers see a checklist
 *  - aiScreening      : automatic risk screen of every new listing (consistency, duplicates, price outliers, red-flag wording)
 *  - humanReview      : staff verify documents; only then does a listing earn the "Verified" badge
 */
export type Features = {
  collectDocuments: boolean;
  aiScreening: boolean;
  humanReview: boolean;
  brokers: boolean;
  tracking: boolean;
  consentBanner: boolean;
  unlockLimitPerDay: number;
  /** In-app notification inbox — no external dependency, safe to default on. */
  notifyInApp: boolean;
  /** Needs a provider configured in env (see src/lib/notify.ts); the toggle alone sends nothing. */
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
};

export const DEFAULT_FEATURES: Features = {
  collectDocuments: false, // owners and buyers usually discuss papers after meeting offline
  aiScreening: true,
  humanReview: false,
  brokers: false, // no broker team confirmed yet
  tracking: true,
  consentBanner: true,
  unlockLimitPerDay: 20,
  notifyInApp: true,
  notifyEmail: false, // off until an email provider is wired in (see src/lib/notify.ts)
  notifyWhatsapp: false, // off until a WhatsApp/SMS provider is wired in
};

const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

export function cleanFeatures(raw: unknown): Features {
  const r = (raw ?? {}) as Partial<Record<keyof Features, unknown>>;
  const d = DEFAULT_FEATURES;
  const limit = Number(r.unlockLimitPerDay);
  return {
    collectDocuments: bool(r.collectDocuments, d.collectDocuments),
    aiScreening: bool(r.aiScreening, d.aiScreening),
    humanReview: bool(r.humanReview, d.humanReview),
    brokers: bool(r.brokers, d.brokers),
    tracking: bool(r.tracking, d.tracking),
    consentBanner: bool(r.consentBanner, d.consentBanner),
    unlockLimitPerDay: Number.isFinite(limit) ? Math.min(200, Math.max(1, Math.round(limit))) : d.unlockLimitPerDay,
    notifyInApp: bool(r.notifyInApp, d.notifyInApp),
    notifyEmail: bool(r.notifyEmail, d.notifyEmail),
    notifyWhatsapp: bool(r.notifyWhatsapp, d.notifyWhatsapp),
  };
}
