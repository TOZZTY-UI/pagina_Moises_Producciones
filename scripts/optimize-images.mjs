import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const roots = [
  join(projectRoot, 'src', 'assets'),
  join(projectRoot, 'public'),
];
const sharpCli = join(projectRoot, 'node_modules', 'sharp-cli', 'bin', 'cli.js');
const supported = new Set([
  '.avif',
  '.gif',
  '.heic',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
]);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const input = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collect(input));
    } else if (supported.has(extname(entry.name).toLowerCase())) {
      files.push(input);
    }
  }

  return files;
}

function runSharp(input, output) {
  const sharpInput = input.replaceAll('\\', '/');
  const sharpOutput = output.replaceAll('\\', '/');
  const args = [
    sharpCli,
    '-i', sharpInput,
    '-o', sharpOutput,
    '-f', 'webp',
    '-q', '82',
  ];

  return new Promise((resolveProcess, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolveProcess();
      else reject(new Error(`sharp-cli terminó con código ${code}`));
    });
  });
}

function webpPath(input) {
  const extension = extname(input);
  return join(input.slice(0, -extension.length) + '.webp');
}

async function optimize(input) {
  const output = webpPath(input);
  const before = (await stat(input)).size;

  await runSharp(input, output);
  const after = (await stat(output)).size;

  if (after >= before) {
    await rm(output, { force: true });
    return { input, output: null, before, after: before };
  }

  // The WebP is smaller and has already been written successfully.
  // Remove the original so Vite does not ship both versions.
  await rm(input, { force: true });
  return { input, output, before, after };
}

function referenceVariants(input, output) {
  const sourceRelative = relative(projectRoot, input).replaceAll('\\', '/');
  const outputRelative = relative(projectRoot, output).replaceAll('\\', '/');
  const sourceExtension = extname(sourceRelative);
  const outputExtension = extname(outputRelative);
  const sourceWithoutExtension = sourceRelative.slice(0, -sourceExtension.length);
  const outputWithoutExtension = outputRelative.slice(0, -outputExtension.length);
  const variants = new Map([
    [sourceRelative, outputRelative],
    [`/${sourceRelative.replace(/^public\//, '')}`, `/${outputRelative.replace(/^public\//, '')}`],
    [`../../${sourceRelative.replace(/^src\//, '')}`, `../../${outputRelative.replace(/^src\//, '')}`],
  ]);

  // Also replace extension variants in strings that use a different case.
  variants.set(sourceWithoutExtension + sourceExtension.toUpperCase(), outputWithoutExtension + '.webp');
  return variants;
}

async function updateReferences(results) {
  const files = [
    join(projectRoot, 'src', 'data', 'personas.json'),
    join(projectRoot, 'src', 'components', 'ux', 'menu', 'menu.astro'),
  ];

  for (const file of files) {
    let content = await readFile(file, 'utf8');
    for (const result of results) {
      if (!result.output) continue;
      for (const [from, to] of referenceVariants(result.input, result.output)) {
        content = content.replaceAll(from, to);
      }
    }
    await writeFile(file, content);
  }
}

const files = (await Promise.all(roots.map(collect))).flat();
const results = [];

for (const input of files) {
  try {
    results.push(await optimize(input));
  } catch (error) {
    console.warn(`No se pudo optimizar ${relative(projectRoot, input)}: ${error.message}`);
  }
}

await updateReferences(results);

const before = results.reduce((total, result) => total + result.before, 0);
const after = results.reduce((total, result) => total + result.after, 0);
const converted = results.filter((result) => result.output).length;
const saved = before - after;
const percentage = before ? (saved / before) * 100 : 0;

console.log(
  `Optimized ${results.length} images; converted ${converted} to WebP: ` +
  `${(before / 1024 / 1024).toFixed(2)} MB → ` +
  `${(after / 1024 / 1024).toFixed(2)} MB ` +
  `(-${(saved / 1024 / 1024).toFixed(2)} MB, ${percentage.toFixed(1)}%)`,
);
