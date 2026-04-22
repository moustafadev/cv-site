import Image from "next/image";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {ContactForm} from "@/components/ContactForm";
import {isLocale} from "@/i18n/routing";

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isEn = locale === "en";

  const stats = [
    {value: "30+", label: isEn ? "Apps shipped" : "Выпущено приложений"},
    {value: "4+", label: isEn ? "Years experience" : "Лет опыта"},
    {value: "5", label: isEn ? "Industries" : "Сфер"}
  ];

  const contacts = [
    isEn ? "+7 918 724 95 22" : "+7 918 724 95 22",
    "mostafaomardev@gmail.com",
    isEn ? "Egypt, Cairo" : "Египет, Каир"
  ];

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

  return (
    <main className="container-page space-y-10 py-10">
      <section className="glass-card fade-up overflow-hidden p-6 md:p-9">
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-sky-700/70 bg-sky-900/30 px-3 py-1 text-xs text-sky-200">
              {isEn ? "Available for freelance" : "Открыт к фрилансу"}
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              {isEn ? "Flutter Developer" : "Flutter-разработчик"}
              <span className="block text-sky-300">{isEn ? "iOS & Android" : "iOS и Android"}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              {isEn
                ? "4+ years building production apps in fintech, fitness, healthcare and logistics with BLE, WebRTC and clean architecture."
                : "4+ года создаю продакшн-приложения для fintech, fitness, healthcare и logistics с BLE, WebRTC и clean architecture."}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {isEn ? "Open to new projects" : "Открыт для новых проектов"}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
              {contacts.map((item) => (
                <span key={item} className="rounded-full border border-slate-700 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a
                href="https://github.com/moustafadev"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 transition hover:text-sky-200"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/mostafa-omar-418622170"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 transition hover:text-sky-200"
              >
                LinkedIn
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#projects" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white">
                {isEn ? "View projects" : "Смотреть проекты"}
              </a>
              <a
                href={isEn ? "/Mostafa_Omar_CV_EN.pdf" : "/Mostafa_Omar_CV_RU.pdf"}
                download
                className="rounded-md border border-slate-600 px-4 py-2 text-sm transition hover:border-sky-400 hover:text-sky-200"
              >
                {isEn ? "Download CV" : "Скачать CV"}
              </a>
            </div>
          </div>

          <div className="profile-photo-wrap mx-auto md:ml-auto md:mr-0">
            <Image
              src="/profile-mostafa.png"
              alt={isEn ? "Mostafa Omar portrait" : "Фото Мустафы Омара"}
              width={260}
              height={260}
              priority
              className="profile-photo h-auto w-full max-w-[170px] md:max-w-[210px]"
            />
          </div>
        </div>
      </section>

      <section className="fade-up-delay-1 grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card hover-lift p-4 text-center">
            <div className="text-3xl font-bold text-sky-200">{stat.value}</div>
            <div className="mt-1 text-sm text-slate-300">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="fade-up-delay-1">
        <h2 className="section-title">{isEn ? "About me" : "О себе"}</h2>
        <article className="glass-card p-5">
          <p className="text-sm leading-7 text-slate-300">{about}</p>
        </article>
      </section>

      <section className="fade-up-delay-1">
        <h2 className="section-title">{isEn ? "Education" : "Образование"}</h2>
        <article className="glass-card p-5">
          <h3 className="font-semibold">{education.degree}</h3>
          <p className="mt-2 text-sm text-slate-300">{education.school}</p>
          <p className="mt-1 text-sm text-slate-400">{education.period}</p>
        </article>
      </section>

      <section id="projects" className="fade-up-delay-2">
        <h2 className="section-title">{isEn ? "Featured Projects" : "Избранные проекты"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.name} className="glass-card hover-lift p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">{project.emoji}</div>
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{project.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.playUrl ? (
                  <a
                    href={project.playUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md border border-slate-600 px-3 py-1.5 text-sm text-sky-300 transition hover:border-sky-400 hover:text-sky-200"
                  >
                    Play Store
                  </a>
                ) : null}
                {project.appStoreUrl ? (
                  <a
                    href={project.appStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md border border-slate-600 px-3 py-1.5 text-sm text-sky-300 transition hover:border-sky-400 hover:text-sky-200"
                  >
                    App Store
                  </a>
                ) : null}
                {!project.playUrl && !project.appStoreUrl ? (
                  <span className="inline-flex rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-400">
                    {isEn ? "Private project" : "Приватный проект"}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-up-delay-2">
        <h2 className="section-title">{isEn ? "Core Skills" : "Ключевые навыки"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((skill) => (
            <article key={skill.name} className="glass-card hover-lift p-4">
              <h3 className="font-medium">{skill.name}</h3>
              <p className="mt-1 text-sm text-slate-300">{skill.sub}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-up-delay-2">
        <h2 className="section-title">{isEn ? "Work Experience" : "Опыт работы"}</h2>
        <div className="space-y-4">
          {experience.map((item) => (
            <article key={`${item.company}-${item.period}`} className="glass-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{item.company}</h3>
                <span className="text-sm text-slate-400">{item.period}</span>
              </div>
              <p className="mt-1 text-sm text-sky-200">{item.role}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-up-delay-2">
        <h2 className="section-title">{isEn ? "Languages" : "Языки"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {languages.map((language) => (
            <article key={language.name} className="glass-card p-4">
              <h3 className="font-medium">{language.name}</h3>
              <p className="mt-1 text-sm text-slate-300">{language.level}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-up-delay-2">
        <h2 className="section-title">{isEn ? "Contact" : "Контакты"}</h2>
        <ContactForm locale={locale} />
      </section>
    </main>
  );
}
