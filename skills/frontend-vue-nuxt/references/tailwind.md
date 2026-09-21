# TailwindCSS v4 in Nuxt projects

Only when the project already uses Tailwind.

- Prefer utility classes in the template.
- Use `<style>` for keyframes, awkward selectors/pseudos, scrollbar styling, and CSS variables for dynamic theming.
- Entry CSS (`app/assets/css/main.css` or the path the repo already uses): `@import "tailwindcss";` — not the old `@tailwind base/components/utilities` directives.
- No `tailwind.config.js` / PostCSS Tailwind plugin unless the repo is still on TailwindCSS v3.

The `@apply` and `@variant` directives in SFC `<style>` need `@reference` to the main CSS file. Copy [scripts/tailwind-reference-plugin.js](../scripts/tailwind-reference-plugin.js) to `vite/tailwind-reference-plugin.js` if the project does not already have it. Then make sure the `nuxt.config.ts` file has the `tailwindReferencePlugin` plugin configured:

```js
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import {tailwindReferencePlugin} from './vite/tailwind-reference-plugin.js';

export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindReferencePlugin(path.join(currentDir, 'app/assets/css/main.css')),
      tailwindcss(),
    ],
  },
});
```

`currentDir` is the Nuxt project root (or layer root) that owns that CSS file.

Install/setup checklist and TailwindCSS v4 don’ts: [frontend-css/rules/tailwind.md](../../frontend-css/rules/tailwind.md).
