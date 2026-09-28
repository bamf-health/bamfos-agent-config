# TailwindCSS v4 in Nuxt projects

Only when the project already uses Tailwind. Template-vs-`<style>` rules are in the vue-nuxt [SKILL.md](../SKILL.md#tailwind).

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

Install/setup checklist and TailwindCSS v4 don’ts: [css/references/tailwind.md](../../css/references/tailwind.md).
