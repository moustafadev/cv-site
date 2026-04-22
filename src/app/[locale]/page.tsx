import Link from "next/link";
import {setRequestLocale} from "next-intl/server";
import {ContactForm} from "@/components/ContactForm";
import {getPosts} from "@/lib/posts";

export default function Home({params}: {params: {locale: "en" | "ru"}}) {
  setRequestLocale(params.locale);
  const isEn = params.locale === "en";
  const posts = getPosts(params.locale);

  const skills = [
    "Flutter",
    "Dart",
    "Swift/Kotlin",
    "BLE",
    "WebRTC",
    "Clean Architecture",
    "Riverpod/Bloc/GetX"
  ];

  return (
    <main className="container-page space-y-16 py-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">{isEn ? "Mostafa Omar" : "Мустафа Омар"}</h1>
        <p className="text-lg text-brand-100">{isEn ? "Flutter Developer" : "Flutter-разработчик"}</p>
        <p className="max-w-2xl text-slate-300">
          {isEn
            ? "Passionate Flutter developer with 3+ years of experience building scalable mobile apps with native integrations."
            : "Увлеченный Flutter-разработчик с опытом более 3 лет в создании масштабируемых мобильных приложений с нативными интеграциями."}
        </p>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Skills" : "Навыки"}</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="rounded-full border border-slate-700 px-3 py-1 text-sm">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Experience" : "Опыт работы"}</h2>
        <div className="space-y-4">
          <article className="rounded-xl border border-slate-800 p-4">
            <h3 className="font-semibold">Jeleapps</h3>
            <p className="text-sm text-slate-400">May 2022 - Present</p>
            <p className="mt-2 text-slate-300">
              {isEn
                ? "Led development and maintenance of 30+ Flutter apps across fintech, fitness, logistics, and lifestyle."
                : "Руководил разработкой и поддержкой более 30 Flutter-приложений в сферах финтеха, фитнеса, логистики и лайфстайла."}
            </p>
          </article>
          <article className="rounded-xl border border-slate-800 p-4">
            <h3 className="font-semibold">Check Point Care / TVELVI IT</h3>
            <p className="text-sm text-slate-400">2025 - Present</p>
            <p className="mt-2 text-slate-300">
              {isEn
                ? "Rebuilt native apps in Flutter with BLE, camera, sensors, chat and WebRTC video calls."
                : "Пересобрал нативные приложения на Flutter с BLE, камерой, сенсорами, чатом и видеозвонками WebRTC."}
            </p>
          </article>
        </div>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Portfolio Gallery" : "Портфолио"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["VPN App", "Marketplace", "Live Commerce"].map((project) => (
            <div key={project} className="rounded-xl border border-slate-800 p-4">
              <h3 className="font-medium">{project}</h3>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Testimonials" : "Отзывы"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <blockquote className="rounded-xl border border-slate-800 p-4 text-slate-300">
            "Mostafa consistently solved complex architecture issues and shipped stable features."
          </blockquote>
          <blockquote className="rounded-xl border border-slate-800 p-4 text-slate-300">
            "Reliable engineering partner for high-pressure product timelines."
          </blockquote>
        </div>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Blog" : "Блог"}</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/${params.locale}/blog/${post.slug}`} className="block rounded-xl border border-slate-800 p-4 hover:border-brand-500">
              <h3 className="font-medium">{post.title}</h3>
              <p className="text-sm text-slate-400">{post.date}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{isEn ? "Contact" : "Контакты"}</h2>
        <ContactForm locale={params.locale} />
      </section>
    </main>
  );
}
