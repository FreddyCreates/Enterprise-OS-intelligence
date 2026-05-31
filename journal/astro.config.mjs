// @ts-check
import { defineConfig } from 'astro/config';

// THE JOURNAL — static site, no SSR, no client hydration framework needed.
// Output: dist/  →  Cloudflare Pages  →  (later) ICP Public Gateway canister.
//
// Doctrine: every page is server-rendered to HTML at build time. The runtime
// JavaScript on the page is limited to the heartbeat tick and progressive
// enhancement that degrades gracefully without it.

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  site: 'https://journal.medinatech.io',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
