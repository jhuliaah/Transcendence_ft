import { mergeConfig, defineConfig } from 'vitest/config';
import { svelteTesting } from '@testing-library/svelte/vite';

import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [svelteTesting()],

    resolve: {
      conditions: ['browser']
    },

    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      pool: 'vmThreads'
    }
  })
);
