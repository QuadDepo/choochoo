import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  clean: true,
  target: 'node22',
  noExternal: [/^@choochoo\//],
  banner: { js: '#!/usr/bin/env node' },
});
