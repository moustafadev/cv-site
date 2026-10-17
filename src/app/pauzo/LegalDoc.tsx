import type {ReactNode} from "react";

export const LEGAL_CONTACT = "mostafaomardev@gmail.com";
export const LEGAL_UPDATED = "17 October 2026";

export type LegalSection = {title: string; body: ReactNode};

/** Plain, readable layout shared by the Pauzo privacy policy and terms. */
export function LegalDoc({title, intro, sections}: {title: string; intro: ReactNode; sections: LegalSection[]}) {
  return (
    <main className="min-h-screen bg-[#F2F5F9] px-4 py-10 text-[#0D123D]">
      <article className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold tracking-tight text-[#6C35F4]">Pauzo</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-1 text-sm text-[#777FA8]">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[#2A2F5A]">{intro}</div>
        {sections.map((s, i) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-lg font-bold">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-[#2A2F5A] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
              {s.body}
            </div>
          </section>
        ))}
        <p className="mt-10 border-t border-[#E1E5EE] pt-5 text-sm text-[#777FA8]">
          Questions or requests: <span className="select-all font-medium text-[#0D123D]">{LEGAL_CONTACT}</span>
        </p>
      </article>
    </main>
  );
}
