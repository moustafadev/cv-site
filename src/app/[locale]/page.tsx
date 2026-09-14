import Image from "next/image";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {ExperienceAccordion} from "@/components/cv/ExperienceAccordion";
import {Reveal} from "@/components/cv/Reveal";
import {
  AppleIcon,
  ArrowUpRightIcon,
  DownloadIcon,
  GitHubIcon,
  GlobeIcon,
  GraduationIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  PlayStoreIcon,
  SparkleIcon,
  TargetIcon
} from "@/components/cv/icons";
import {isLocale} from "@/i18n/routing";

const EMAIL = "mostafaomardev@gmail.com";
const PHONE = "+20 109 493 0203";
const GITHUB = "https://github.com/moustafadev";
const LINKEDIN = "https://www.linkedin.com/in/mostafa-omar-418622170";

function SectionHeading({eyebrow, title, sub}: {eyebrow: string; title: string; sub?: string}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-accent">
        <SparkleIcon className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-white md:text-5xl">{title}</h2>
      {sub ? <p className="mt-3 text-lg text-white/60">{sub}</p> : null}
    </div>
  );
}

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
    {icon: <MailIcon />, label: EMAIL, href: `mailto:${EMAIL}`},
    {icon: <PhoneIcon />, label: PHONE, href: `tel:${PHONE.replace(/\s+/g, "")}`},
    {icon: <PinIcon />, label: isEn ? "Cairo, Egypt" : "Каир, Египет", href: null}
  ];

  const ticker = isEn
    ? ["30+ apps shipped", "BLE & IoT", "WebRTC video calls", "Clean Architecture", "Native Swift · Kotlin · Java", "Riverpod · Bloc", "iOS & Android"]
    : ["30+ приложений", "BLE и IoT", "WebRTC видеозвонки", "Clean Architecture", "Нативный Swift · Kotlin · Java", "Riverpod · Bloc", "iOS и Android"];

  const cvHref = isEn ? "/Mostafa_Omar_CV_EN.pdf" : "/Mostafa_Omar_CV_RU.pdf";

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
    <main className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-[120px]" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-14 py-14 md:py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="fade-up">
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-white/80">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
              {isEn ? "Available for freelance & new projects" : "Открыт к фрилансу и новым проектам"}
            </div>
            <p className="font-display text-2xl font-medium text-white/70 md:text-3xl">
              {isEn ? "Hey," : "Привет,"} <span className="wave inline-block">👋</span> {isEn ? "I’m" : "я"}
            </p>
            <h1 className="mt-2 font-display text-[clamp(3.2rem,10vw,6.5rem)] font-semibold leading-[0.95] tracking-tight text-white">
              {isEn ? "Mostafa Omar" : "Мустафа Омар"}
            </h1>
            <h2 className="mt-5 font-display text-2xl font-medium text-accent md:text-4xl">
              {isEn ? "Flutter Developer" : "Flutter-разработчик"}
              <span className="text-white/40"> · {isEn ? "iOS & Android" : "iOS и Android"}</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              {isEn
                ? "4+ years building production apps in fintech, fitness, healthcare and logistics with BLE, WebRTC and clean architecture."
                : "4+ года создаю продакшн-приложения для fintech, fitness, healthcare и logistics с BLE, WebRTC и clean architecture."}
            </p>

            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {contacts.map((item) => {
                const content = (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-accent">{item.icon}</span>
                    {item.label}
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a href={item.href} className="inline-flex items-center gap-3 text-sm text-white/80 transition hover:text-accent">
                        {content}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-3 text-sm text-white/80">{content}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={cvHref}
                download
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                <DownloadIcon className="h-4 w-4" />
                {isEn ? "Download CV" : "Скачать CV"}
              </a>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:border-accent hover:text-accent"
              >
                {isEn ? "View projects" : "Смотреть проекты"}
                <ArrowUpRightIcon />
              </a>
              <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub" className="cv-icon-btn">
                <GitHubIcon />
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="cv-icon-btn">
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Portrait framed by long hairlines, a lime glow and a spinning sparkle. */}
          <div className="fade-up-delay-1 relative mx-auto w-full max-w-[22rem] lg:max-w-none">
            <div className="pointer-events-none absolute -inset-x-16 top-0 h-px bg-white/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -inset-x-16 bottom-0 h-px bg-white/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -inset-y-16 left-0 w-px bg-white/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -inset-y-16 right-0 w-px bg-white/15" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-8 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
            <SparkleIcon className="spin-slow pointer-events-none absolute -right-5 -top-5 z-10 h-10 w-10 text-accent" />
            <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]">
              <Image
                src="/profile-mostafa.png"
                alt={isEn ? "Mostafa Omar" : "Мустафа Омар"}
                width={800}
                height={800}
                priority
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 z-10 rounded-2xl border border-white/10 bg-black/80 px-5 py-3 backdrop-blur md:-left-8">
              <div className="font-display text-3xl font-semibold text-accent">30+</div>
              <div className="text-xs text-white/60">{isEn ? "apps shipped" : "приложений"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ticker ---------- */}
      <section className="relative py-10" aria-label={isEn ? "Highlights" : "Ключевое"}>
        <div className="-mx-4 -rotate-[1.5deg] bg-accent py-4 text-black">
          <div className="ticker flex w-max">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                {ticker.map((item) => (
                  <li key={item} className="flex items-center gap-6 whitespace-nowrap px-6 font-display text-xl font-semibold md:text-2xl">
                    {item}
                    <SparkleIcon className="h-5 w-5" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-12">
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-[90px]" aria-hidden="true" />
            <div className="relative grid gap-8 md:grid-cols-[auto_1fr]">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-black">
                <TargetIcon className="h-8 w-8" />
              </span>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{isEn ? "About me" : "О себе"}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
                  {isEn ? "Mobile apps that ship — and keep working." : "Мобильные приложения, которые выходят в релиз и работают."}
                </h2>
                <p className="mt-5 text-base leading-8 text-white/60 md:text-lg">{about}</p>
                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="font-display text-4xl font-semibold text-accent md:text-5xl">{stat.value}</div>
                      <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Reveal delay={80}>
            <div className="h-full rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 text-accent">
                <GraduationIcon />
                <span className="text-sm font-medium uppercase tracking-[0.15em]">{isEn ? "Education" : "Образование"}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{education.degree}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{education.school}</p>
              <p className="mt-3 text-sm text-white/40">{education.period}</p>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="h-full rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 text-accent">
                <GlobeIcon />
                <span className="text-sm font-medium uppercase tracking-[0.15em]">{isEn ? "Languages" : "Языки"}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {languages.map((language) => (
                  <li key={language.name} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-white">{language.name}</span>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/70">{language.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Experience ---------- */}
      <section id="experience" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow={isEn ? "Career" : "Карьера"}
            title={isEn ? "Experience" : "Опыт работы"}
            sub={isEn ? "Tap a role to see what I did there." : "Нажмите на позицию, чтобы увидеть детали."}
          />
        </Reveal>
        <Reveal delay={80}>
          <ExperienceAccordion items={experience} />
        </Reveal>
      </section>

      {/* ---------- Skills ---------- */}
      <section id="skills" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow={isEn ? "Toolbox" : "Инструменты"} title={isEn ? "Core Skills" : "Ключевые навыки"} />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill, index) => (
            <Reveal key={skill.name} delay={(index % 4) * 70}>
              <div className="group h-full rounded-[20px] border border-white/10 bg-white/[0.02] p-5 transition hover:-translate-y-1 hover:border-accent/40">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-accent transition group-hover:bg-accent group-hover:text-black">
                  <SparkleIcon className="h-4 w-4" />
                </span>
                <h3 className="font-display text-lg font-semibold text-white">{skill.name}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/60">{skill.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Projects ---------- */}
      <section id="projects" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow={isEn ? "Selected work" : "Избранное"}
            title={isEn ? "Featured Projects" : "Избранные проекты"}
            sub={isEn ? "Some of the apps I’m most proud of — built to perform in production." : "Приложения, которыми я горжусь, — созданные для продакшена."}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project, index) => (
            <Reveal key={project.name} delay={(index % 2) * 80}>
              <article className="group flex h-full flex-col rounded-[20px] border border-white/10 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-accent/40 md:p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                    {project.emoji}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-white">{project.name}</h3>
                </div>
                <p className="mt-5 flex-1 text-[15px] leading-7 text-white/60">{project.desc}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.playUrl ? (
                    <a href={project.playUrl} target="_blank" rel="noreferrer" className="cv-store-btn">
                      <PlayStoreIcon />
                      Google Play
                    </a>
                  ) : null}
                  {project.appStoreUrl ? (
                    <a href={project.appStoreUrl} target="_blank" rel="noreferrer" className="cv-store-btn">
                      <AppleIcon />
                      App Store
                    </a>
                  ) : null}
                  {!project.playUrl && !project.appStoreUrl ? (
                    <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-white/40">
                      {isEn ? "Private project" : "Приватный проект"}
                    </span>
                  ) : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-accent/30 bg-gradient-to-br from-accent/[0.12] via-white/[0.02] to-transparent p-8 text-center md:p-16">
            <SparkleIcon className="spin-slow pointer-events-none absolute -right-10 -top-10 h-40 w-40 text-accent/10" />
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{isEn ? "Contact" : "Контакты"}</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-white md:text-6xl">
              {isEn ? "Let’s work together" : "Давайте работать вместе"}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
              {isEn
                ? "Have a project in mind or a question? Write me — I usually reply within a day."
                : "Есть проект или вопрос? Напишите мне — обычно отвечаю в течение дня."}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                <MailIcon className="h-4 w-4" />
                {EMAIL}
              </a>
              <a
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white transition hover:border-accent hover:text-accent"
              >
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white transition hover:border-accent hover:text-accent"
              >
                <GitHubIcon className="h-4 w-4" />
                GitHub
              </a>
            </div>
            <p className="mt-6 text-sm text-white/40">
              {PHONE} · {isEn ? "Cairo, Egypt" : "Каир, Египет"}
            </p>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Mostafa Omar</p>
          <div className="flex items-center gap-5">
            <a href="/en/blog" className="transition hover:text-accent">
              {isEn ? "Blog" : "Блог"}
            </a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="transition hover:text-accent">
              GitHub
            </a>
            <a href={LINKEDIN} target="_blank" rel="noreferrer" className="transition hover:text-accent">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
