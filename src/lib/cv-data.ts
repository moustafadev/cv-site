import type {Locale} from "@/i18n/routing";

/**
 * CV content in both languages — the single registry read by the CV page and /llms.txt,
 * so what AI engines are pointed to never drifts from what the page shows.
 */
export function cvData(locale: Locale) {
  const isEn = locale === "en";

  const stats = [
    {value: "30+", label: isEn ? "Apps shipped" : "Выпущено приложений"},
    {value: "4+", label: isEn ? "Years experience" : "Лет опыта"},
    {value: "5", label: isEn ? "Industries" : "Сфер"}
  ];

  const ticker = isEn
    ? ["30+ apps shipped", "BLE & IoT", "WebRTC video calls", "Clean Architecture", "Native Swift · Kotlin · Java", "Riverpod · Bloc", "iOS & Android"]
    : ["30+ приложений", "BLE и IoT", "WebRTC видеозвонки", "Clean Architecture", "Нативный Swift · Kotlin · Java", "Riverpod · Bloc", "iOS и Android"];

  const about = isEn
    ? "Passionate Flutter developer with 4+ years of experience building scalable and adaptive mobile apps. Strong track record in leading teams and delivering projects end-to-end. Skilled in BLE, WebRTC, clean architecture, state management, and native integrations with Java, Kotlin, and Swift."
    : "Увлечённый Flutter-разработчик с более чем 4-летним опытом создания масштабируемых и адаптивных мобильных приложений. Подтверждённая способность руководить командами и самостоятельно управлять проектами от концепции до деплоя. Опыт интеграции BLE и WebRTC, глубокое знание чистой архитектуры и управления состоянием. Уверенный опыт интеграции нативного кода — Java, Kotlin и Swift — для взаимодействия с платформозависимыми функциями и сторонними SDK.";

  const education = {
    degree: isEn ? "Bachelor in Software Engineering" : "Бакалавр по специальности «Программная инженерия»",
    school: isEn
      ? "Kazan National Research Technical University named after A. N. Tupolev (KNRTU-KAI)"
      : "Казанский национальный исследовательский технический университет им. А.Н. Туполева (КНИТУ-КАИ)",
    period: "2020 - 2024"
  };

  const skills = [
    {name: isEn ? "Languages" : "Языки", sub: "Dart, Java, Kotlin, Swift"},
    {name: isEn ? "Cross-platform" : "Кросс-платформа", sub: "Flutter (Android и iOS)"},
    {name: isEn ? "Native integration" : "Нативная интеграция", sub: "MethodChannel, EventChannel, JNI, Swift"},
    {name: isEn ? "State management" : "Управление состоянием", sub: "Riverpod, Bloc, GetX"},
    {name: isEn ? "Architecture" : "Архитектура", sub: "MVVM, MVC, Clean Architecture"},
    {name: isEn ? "API & tools" : "API и инструменты", sub: "REST API, Dio, Firebase, WebRTC, BLE"},
    {name: isEn ? "Tooling" : "Инструменты", sub: "Git, GitHub, Firebase, Cursor Pro, Figma"},
    {name: isEn ? "Other" : "Прочее", sub: "Адаптивный UI, Push-уведомления, Syncfusion Charts"}
  ];

  const experience = [
    {
      company: "Jeleapps",
      role: isEn ? "Middle+ Flutter Developer" : "Middle+ Flutter",
      period: isEn ? "May 2022 - Present" : "Май 2022 - По настоящее время",
      points: isEn
        ? [
            "Led development and support for 30+ Flutter apps across fintech, fitness, logistics, and lifestyle domains.",
            "Served as a key engineer for complex bugs and architecture decisions; mentored junior developers.",
            "Continuously improved performance, scalability, and maintainability of large codebases."
          ]
        : [
            "Руководил разработкой и поддержкой 30+ Flutter-приложений в сферах финтех, фитнес, логистика и лайфстайл.",
            "Выступал ключевым специалистом по сложным багам и архитектурным решениям, наставником для junior-разработчиков.",
            "Непрерывно улучшал производительность, масштабируемость и поддерживаемость крупных кодовых баз."
          ]
    },
    {
      company: "CodeDream",
      role: isEn ? "Middle Flutter Developer" : "Middle Flutter",
      period: isEn ? "Feb 2024 - Dec 2024" : "Фев 2024 - Дек 2024",
      points: isEn
        ? [
            "Built a custom VPN application including frontend and backend integration.",
            "Implemented native Swift bridge for iOS VPN API integration via MethodChannel.",
            "Delivered a secure high-performance VPN with seamless Flutter-native interoperability."
          ]
        : [
            "Разработал кастомное VPN-приложение: фронтенд и бэкенд-интеграция.",
            "Написал нативный Swift-код для связи Flutter с iOS VPN API через MethodChannel.",
            "Реализовал высокопроизводительный безопасный VPN с бесшовным Flutter-native интерфейсом."
          ]
    },
    {
      company: "Check Point Care",
      role: isEn ? "Middle Flutter Developer" : "Middle Flutter",
      period: isEn ? "Feb 2025 - Apr 2026" : "Фев 2025 - Апр 2026",
      points: isEn
        ? [
            "Rebuilt a fully native iOS/Android product in Flutter while preserving BLE, camera, sensor, and video-call integrations.",
            "Integrated native Swift and Java code to support BLE communication with devices.",
            "Implemented real-time chat and WebRTC video calling."
          ]
        : [
            "Переписал полностью нативное iOS/Android-приложение на Flutter с сохранением интеграций BLE, камеры, датчиков и видеосвязи.",
            "Интегрировал нативный Swift и Java-код для поддержки BLE-коммуникации с устройствами.",
            "Внедрил real-time чат и видеозвонки через WebRTC."
          ]
    },
    {
      company: "TVELVI IT (Freelance)",
      role: isEn ? "Middle Flutter Developer" : "Middle Flutter",
      period: isEn ? "May 2025 - Present" : "Май 2025 - По настоящее время",
      points: isEn
        ? [
            "Built a multi-vendor marketplace with store creation, product publishing, and delivery management.",
            "Created a live-commerce application where sellers stream and sell in real time.",
            "Owned frontend and backend integration, ensuring scalable architecture and stable deployment."
          ]
        : [
            "Проект 1: Разработал многовендорный маркетплейс: создание магазинов, публикация товаров, управление доставкой.",
            "Проект 2: Создал приложение live-коммерции — продавцы ведут прямые трансляции и продают товары в реальном времени.",
            "Управлял фронтендом и бэкендом, обеспечил масштабируемую архитектуру и стабильный деплой."
          ]
    }
  ];

  const projects = [
    {
      name: "Check Point Care",
      emoji: "🏥",
      playUrl: "",
      appStoreUrl: "",
      desc: isEn
        ? "Migrated a native iOS/Android medical app to Flutter with BLE device communication, WebRTC video calls, and messaging."
        : "Миграция нативного медицинского iOS/Android-приложения на Flutter с BLE, WebRTC-видеозвонками и мессенджингом."
    },
    {
      name: "PUSK",
      emoji: "🏗️",
      playUrl: "https://play.google.com/store/apps/details?id=app.pusk.pusk_mobile",
      appStoreUrl: "https://apps.apple.com/ru/app/%D0%BF%D1%83%D1%81%D0%BA-%D1%81%D0%BD%D0%B0%D0%B1%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5/id6444658259?l=en-GB",
      desc: isEn
        ? "Refactored major app components to improve maintainability, performance, and stability."
        : "Рефакторинг ключевых компонентов для повышения поддерживаемости, производительности и стабильности."
    },
    {
      name: "Loygiftapp",
      emoji: "🛒",
      playUrl: "https://play.google.com/store/apps/details?id=com.japanexpress.app.loygift",
      appStoreUrl: "https://apps.apple.com/eg/app/loygift-2-0/id6547840076",
      desc: isEn
        ? "Worked on a family of shopping apps with the same core features and different themes/colors, maintaining multiple versions in parallel."
        : "Разработка серии shopping-приложений с общей функциональностью и разными темами/цветами, с параллельной поддержкой нескольких версий."
    },
    {
      name: "Wheelson",
      emoji: "🚗",
      playUrl: "https://play.google.com/store/apps/details?id=mena.mobilitycapital.wheelsOn&pcampaignid=web_share",
      appStoreUrl: "https://apps.apple.com/eg/app/wheelson-rent-your-ride/id6502835093",
      desc: isEn
        ? "Built a WebView-based car rental app with booking and payment integrations."
        : "Приложение аренды авто на базе WebView с интеграциями бронирования и оплаты."
    },
    {
      name: "K.PROFI 2.0",
      emoji: "🎁",
      playUrl: "https://play.google.com/store/apps/details?id=ru.knauf.app&pli=1",
      appStoreUrl: "https://apps.apple.com/ru/app/k-profi-2-0/id1637130637?l=en",
      desc: isEn
        ? "Rewards app for Knauf users with receipt uploads and a points system."
        : "Приложение лояльности для пользователей Knauf с загрузкой чеков и системой баллов."
    },
    {
      name: "SPORTIVITY",
      emoji: "💪",
      playUrl: "https://play.google.com/store/apps/details?id=com.sportivity.app",
      appStoreUrl: "https://apps.apple.com/ru/app/sportivity-training-diary/id6462926975?l=en-GB",
      desc: isEn
        ? "Fitness app with progress tracking and motivational features."
        : "Фитнес-приложение с трекингом прогресса и мотивационными функциями."
    },
    {
      name: "METO",
      emoji: "🧰",
      playUrl: "https://play.google.com/store/apps/details?id=com.meto.employee",
      appStoreUrl: "https://apps.apple.com/us/app/meto-%D1%81%D0%BE%D1%82%D1%80%D1%83%D0%B4%D0%BD%D0%B8%D0%BA%D0%B8/id6504717534",
      desc: isEn
        ? "A multifunctional app for finding part-time work and receiving payments quickly."
        : "Многофункциональное приложение для поиска подработки и быстрого получения выплат."
    }
  ];

  const languages = [
    {name: isEn ? "Arabic" : "Арабский", level: isEn ? "Native" : "Родной"},
    {name: isEn ? "Russian" : "Русский", level: isEn ? "Intermediate" : "Средний"},
    {name: isEn ? "English" : "Английский", level: isEn ? "Intermediate" : "Средний"}
  ];

  return {stats, ticker, about, education, skills, experience, projects, languages};
}

export type CvData = ReturnType<typeof cvData>;
