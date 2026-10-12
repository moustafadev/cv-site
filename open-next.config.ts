import {defineCloudflareConfig} from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({});

// `npm run build` is the OpenNext build (Cloudflare's build step runs it and
// its deploy step then finds the compiled worker). OpenNext calls the app's
// build script itself, so it must run plain `next build` here or it would
// recurse into itself.
export default {...config, buildCommand: "npx next build"};
