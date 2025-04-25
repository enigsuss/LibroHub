import { defineConfig } from 'vite';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html'),
      },
      plugins: [
        copy({
          targets: [
            { src: 'src/extension/manifest.json', dest: 'dist' },
            { src: 'src/extension/background.ts', dest: 'dist' },
            { src: 'src/extension/content.ts', dest: 'dist' },
          ],
          hook: 'writeBundle',
        }),
      ],
    },
  },
});
