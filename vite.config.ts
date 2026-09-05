import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';
import {
  generateGallery,
  galleryFilesPlugin,
} from './scripts/gallery-files.mjs';
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';
export default defineConfig(async ({ command, mode }) => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';
  const localEnv = command === 'serve' ? loadEnv(mode, process.cwd(), '') : {};
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  await generateGallery();
  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      galleryFilesPlugin(),
      vinext(),
      sites(),
      cloudflare({
        configPath: 'wrangler.jsonc',
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config:
          command === 'serve'
            ? {
                vars: {
                  OWNER_EMAIL: localEnv.OWNER_EMAIL || '',
                  SITE_ORIGIN: localEnv.SITE_ORIGIN || '',
                },
              }
            : {},
      }),
    ],
  };
});
