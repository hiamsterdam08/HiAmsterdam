import type { NextConfig } from "next";

// GitHub Pages can only serve files — no Node server — so the preview build is a
// static export served from a repo subpath. Both variables are set by
// .github/workflows/deploy.yml; locally and on a real host neither is set and
// the app builds as a normal server-rendered Next app.
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

// GitHub hands back "/repo" for a project site but a bare "/" for a user site,
// and Next wants "" for the latter. `src/lib/site.ts` trims the same way — it
// reads the raw variable, because only a literal `process.env.NEXT_PUBLIC_…` is
// inlined into the browser bundle.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath,
      trailingSlash: true,
      // The image optimiser is a server route, so a static export has to ship
      // the originals from /public as they are.
      images: { unoptimized: true },
      turbopack: {
        resolveAlias: {
          // Next.js refuses to build a Server Action into a static export, so
          // the booking form gets a browser-side stand-in that runs the same
          // validation. See src/app/maak-een-afspraak/actions.static.ts.
          "@/app/maak-een-afspraak/actions":
            "./src/app/maak-een-afspraak/actions.static.ts",
        },
      },
    }
  : {};

export default nextConfig;
