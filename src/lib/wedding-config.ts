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
