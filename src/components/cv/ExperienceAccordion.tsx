"use client";

import {useState} from "react";
import {BriefcaseIcon, CalendarIcon, PlusIcon} from "@/components/cv/icons";

export type ExperienceItem = {company: string; role: string; period: string; points: string[]};

/** One role open at a time; the body slides open (grid-rows 0fr → 1fr) and the + turns into ×. */
export function ExperienceAccordion({items}: {items: ExperienceItem[]}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `experience-panel-${index}`;
        return (
          <div
            key={`${item.company}-${item.period}`}
            className={`rounded-[20px] border transition-colors duration-300 ${
              isOpen ? "border-accent/40 bg-white/[0.04]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center gap-4 p-5 text-left md:p-6"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  isOpen ? "bg-accent text-black" : "bg-white/[0.06] text-white/70"
                }`}
              >
                <BriefcaseIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-snug text-white md:text-xl">{item.role}</span>
                <span className="mt-0.5 block text-sm text-white/60">{item.company}</span>
              </span>
              <span className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 sm:inline-flex">
                <CalendarIcon />
                {item.period}
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen ? "rotate-45 border-accent/60 text-accent" : "border-white/15 text-white/60"
                }`}
                aria-hidden="true"
              >
                <PlusIcon className="h-4 w-4" />
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{gridTemplateRows: isOpen ? "1fr" : "0fr"}}
            >
              <div className="overflow-hidden">
                <div
                  className={`px-5 pb-6 transition-opacity duration-500 md:pb-7 md:pl-[5.25rem] md:pr-6 ${isOpen ? "opacity-100" : "opacity-0"}`}
                >
                  <p className="mb-3 inline-flex items-center gap-2 text-sm text-white/60 sm:hidden">
                    <CalendarIcon />
                    {item.period}
                  </p>
                  <ul className="space-y-2.5">
                    {item.points.map((point) => (
                      <li key={point} className="flex gap-3 text-[15px] leading-7 text-white/70">
                        <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
