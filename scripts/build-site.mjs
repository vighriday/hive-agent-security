/**
 * Assemble the published site.
 *
 *   dist/            the landing page — a static page, no build step
 *   dist/console/    the console, as built by Vite
 *
 * This runs in CI and locally from the same command, so what GitHub Pages
 * serves is what `pnpm run build` produces on any machine.
 */

import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const site = resolve(root, 'apps/site');
const consoleDist = resolve(root, 'apps/console/dist');

if (!existsSync(consoleDist)) {
  process.stderr.write(
    'The console has not been built yet.\n' + 'Run: pnpm run console:build\n',
  );
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// The landing page sits at the root, so its relative asset paths resolve
// against it directly.
await cp(site, out, { recursive: true });

// The console is built with `base: './'`, so it runs from this subpath
// without being rebuilt for it.
await cp(consoleDist, resolve(out, 'console'), { recursive: true });

const top = (await readdir(out, { withFileTypes: true }))
  .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
  .sort()
  .join('  ');

process.stdout.write(`site assembled into dist/\n  ${top}\n`);
