import { describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type FieldMap, fieldMapModuleSource } from '../src/index';

const map: FieldMap = {
  models: {
    User: { dbName: null, fields: { id: { kind: 'scalar', type: 'String', isId: true } } },
  },
  enums: { Role: ['ADMIN', 'USER'] },
};

describe('fieldMapModuleSource', () => {
  it('writes a module that holds the map as given, with its type and extra exports', async () => {
    const source = fieldMapModuleSource(map, {
      exportName: 'prismaMap',
      extraExports: { unsupportedColumns: { User: ['search'] } },
    });
    expect(source).toContain('} as const satisfies FieldMap;');
    expect(source).toContain('export type PrismaMap = typeof prismaMap;');
    const dir = mkdtempSync(join(tmpdir(), 'field-map-module-'));
    try {
      const file = join(dir, 'map.ts');
      writeFileSync(file, source);
      const module = await import(file);
      expect(module.prismaMap).toEqual(map);
      expect(module.unsupportedColumns).toEqual({ User: ['search'] });
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('the same map gives the same text', () => {
    expect(fieldMapModuleSource(map)).toBe(fieldMapModuleSource(structuredClone(map)));
  });

  it('defaults the export to fieldMap and refuses a name that is not an identifier', () => {
    expect(fieldMapModuleSource(map)).toContain('export const fieldMap = ');
    expect(() => fieldMapModuleSource(map, { exportName: 'not-ok' })).toThrow('not an identifier');
  });
});
