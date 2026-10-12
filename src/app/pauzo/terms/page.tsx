import type {Metadata} from "next";
import {LegalDoc, type LegalSection} from "../LegalDoc";

export const metadata: Metadata = {title: "Pauzo — Terms of use"};

const sections: LegalSection[] = [
  {
    title: "The agreement",
    body: (
      <p>
        These terms are between you and Mostafa Omar, the developer of Pauzo. By using the app you accept them. The{" "}
        <a className="font-medium text-[#6C35F4] underline" href="/pauzo/privacy">
          privacy policy
        </a>{" "}
        explains how data is handled.
      </p>
    )
  },
  {
    title: "What Pauzo is",
    body: (
      <p>
        Pauzo helps you plan and track your own money. It is a personal tool, not a bank, payment service or financial
        adviser. Figures, suggestions and answers from Ask Pauzo are general information produced partly by an AI model and
        can be incomplete or wrong. Decisions about your money remain yours.
      </p>
    )
  },
  {
    title: "Premium",
    body: (
      <ul>
        <li>
          Premium is a one-time purchase, not a subscription. It gives you a personal, non-transferable licence to the
          Premium features for as long as the app is offered.
        </li>
        <li>
          Purchases and refunds are handled by Google Play or the App Store under their terms. Statutory rights under the
          consumer law of your country are not affected.
        </li>
        <li>
          Premium can also be obtained through an invite code. Codes are for real friends: Premium obtained through fake
          devices, automated sign-ups or other abuse may be withdrawn.
        </li>
        <li>Daily AI message limits apply to free and Premium use and may change to keep the service sustainable.</li>
      </ul>
    )
  },
  {
    title: "Shared budget",
    body: (
      <p>
        Only share a budget with people you trust. Members can see the transactions you share, including notes. Leaving
        the shared budget removes your transactions from the others&apos; phones.
      </p>
    )
  },
  {
    title: "Your data and backups",
    body: (
      <p>
        Your records live on your device. Losing or resetting the device, or uninstalling the app, can delete them. Keep
        that in mind before resetting or changing phones.
      </p>
    )
  },
  {
    title: "Acceptable use",
    body: (
      <p>
        Do not misuse the app or its server: no attempts to break, overload, reverse-engineer or resell the service, and no
        use of the AI features to produce unlawful content.
      </p>
    )
  },
  {
    title: "Availability and liability",
    body: (
      <>
        <p>
          The app is provided as it is, and features may change. To the extent the law allows, the developer is not liable
          for indirect loss or for decisions made using the app. Nothing in these terms limits liability that cannot be
          limited by law, including under the consumer protection law of your country.
        </p>
      </>
    )
  },
  {
    title: "App Store",
    body: (
      <p>
        If you got Pauzo from Apple&apos;s App Store, these terms are between you and the developer, not Apple. Apple has no
        obligation to provide maintenance or support, is not responsible for claims relating to the app, and is a
        third-party beneficiary of these terms with the right to enforce them. If the app fails to conform to a warranty,
        you may notify Apple for a refund of the purchase price; Apple has no other warranty obligation.
      </p>
    )
  },
  {
    title: "Changes and ending",
    body: (
      <p>
        These terms may be updated; important changes will be shown in the app. You can stop using Pauzo at any time by
        deleting it.
      </p>
    )
  }
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of use"
      intro={<p>Plain terms for a simple app: what you get, what we expect, and what we are responsible for.</p>}
      sections={sections}
    />
  );
}
