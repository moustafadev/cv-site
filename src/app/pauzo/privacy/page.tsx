import type {Metadata} from "next";
import {LEGAL_CONTACT, LegalDoc, type LegalSection} from "../LegalDoc";

export const metadata: Metadata = {title: "Pauzo — Privacy policy"};

const sections: LegalSection[] = [
  {
    title: "Who is responsible",
    body: (
      <p>
        Pauzo is made by Mostafa Omar, an independent developer, who is the data controller for the processing described
        here. Contact: <b>{LEGAL_CONTACT}</b>.
      </p>
    )
  },
  {
    title: "What stays on your phone",
    body: (
      <p>
        Your plan, transactions, notes, goals, things you are waiting on, limits, name, reminders and chat history are
        stored only on your device. Pauzo has no account and no bank connection, and shows no ads. We never sell personal
        data. Uninstalling the app or using Profile → Reset all data deletes this data immediately.
      </p>
    )
  },
  {
    title: "What we process, why, and on what legal basis",
    body: (
      <ul>
        <li>
          <b>Device record</b>: a random device ID, platform, app version, language, Premium status, invite code, the
          number of AI messages used today and, if you allow notifications, a push token. Needed to provide Premium,
          invites and the daily AI allowance. Basis: performance of a contract (GDPR Art. 6(1)(b)).
        </li>
        <li>
          <b>Purchases</b>: the store&apos;s transaction ID and purchase token, to confirm Premium. We never receive card
          details. Basis: contract, and legal obligations for tax records (Art. 6(1)(c)).
        </li>
        <li>
          <b>Ask Pauzo and AI quick add</b>, only when you use them: month totals, previous months&apos; totals, one goal or
          wish, and for the Premium chat your recent transactions (date, type, category, amount — never notes) and the
          conversation; for quick add, the sentence or bank message you choose to send; for receipt reading, the photo
          you pick. Sent to Google&apos;s Gemini API to produce the answer and not stored on our server. Basis: contract.
        </li>
        <li>
          <b>Usage statistics</b> (Firebase Analytics): an app-instance identifier, device model, OS, language, country and
          which screens and features are used. In the EU, EEA, UK and Switzerland only with your consent (Art. 6(1)(a)),
          asked on first use and changeable anytime in Profile → Usage statistics; elsewhere on the basis of our
          legitimate interest in improving the app (Art. 6(1)(f)), and you can switch it off the same way. No advertising
          identifiers are used.
        </li>
        <li>
          <b>Crash reports</b> (Firebase Crashlytics): technical details of a crash. Basis: legitimate interest in keeping
          the app working (Art. 6(1)(f)).
        </li>
        <li>
          <b>Feedback</b> you email us: your message and address, to reply. Basis: legitimate interest.
        </li>
      </ul>
    )
  },
  {
    title: "Who processes data for us",
    body: (
      <>
        <p>
          Google (Firebase Analytics, Crashlytics, Cloud Messaging, Gemini API, Google Play billing), Apple (App Store
          purchases) and Cloudflare (our server and database). They act as processors under data processing terms and may
          process data in the United States and other countries.
        </p>
        <p>
          Transfers out of the EU/EEA and UK rely on the EU-U.S. Data Privacy Framework (and its UK extension) where the
          provider is certified, and otherwise on the European Commission&apos;s Standard Contractual Clauses.
        </p>
      </>
    )
  },
  {
    title: "How long we keep it",
    body: (
      <ul>
        <li>Device record and invite codes: while you use the app; deleted within 30 days of a request.</li>
        <li>Purchase records: as long as tax and accounting law requires.</li>
        <li>AI requests: not stored after the answer is returned.</li>
        <li>Usage statistics: 2 months. Crash reports: 90 days.</li>
      </ul>
    )
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask for access to your data, a copy of it in a portable format, correction, erasure or restriction of
          processing, and you can object to processing based on legitimate interest. Where processing is based on consent,
          you can withdraw it at any time without affecting what happened before. Email us from the address you want us to
          reply to; we answer within one month.
        </p>
        <p>
          You also have the right to lodge a complaint with a data protection authority, in particular in the country where
          you live or work.
        </p>
      </>
    )
  },
  {
    title: "California residents",
    body: (
      <p>
        We do not sell personal information or share it for cross-context behavioral advertising. You have the right to
        know, delete and correct personal information and not to be discriminated against for exercising these rights; use
        the contact above. The categories collected are the ones listed in section 3.
      </p>
    )
  },
  {
    title: "Children",
    body: <p>Pauzo is not directed at children under 16, and we do not knowingly process their data.</p>
  },
  {
    title: "Security",
    body: (
      <p>
        Data sent to our server travels over HTTPS and is tied to a random device token, not to your name or email.
        Access to the server is restricted to the developer.
      </p>
    )
  },
  {
    title: "Changes",
    body: <p>If this policy changes in a way that matters, we will say so in the app before it takes effect.</p>
  }
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy policy"
      intro={
        <p>
          Pauzo is a personal budgeting app built so that your money data stays on your phone. This policy explains the
          little that leaves it, why, and what you can do about it.
        </p>
      }
      sections={sections}
    />
  );
}
