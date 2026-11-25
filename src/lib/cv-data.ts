import type {Locale} from "@/i18n/routing";

export type CvProject = {
  name: string;
  emoji: string;
  playUrl?: string;
  appStoreUrl?: string;
  /** For work that isn't on an app store — the source of this site, for example. */
  siteUrl?: string;
  siteLabel?: string;
  /** Shown instead of store buttons — only where the app genuinely isn't public. */
  badge?: string;
  desc: string;
};

/**
 * CV content in both languages — the single registry read by the CV page and /llms.txt,
 * so what AI engines are pointed to never drifts from what the page shows.
 * Keep it in step with public/Mostafa_Omar_CV_EN.pdf.
 */
export function cvData(locale: Locale) {
  const isEn = locale === "en";

  const stats = [
    {value: "30+", label: isEn ? "Apps shipped" : "Выпущено приложений"},
    {value: "200K+", label: isEn ? "Downloads" : "Загрузок"},
    {value: "5", label: isEn ? "Years experience" : "Лет опыта"}
  ];

  const ticker = isEn
    ? [
        "30+ apps shipped",
        "200K+ downloads",
        "BLE & medical devices",
        "WebRTC video calls",
        "Native Swift · Kotlin · Java",
        "Cloudflare Workers + D1",
        "Clean Architecture",
        "iOS & Android"
      ]
    : [
        "30+ приложений",
        "200K+ загрузок",
        "BLE и медицинские устройства",
        "WebRTC видеозвонки",
        "Нативный Swift · Kotlin · Java",
        "Cloudflare Workers + D1",
        "Clean Architecture",
        "iOS и Android"
      ];

  const about = isEn
    ? "Software engineer with 5 years building and maintaining 30+ mobile apps across fintech, healthcare, fitness and e-commerce — 10 of them live on the stores with over 200,000 downloads. Strongest where Flutter meets native: Swift, Kotlin and Java bridging, BLE device communication and WebRTC video. I rebuilt a native iOS and Android medical app as a single Flutter codebase in 8 months, and I design and ship the backends my own products run on: TypeScript on Cloudflare Workers with D1 (SQLite), REST APIs, session auth, in-app purchase verification and LLM integrations."
    : "Инженер-программист с опытом 5 лет: создал и поддерживаю 30+ мобильных приложений в сферах финтеха, здравоохранения, фитнеса и e-commerce — 10 из них опубликованы в сторах и собрали более 200 000 загрузок. Сильнее всего там, где Flutter встречается с нативным кодом: мосты на Swift, Kotlin и Java, работа с BLE-устройствами и видеосвязь на WebRTC. Переписал нативное iOS- и Android-приложение для медицины в единую Flutter-кодовую базу за 8 месяцев. Кроме мобильной части проектирую и запускаю бэкенды собственных продуктов: TypeScript на Cloudflare Workers с D1 (SQLite), REST API, сессионная авторизация, проверка внутренних покупок и интеграции с LLM.";

  const education = {
    degree: isEn ? "Bachelor of Software Engineering" : "Бакалавр по специальности «Программная инженерия»",
    school: isEn
      ? "Kazan National Research Technical University named after A. N. Tupolev (KNRTU-KAI)"
      : "Казанский национальный исследовательский технический университет им. А. Н. Туполева (КНИТУ-КАИ)",
    period: "2020 - 2024"
  };

  const skills = [
    {name: isEn ? "Mobile" : "Мобильная разработка", sub: "Flutter, Dart, Swift, Kotlin, Java"},
    {
      name: isEn ? "Native integration" : "Нативная интеграция",
      sub: isEn
        ? "MethodChannel, EventChannel, JNI, Swift bridging, iOS & Android SDKs"
        : "MethodChannel, EventChannel, JNI, Swift-мосты, iOS и Android SDK"
    },
    {
      name: isEn ? "Real-time & hardware" : "Real-time и оборудование",
      sub: isEn ? "BLE, WebRTC, WebSockets, push notifications" : "BLE, WebRTC, WebSockets, push-уведомления"
    },
    {
      name: isEn ? "Architecture & state" : "Архитектура и состояние",
      sub: "Clean Architecture, MVVM, Riverpod, Bloc, GetX"
    },
    {
      name: isEn ? "Backend & web" : "Бэкенд и веб",
      sub: isEn
        ? "TypeScript, Node.js, Next.js, Cloudflare Workers, D1/SQLite, REST API design, session auth, LLM APIs"
        : "TypeScript, Node.js, Next.js, Cloudflare Workers, D1/SQLite, проектирование REST API, сессионная авторизация, LLM API"
    },
    {
      name: isEn ? "App data" : "Данные в приложении",
      sub: isEn ? "REST APIs, Dio, Firebase, secure storage" : "REST API, Dio, Firebase, защищённое хранилище"
    },
    {
      name: isEn ? "Release & tooling" : "Релизы и инструменты",
      sub: isEn
        ? "Fastlane, App Store & Google Play publishing, Git, GitHub, Figma, AI-assisted development"
        : "Fastlane, публикация в App Store и Google Play, Git, GitHub, Figma, разработка с AI"
    }
  ];

  const experience = [
    {
      company: "Check Point Care",
      role: isEn ? "Flutter Developer · Remote" : "Flutter-разработчик · Удалённо",
      period: isEn ? "Feb 2025 - Present" : "Фев 2025 - по настоящее время",
      points: isEn
        ? [
            "Rebuilt a native iOS and Android medical app as one Flutter codebase in 8 months, keeping every BLE, camera and sensor feature.",
            "Built the BLE layer for the company's proprietary medical devices over platform channels, using native Swift, Java and JNI.",
            "Shipped real-time chat and WebRTC video calls for hospitals and healthcare providers."
          ]
        : [
            "Переписал нативное iOS- и Android-приложение для медицины в единую Flutter-кодовую базу за 8 месяцев, сохранив все функции BLE, камеры и датчиков.",
            "Разработал BLE-слой для собственных медицинских устройств компании через platform channels на нативных Swift, Java и JNI.",
            "Выпустил real-time чат и видеозвонки на WebRTC для больниц и медицинских центров."
          ]
    },
    {
      company: "Jeleapps",
      role: isEn ? "Flutter Developer · Remote" : "Flutter-разработчик · Удалённо",
      period: isEn
        ? "May 2022 - Present (part-time since Aug 2026)"
        : "Май 2022 - по настоящее время (частичная занятость с авг 2026)",
      points: isEn
        ? [
            "Led development and maintenance of 30+ Flutter apps for fintech, fitness, logistics and lifestyle clients; 10 are live on the stores with over 200,000 total downloads.",
            "Mentored 5 junior developers and owned architecture decisions and code review.",
            "Reduced crashes, startup time, app size and unnecessary widget rebuilds across client apps by choosing the right widget for each UI element and the right state management for each app."
          ]
        : [
            "Руководил разработкой и поддержкой 30+ Flutter-приложений для клиентов из финтеха, фитнеса, логистики и лайфстайла; 10 из них опубликованы в сторах и собрали более 200 000 загрузок.",
            "Был наставником для 5 junior-разработчиков, отвечал за архитектурные решения и код-ревью.",
            "Снизил количество крашей, время запуска, размер приложений и лишние перестроения виджетов: подбирал правильный виджет под каждый элемент интерфейса и подходящий state management под каждое приложение."
          ]
    },
    {
      company: "TicketGO",
      role: isEn ? "Flutter Developer (contract) · Remote" : "Flutter-разработчик (контракт) · Удалённо",
      period: isEn ? "Sep 2025 - Present" : "Сен 2025 - по настоящее время",
      points: isEn
        ? [
            "Maintain and improve TicketGO.uz, an event ticketing app for Uzbekistan with seat selection on an interactive map; 5K+ downloads on Google Play.",
            "Improved how tickets are displayed, refined the UI, made the app faster and resolved production bugs."
          ]
        : [
            "Поддерживаю и развиваю TicketGO.uz — приложение для продажи билетов на мероприятия в Узбекистане с выбором мест на интерактивной карте; 5K+ загрузок в Google Play.",
            "Улучшил отображение билетов, доработал интерфейс, ускорил приложение и закрыл продакшн-баги."
          ]
    },
    {
      company: "TVELVI IT",
      role: isEn ? "Flutter Developer (contract) · Remote" : "Flutter-разработчик (контракт) · Удалённо",
      period: isEn ? "Feb 2025 - Present" : "Фев 2025 - по настоящее время",
      points: isEn
        ? [
            "Took over and owned SuperApp (СуперАп), a marketplace, food-ordering and delivery app with built-in chat, now live on the App Store and Google Play.",
            "Led delivery of the whole app with a Laravel backend developer and a second Flutter developer.",
            "Released the app to both stores after about 9 months of continuous iteration, with builds automated through Fastlane.",
            "Building a second product: a live video commerce app where sellers host livestreams and sell interactively."
          ]
        : [
            "Принял и вёл SuperApp (СуперАп) — маркетплейс с доставкой еды и встроенным чатом, сейчас доступен в App Store и Google Play.",
            "Руководил выпуском всего приложения вместе с backend-разработчиком на Laravel и вторым Flutter-разработчиком.",
            "Выпустил приложение в оба стора примерно за 9 месяцев непрерывной работы, сборки автоматизированы через Fastlane.",
            "Разрабатываю второй продукт: приложение live-коммерции, где продавцы ведут трансляции и продают в прямом эфире."
          ]
    },
    {
      company: "CodeDream",
      role: isEn ? "Flutter Developer (contract) · Remote" : "Flutter-разработчик (контракт) · Удалённо",
      period: isEn ? "Feb 2024 - Dec 2024" : "Фев 2024 - Дек 2024",
      points: isEn
        ? [
            "Developed a custom VPN mobile app in 6 months, covering the Flutter UI and backend integration.",
            "Wrote native Swift code to bridge Flutter with the iOS VPN APIs through MethodChannel."
          ]
        : [
            "Разработал кастомное VPN-приложение за 6 месяцев: интерфейс на Flutter и интеграция с бэкендом.",
            "Написал нативный Swift-код, связывающий Flutter с iOS VPN API через MethodChannel."
          ]
    },
    {
      company: "PUSK",
      role: isEn ? "Flutter Developer (contract) · Remote" : "Flutter-разработчик (контракт) · Удалённо",
      period: isEn ? "Apr 2023 - Nov 2023" : "Апр 2023 - Ноя 2023",
      points: isEn
        ? [
            "Resolved performance bottlenecks and critical bugs in a live construction supply app.",
            "Refactored the state management logic, improving UI responsiveness and stability."
          ]
        : [
            "Устранил узкие места в производительности и критические баги в работающем приложении для снабжения стройки.",
            "Отрефакторил логику state management, повысив отзывчивость интерфейса и стабильность."
          ]
    }
  ];

  const projects: CvProject[] = [
    {
      name: "SuperApp (СуперАп)",
      emoji: "🛍️",
      appStoreUrl: "https://apps.apple.com/us/app/%D1%81%D1%83%D0%BF%D0%B5%D1%80-%D0%B0%D0%BF%D0%BF/id6749068479",
      playUrl: "https://play.google.com/store/apps/details?id=ru.super_app",
      desc: isEn
        ? "Marketplace, food-ordering and delivery platform in one app, with built-in chat between buyers, sellers and service providers."
        : "Маркетплейс, заказ еды и доставка в одном приложении, со встроенным чатом между покупателями, продавцами и исполнителями."
    },
    {
      name: "Pauzo",
      emoji: "💸",
      appStoreUrl: "https://apps.apple.com/app/pauzo-budget-spend-tracker/id6822202133",
      playUrl: "https://play.google.com/store/apps/details?id=com.pauzo.app",
      desc: isEn
        ? "My own product: a budgeting and spend tracker with an AI assistant. I built both the Flutter app and its backend — Cloudflare Workers with D1, device pairing, one-time purchase verification, entitlements, push, and an AI layer that falls back across Workers AI, Groq and Gemini."
        : "Мой собственный продукт: учёт бюджета и расходов с AI-ассистентом. Сделал и Flutter-приложение, и бэкенд к нему — Cloudflare Workers с D1, связывание устройств, проверка разовой покупки, доступы, push и AI-слой с переключением между Workers AI, Groq и Gemini."
    },
    {
      name: "TicketGO.uz",
      emoji: "🎟️",
      appStoreUrl: "https://apps.apple.com/us/app/ticketgo-uz/id6746220254",
      playUrl: "https://play.google.com/store/apps/details?id=uz.ticketgo.app",
      desc: isEn
        ? "Event ticketing for Uzbekistan with seat selection on an interactive map; 5K+ downloads on Google Play."
        : "Билеты на мероприятия в Узбекистане с выбором мест на интерактивной карте; 5K+ загрузок в Google Play."
    },
    {
      name: "Check Point Care",
      emoji: "🏥",
      badge: isEn ? "Private project" : "Приватный проект",
      desc: isEn
        ? "Native iOS and Android medical app rebuilt as a single Flutter codebase in 8 months, keeping BLE communication with proprietary medical devices, camera, sensors, real-time chat and WebRTC video calls."
        : "Нативное медицинское iOS- и Android-приложение, переписанное в единую Flutter-кодовую базу за 8 месяцев, с сохранением BLE-связи с собственными медицинскими устройствами, камеры, датчиков, чата и видеозвонков WebRTC."
    },
    {
      name: "Special Napoleon",
      emoji: "🍰",
      appStoreUrl:
        "https://apps.apple.com/us/app/%D0%BE%D1%81%D0%BE%D0%B1%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9-%D0%BD%D0%B0%D0%BF%D0%BE%D0%BB%D0%B5%D0%BE%D0%BD-1957-%D0%B3%D0%BE%D0%B4%D0%B0/id6739863135",
      playUrl: "https://play.google.com/store/apps/details?id=ru.napoleon",
      desc: isEn
        ? "Dessert ordering with same-day delivery, live courier tracking and loyalty points, shipped as separate Russia and Dubai editions; 10K+ downloads on Google Play."
        : "Заказ десертов с доставкой в день заказа, отслеживанием курьера и бонусами, выпущен отдельными версиями для России и Дубая; 10K+ загрузок в Google Play."
    },
    {
      name: "iH.plus",
      emoji: "🌿",
      appStoreUrl: "https://apps.apple.com/us/app/ih-plus/id6736610026",
      playUrl: "https://play.google.com/store/apps/details?id=app.herb.plus",
      desc: isEn
        ? "Cross-border e-commerce app for ordering dietary supplements from foreign manufacturers with delivery to pickup points across Russia."
        : "Трансграничный e-commerce для заказа БАДов у зарубежных производителей с доставкой в пункты выдачи по России."
    },
    {
      name: "K.PROFI 2.0",
      emoji: "🎁",
      appStoreUrl: "https://apps.apple.com/ru/app/k-profi-2-0/id1637130637?l=en",
      playUrl: "https://play.google.com/store/apps/details?id=ru.knauf.app",
      desc: isEn
        ? "Rewards app for Knauf users with receipt uploads and a points system."
        : "Приложение лояльности для пользователей Knauf с загрузкой чеков и системой баллов."
    },
    {
      name: "TekLub Cashback",
      emoji: "🧾",
      appStoreUrl: "https://apps.apple.com/us/app/teklub-cashback/id6449730378",
      playUrl: "https://play.google.com/store/apps/details?id=com.retail.cashback",
      desc: isEn
        ? "Seller loyalty app for Motul products with promotions, receipt scanning and points for prizes."
        : "Приложение лояльности для продавцов продукции Motul: акции, сканирование чеков и баллы на призы."
    },
    {
      name: "Jelesson",
      emoji: "🎓",
      appStoreUrl:
        "https://apps.apple.com/us/app/jelesson-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD-%D0%BA%D1%83%D1%80%D1%81%D1%8B/id6745595945",
      playUrl: "https://play.google.com/store/apps/details?id=com.jelesson.app",
      desc: isEn
        ? "Online learning app with courses and video lessons."
        : "Приложение для онлайн-обучения с курсами и видеоуроками."
    },
    {
      name: "Sportivity",
      emoji: "💪",
      appStoreUrl: "https://apps.apple.com/ru/app/sportivity-training-diary/id6462926975?l=en-GB",
      playUrl: "https://play.google.com/store/apps/details?id=com.sportivity.app",
      desc: isEn
        ? "Fitness app with a training diary and progress tracking."
        : "Фитнес-приложение с дневником тренировок и отслеживанием прогресса."
    },
    {
      name: "METO",
      emoji: "🧰",
      appStoreUrl: "https://apps.apple.com/us/app/meto-%D1%81%D0%BE%D1%82%D1%80%D1%83%D0%B4%D0%BD%D0%B8%D0%BA%D0%B8/id6504717534",
      playUrl: "https://play.google.com/store/apps/details?id=com.meto.employee",
      desc: isEn
        ? "Part-time job app where workers find shifts and receive fast payouts."
        : "Приложение для подработки: работники находят смены и быстро получают выплаты."
    },
    {
      name: "PUSK",
      emoji: "🏗️",
      appStoreUrl:
        "https://apps.apple.com/ru/app/%D0%BF%D1%83%D1%81%D0%BA-%D1%81%D0%BD%D0%B0%D0%B1%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5/id6444658259?l=en-GB",
      playUrl: "https://play.google.com/store/apps/details?id=app.pusk.pusk_mobile",
      desc: isEn
        ? "Construction supply app where I resolved performance bottlenecks and critical bugs and refactored the state management."
        : "Приложение для снабжения стройки: устранил узкие места в производительности и критические баги, отрефакторил state management."
    },
    {
      name: "mostafaomar.tech",
      emoji: "⚙️",
      siteUrl: "https://github.com/moustafadev/cv-site",
      siteLabel: isEn ? "Source on GitHub" : "Исходники на GitHub",
      desc: isEn
        ? "This site, and the backend Pauzo runs on: Next.js on Cloudflare Workers with D1 — REST API routes, session auth, a blog with comments and likes, an admin dashboard and traffic analytics."
        : "Этот сайт и бэкенд, на котором работает Pauzo: Next.js на Cloudflare Workers с D1 — REST API, сессионная авторизация, блог с комментариями и лайками, админ-панель и аналитика трафика."
    }
  ];

  const languages = [
    {name: isEn ? "Arabic" : "Арабский", level: isEn ? "Native" : "Родной"},
    {name: isEn ? "Russian" : "Русский", level: isEn ? "Conversational" : "Разговорный"},
    {name: isEn ? "English" : "Английский", level: isEn ? "Basic" : "Базовый"}
  ];

  return {stats, ticker, about, education, skills, experience, projects, languages};
}

export type CvData = ReturnType<typeof cvData>;
