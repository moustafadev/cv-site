type ContactFormProps = {
  locale: "en" | "ru";
};

export function ContactForm({locale}: ContactFormProps) {
  const action = process.env.NEXT_PUBLIC_FORMSPREE_URL || "";

  return (
    <form action={action} method="POST" className="grid gap-3 rounded-xl border border-slate-800 p-4">
      <input type="hidden" name="_subject" value="New portfolio contact" />
      <label className="grid gap-1 text-sm">
        <span>{locale === "en" ? "Name" : "Имя"}</span>
        <input
          required
          className="rounded-md border border-slate-700 bg-slate-900 p-2"
          name="name"
          type="text"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Email</span>
        <input
          required
          className="rounded-md border border-slate-700 bg-slate-900 p-2"
          name="email"
          type="email"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span>{locale === "en" ? "Message" : "Сообщение"}</span>
        <textarea
          required
          className="min-h-28 rounded-md border border-slate-700 bg-slate-900 p-2"
          name="message"
        />
      </label>
      <button className="rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700" type="submit">
        {locale === "en" ? "Send" : "Отправить"}
      </button>
      {!action ? (
        <p className="text-xs text-amber-400">
          {locale === "en"
            ? "Set NEXT_PUBLIC_FORMSPREE_URL in .env.local to enable sending."
            : "Укажите NEXT_PUBLIC_FORMSPREE_URL в .env.local для отправки формы."}
        </p>
      ) : null}
    </form>
  );
}
