import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname
  },
  experimental: {
    mdxRs: true,
    // Several root layouts ([locale], admin, wedding) → the 404 for unmatched URLs lives in app/global-not-found.tsx.
    globalNotFound: true
  }
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
