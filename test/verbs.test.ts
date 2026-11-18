import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as api from '../src/index';
import * as prisma from '../src/prisma/index';

const ROOT = join(import.meta.dir, '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.ts') ? [relative(ROOT, path)] : [];
  });

const code = (file: string): string =>
  readFileSync(join(ROOT, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('verbs', () => {
  const doc = readFileSync(join(ROOT, 'docs/VERBS.md'), 'utf8');
  const functions = (module: object) =>
    Object.keys(module).filter((name) => typeof (module as never)[name] === 'function');

  test('every exported function of both entry points is in the verb catalog', () => {
    const missing = [...functions(api), ...functions(prisma)].filter(
      (name) => !doc.includes(`\`${name}\``),
    );
    expect(missing).toEqual([]);
  });

  test('a field-map record is read through own.ts only', () => {
    const reads = /\.(models|fields|enums)\[[^\]]+\](?!\s*=[^=])/;
    const offenders = walk(join(ROOT, 'src'))
      .filter((file) => file !== 'src/own.ts' && reads.test(code(file)))
      .sort();
    expect(offenders).toEqual([]);
  });

  test('no public name says get: a lookup is a noun phrase (R-2026-11-17-07)', () => {
    expect(
      [...Object.keys(api), ...Object.keys(prisma)].filter((name) => /^get[A-Z]/.test(name)),
    ).toEqual([]);
  });
});
