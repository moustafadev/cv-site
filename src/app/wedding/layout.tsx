import {RootDocument} from "@/components/RootDocument";

// Hidden page (middleware returns 404 for /wedding); it still needs a root layout to build.
export default function WeddingLayout({children}: {children: React.ReactNode}) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
