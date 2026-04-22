import {getRequestConfig} from "next-intl/server";
import {defaultLocale, locales} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const validLocale =
    locale && locales.includes(locale as (typeof locales)[number])
      ? locale
      : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});
