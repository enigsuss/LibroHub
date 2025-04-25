import { defineConfig } from 'vite';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'content.ts'),
        background: resolve(__dirname, 'background.ts'),
        popup: resolve(__dirname, 'popup/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
      plugins:[
        copy({
          targets: [
            {src: 'manifest.json', dest: 'dist'},
          ],
          hook: 'writeBundle',
        })
      ]
    }
  }
});