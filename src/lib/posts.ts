export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  locale: "en" | "ru";
};

type Post = PostMeta & {
  content: string;
};

const posts: Post[] = [
  {
    slug: "ble-flutter-en",
    title: "BLE in Flutter: Lessons from Production",
    date: "2026-04-20",
    locale: "en",
    content: `Integrating BLE into Flutter apps works well when you keep your plugin boundary clean and isolate platform-specific logic.

## What helps most

- Keep scanning and connection logic in dedicated services.
- Use state management to avoid race conditions.
- Add retry strategies for unstable hardware.`
  },
  {
    slug: "ble-flutter-ru",
    title: "BLE во Flutter: практические выводы",
    date: "2026-04-20",
    locale: "ru",
    content: `Интеграция BLE во Flutter-приложениях работает стабильно, если четко разделить Dart-логику и нативную часть.

## Что действительно помогает

- Выделяйте отдельные сервисы для сканирования и подключения.
- Контролируйте состояние через Riverpod/Bloc.
- Добавляйте повторные попытки подключения для нестабильных устройств.`
  }
];

export function getPosts(locale: "en" | "ru"): PostMeta[] {
  return posts
    .map(({slug, title, date, locale}) => ({slug, title, date, locale}))
    .filter((post) => post.locale === locale)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) {
    throw new Error(`Post not found for slug: ${slug}`);
  }

  return {
    content: post.content,
    data: {
      title: post.title,
      date: post.date,
      locale: post.locale
    }
  };
}
