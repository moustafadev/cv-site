import type {Metadata} from "next";
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
import {JsonLd} from "@/components/JsonLd";
import {isLocale, type Locale} from "@/i18n/routing";
import {BLOG_PATH} from "@/lib/blog-constants";
import {absoluteUrl, buildPageMetadata, faqJsonLd, personId, personJsonLd, siteOrigin, websiteId, websiteJsonLd} from "@/lib/seo";
import {cvData} from "@/lib/cv-data";
import {EMAIL, GITHUB_URL as GITHUB, JOB_TITLE, LINKEDIN_URL as LINKEDIN, ONE_LINER, PERSON_NAME, PERSON_NAME_RU, PHONE, PHONE_ALT} from "@/lib/site";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "",
    title: `${locale === "ru" ? PERSON_NAME_RU : PERSON_NAME} — ${JOB_TITLE[locale]}`,
    description: ONE_LINER[locale],
    localized: true,
    type: "profile"
  });
}

/**
 * Answer-first FAQ: each answer stands on its own (a search or AI engine can quote it without the rest of the page)
 * and only restates facts shown elsewhere on this CV. Rendered visibly and as FAQPage JSON-LD from the same data.
 */
function faqFor(locale: Locale): {q: string; a: string}[] {
  if (locale === "ru") {
    return [
      {
        q: "Кто такой Мустафа Омар?",
        a: "Мустафа Омар — инженер-программист из Каира (Египет), работает удалённо, опыт 5 лет. Создал и поддерживает 30+ мобильных приложений в сферах финтеха, здравоохранения, фитнеса и e-commerce; 10 из них опубликованы в App Store и Google Play и собрали более 200 000 загрузок. Пишет на Flutter с нативными интеграциями на Swift, Kotlin и Java, а также сам разрабатывает бэкенды на TypeScript."
      },
      {
        q: "Можно ли нанять Мустафу Омара?",
        a: "Да. Мустафа открыт к фриланс-проектам и новым позициям, работает удалённо из Каира (Египет). Быстрее всего связаться по почте mostafaomardev@gmail.com, по телефону +20 109 493 0203 или +7 927 049 2663, либо через LinkedIn."
      },
      {
        q: "С какими технологиями работает Мустафа Омар?",
        a: "Flutter и Dart для приложений под iOS и Android; Swift, Kotlin и Java для нативных интеграций через MethodChannel, EventChannel и JNI; Riverpod, Bloc и GetX для состояния; BLE, WebRTC, WebSockets и push-уведомления; на бэкенде — TypeScript, Node.js и Next.js на Cloudflare Workers с базой D1 (SQLite); Fastlane и публикация в оба стора."
      },
      {
        q: "Занимается ли Мустафа Омар бэкендом?",
        a: "Да. Он написал бэкенд для своего приложения Pauzo и для этого сайта: Cloudflare Workers с базой D1 (SQLite), REST API, сессионная авторизация, связывание устройств, проверка внутренних покупок, push-уведомления и AI-слой с переключением между Workers AI, Groq и Gemini. Исходный код сайта открыт на GitHub."
      },
      {
        q: "Делал ли Мустафа Flutter-приложения с Bluetooth (BLE) и видеозвонками?",
        a: "Да. В Check Point Care он за 8 месяцев переписал нативное медицинское iOS- и Android-приложение в единую Flutter-кодовую базу, сохранив все функции камеры и датчиков, и разработал BLE-слой для собственных медицинских устройств компании на нативных Swift, Java и JNI. Там же он выпустил real-time чат и видеозвонки на WebRTC для больниц."
      },
      {
        q: "Над какими приложениями работал Мустафа?",
        a: "Среди опубликованных: SuperApp (СуперАп) — маркетплейс с доставкой, Pauzo — его собственное приложение для учёта расходов с AI, TicketGO.uz — билеты на мероприятия, «Особенный Наполеон» — доставка десертов, K.PROFI 2.0 для пользователей Knauf, iH.plus, TekLub Cashback, Jelesson, Sportivity, METO и ПУСК."
      },
      {
        q: "Где учился Мустафа Омар?",
        a: "Он получил степень бакалавра по программной инженерии в Казанском национальном исследовательском техническом университете им. А. Н. Туполева (КНИТУ-КАИ), 2020–2024. Языки: арабский (родной), русский (разговорный), английский (базовый)."
      }
    ];
  }
  return [
    {
      q: "Who is Mostafa Omar?",
      a: "Mostafa Omar is a software engineer based in Cairo, Egypt, working remotely, with 5 years of experience. He has built and maintained 30+ mobile apps across fintech, healthcare, fitness and e-commerce; 10 are live on the App Store and Google Play with over 200,000 downloads. He works in Flutter with native Swift, Kotlin and Java integrations, and also builds his own TypeScript backends."
    },
    {
      q: "Is Mostafa Omar available for hire?",
      a: "Yes. Mostafa is open to freelance projects and new roles, and works remotely from Cairo, Egypt. The fastest way to reach him is by email at mostafaomardev@gmail.com, by phone on +20 109 493 0203 or +7 927 049 2663, or through LinkedIn."
    },
    {
      q: "What technologies does Mostafa Omar work with?",
      a: "Flutter and Dart for iOS and Android apps; Swift, Kotlin and Java for native integrations through MethodChannel, EventChannel and JNI; Riverpod, Bloc and GetX for state; BLE, WebRTC, WebSockets and push notifications; on the backend, TypeScript, Node.js and Next.js on Cloudflare Workers with a D1 (SQLite) database; plus Fastlane and publishing to both stores."
    },
    {
      q: "Does Mostafa Omar do backend work?",
      a: "Yes. He wrote the backend for his own app Pauzo and for this site: Cloudflare Workers with a D1 (SQLite) database, REST APIs, session auth, device pairing, in-app purchase verification, push notifications and an AI layer that falls back across Workers AI, Groq and Gemini. The source of this site is public on GitHub."
    },
    {
      q: "Has Mostafa built Flutter apps with Bluetooth (BLE) and video calls?",
      a: "Yes. At Check Point Care he rebuilt a native iOS and Android medical app as a single Flutter codebase in 8 months, keeping every camera and sensor feature, and built the BLE layer for the company's proprietary medical devices in native Swift, Java and JNI. He also shipped real-time chat and WebRTC video calls for hospitals there."
    },
    {
      q: "Which apps has Mostafa worked on?",
      a: "Published apps include SuperApp (СуперАп), a marketplace and delivery platform; Pauzo, his own budgeting app with an AI assistant; TicketGO.uz for event ticketing; Special Napoleon for dessert delivery; K.PROFI 2.0 for Knauf users; iH.plus; TekLub Cashback; Jelesson; Sportivity; METO; and PUSK."
    },
    {
      q: "Where did Mostafa Omar study?",
      a: "He holds a Bachelor of Software Engineering from Kazan National Research Technical University named after A. N. Tupolev (KNRTU-KAI), 2020–2024. He speaks Arabic (native), Russian (conversational) and English (basic)."
    }
  ];
}

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

  const {stats, ticker, about, education, skills, experience, projects, languages} = cvData(locale);

  const contacts = [
    {icon: <MailIcon />, label: EMAIL, href: `mailto:${EMAIL}`},
    {icon: <PhoneIcon />, label: PHONE, href: `tel:${PHONE.replace(/\s+/g, "")}`},
    {icon: <PinIcon />, label: isEn ? "Cairo, Egypt" : "Каир, Египет", href: null}
  ];

  const cvHref = isEn ? "/Mostafa_Omar_CV_EN.pdf" : "/Mostafa_Omar_CV_RU.pdf";
  const faq = faqFor(locale);
  const origin = await siteOrigin();
  const pageUrl = absoluteUrl(origin, locale);

  return (
    <main className="overflow-x-clip">
      <JsonLd
        data={{
          "@graph": [
            personJsonLd(origin, locale),
            websiteJsonLd(origin),
            {
              "@type": "ProfilePage",
              "@id": `${pageUrl}#profile`,
              url: pageUrl,
              name: `${isEn ? PERSON_NAME : PERSON_NAME_RU} — ${JOB_TITLE[locale]}`,
              description: ONE_LINER[locale],
              inLanguage: locale,
              mainEntity: {"@id": personId(origin)},
              isPartOf: {"@id": websiteId(origin)}
            },
            {...faqJsonLd(faq), "@id": `${pageUrl}#faq`, inLanguage: locale}
          ]
        }}
      />
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
              {isEn ? "Software Engineer" : "Инженер-программист"}
              <span className="text-white/40"> · {isEn ? "Mobile & Backend" : "Мобильная разработка и бэкенд"}</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              {isEn
                ? "5 years and 30+ production apps in Flutter, with native Swift, Kotlin and Java, BLE and WebRTC — and the TypeScript backends behind my own products."
                : "5 лет и 30+ продакшн-приложений на Flutter, с нативными Swift, Kotlin и Java, BLE и WebRTC — и бэкенды на TypeScript для собственных продуктов."}
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
                  {isEn
                    ? "Mobile apps that ship — and the backends behind them."
                    : "Мобильные приложения, которые доходят до релиза, — и бэкенды под ними."}
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
                  {project.siteUrl ? (
                    <a href={project.siteUrl} target="_blank" rel="noreferrer" className="cv-store-btn">
                      <ArrowUpRightIcon />
                      {project.siteLabel}
                    </a>
                  ) : null}
                  {project.badge ? (
                    <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-white/40">
                      {project.badge}
                    </span>
                  ) : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- FAQ (answer-first; same data as the FAQPage JSON-LD above) ---------- */}
      <section id="faq" className="container-page scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title={isEn ? "Frequently asked questions" : "Частые вопросы"} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {faq.map((item, index) => (
            <Reveal key={item.q} delay={(index % 2) * 70}>
              <article className="h-full rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
                <h3 className="font-display text-lg font-semibold leading-snug text-white">{item.q}</h3>
                <p className="mt-3 text-[15px] leading-7 text-white/60">{item.a}</p>
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
                ? "Have a project in mind or a question? Write me and I’ll get back to you."
                : "Есть проект или вопрос? Напишите мне — я отвечу."}
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
              {PHONE} · {PHONE_ALT} · {isEn ? "Cairo, Egypt · Remote" : "Каир, Египет · Удалённо"}
            </p>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Mostafa Omar</p>
          <div className="flex items-center gap-5">
            <a href={BLOG_PATH} className="transition hover:text-accent">
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
