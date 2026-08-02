export type LocalizedText = {
  en: string;
  ar: string;
};

export type WeddingConfig = {
  groom: LocalizedText;
  bride: LocalizedText;
  /** ISO local datetime used for countdown + calendar */
  datetime: string;
  dateLabel: LocalizedText;
  timeLabel: LocalizedText;
  venue: LocalizedText;
  city: LocalizedText;
  mapsUrl: string;
  /** Digits only, country code included — e.g. 2010xxxxxxxx */
  whatsapp: string;
  video: string;
  poster: string;
  occasion: LocalizedText;
};

export type WeddingRsvp = {
  id: string;
  createdAt: number;
  name: string;
  attending: "yes" | "no";
  message: string;
  signature: string | null;
  lang: "en" | "ar";
};

export type WeddingLang = "en" | "ar";

export const defaultWeddingConfig: WeddingConfig = {
  groom: {
    en: "Mostafa",
    ar: "مصطفى",
  },
  bride: {
    en: "Wafaa",
    ar: "وفاء",
  },
  datetime: "2026-08-16T19:00:00",
  dateLabel: {
    en: "August 16, 2026",
    ar: "١٦ أغسطس ٢٠٢٦",
  },
  timeLabel: {
    en: "From 7:00 PM",
    ar: "من الساعة ٧ مساءً",
  },
  venue: {
    en: "Villa Laguna",
    ar: "ڤيلا لاجونا",
  },
  city: {
    en: "El Mariouteya, Giza",
    ar: "المريوطية، الجيزة",
  },
  mapsUrl: "https://maps.app.goo.gl/x87YVGmbxkJ15m3g6?g_st=ic",
  whatsapp: "201000000000",
  video: "/wedding/invite.mp4",
  poster: "/wedding/invite-poster.jpg",
  occasion: {
    en: "Wedding Celebration",
    ar: "حفل زفاف",
  },
};

/** @deprecated use defaultWeddingConfig — kept for older imports */
export const weddingConfig = defaultWeddingConfig;

function isLocalized(value: unknown): value is LocalizedText {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as {en?: unknown}).en === "string" &&
    typeof (value as {ar?: unknown}).ar === "string"
  );
}

export function normalizeWeddingConfig(input: unknown): WeddingConfig {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Partial<WeddingConfig>;
  const pickLocalized = (value: unknown, fallback: LocalizedText): LocalizedText =>
    isLocalized(value)
      ? {en: value.en.trim() || fallback.en, ar: value.ar.trim() || fallback.ar}
      : fallback;

  return {
    groom: pickLocalized(raw.groom, defaultWeddingConfig.groom),
    bride: pickLocalized(raw.bride, defaultWeddingConfig.bride),
    datetime:
      typeof raw.datetime === "string" && raw.datetime.trim()
        ? raw.datetime.trim()
        : defaultWeddingConfig.datetime,
    dateLabel: pickLocalized(raw.dateLabel, defaultWeddingConfig.dateLabel),
    timeLabel: pickLocalized(raw.timeLabel, defaultWeddingConfig.timeLabel),
    venue: pickLocalized(raw.venue, defaultWeddingConfig.venue),
    city: pickLocalized(raw.city, defaultWeddingConfig.city),
    mapsUrl:
      typeof raw.mapsUrl === "string" && raw.mapsUrl.trim()
        ? raw.mapsUrl.trim()
        : defaultWeddingConfig.mapsUrl,
    whatsapp:
      typeof raw.whatsapp === "string"
        ? raw.whatsapp.replace(/\D/g, "") || defaultWeddingConfig.whatsapp
        : defaultWeddingConfig.whatsapp,
    video:
      typeof raw.video === "string" && raw.video.trim()
        ? raw.video.trim()
        : defaultWeddingConfig.video,
    poster:
      typeof raw.poster === "string" && raw.poster.trim()
        ? raw.poster.trim()
        : defaultWeddingConfig.poster,
    occasion: pickLocalized(raw.occasion, defaultWeddingConfig.occasion),
  };
}
