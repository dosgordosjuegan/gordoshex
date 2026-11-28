import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: {
    outDir: 'benchmark-dist',
    target: 'es2022',
    rolldownOptions: {
      input: [
        'benchmarks/browser.html',
        'benchmarks/memoir.html',
        'benchmarks/release.html',
      ],
    },
  },
});
