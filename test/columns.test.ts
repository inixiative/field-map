import { describe, expect, it } from 'bun:test';
import { columnsOf, pickColumns } from '../src/columns';
import type { FieldMap } from '../src/types';

const map: FieldMap = {
  models: {
    User: {
      dbName: 'users',
      fields: {
        id: { kind: 'scalar', type: 'String', isRequired: true, isList: false, isId: true },
        role: { kind: 'enum', type: 'Role', isRequired: true, isList: false, values: ['ADMIN'] },
        posts: {
          kind: 'object',
          type: 'Post',
          isList: true,
          isRequired: true,
          fromFields: [],
          toFields: [],
        },
      },
    },
  },
};

describe('columnsOf', () => {
  it('lists scalar and enum fields, not relations', () => {
    expect(columnsOf(map, 'User')).toEqual(['id', 'role']);
  });

  it('throws for an unknown model', () => {
    expect(() => columnsOf(map, 'Nope')).toThrow('Model Nope not found in the field map');
  });
});

describe('pickColumns', () => {
  it('drops included relations and unknown keys', () => {
    const row = { id: 'u1', role: 'ADMIN', posts: [{ id: 'p1' }], _count: { posts: 1 } };
    expect(pickColumns(map, 'User', row)).toEqual({ id: 'u1', role: 'ADMIN' });
  });
});
