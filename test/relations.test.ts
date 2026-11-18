import { describe, expect, it } from 'bun:test';
import { relationForeignKey, relationsOf } from '../src/relations';
import type { FieldMap, RelationField } from '../src/types';

const rel = (over: Partial<RelationField>): RelationField => ({
  kind: 'object',
  type: 'Other',
  isList: false,
  isRequired: true,
  fromFields: [],
  toFields: [],
  ...over,
});

describe('relationForeignKey', () => {
  it('returns null for back-relations (no FK fields)', () => {
    expect(relationForeignKey(rel({ fromFields: [], toFields: [] }))).toBeNull();
  });

  it('returns the bare field name for a single same-named pair', () => {
    expect(relationForeignKey(rel({ fromFields: ['id'], toFields: ['id'] }))).toBe('id');
  });

  it('returns a { referencedField: localField } map for a renamed FK', () => {
    expect(relationForeignKey(rel({ fromFields: ['organizationId'], toFields: ['id'] }))).toEqual({
      id: 'organizationId',
    });
  });

  it('returns a composite map for multi-column FKs', () => {
    expect(
      relationForeignKey(rel({ fromFields: ['aId', 'bId'], toFields: ['aKey', 'bKey'] })),
    ).toEqual({ aKey: 'aId', bKey: 'bId' });
  });

  it('returns null on mismatched lengths', () => {
    expect(relationForeignKey(rel({ fromFields: ['a'], toFields: ['x', 'y'] }))).toBeNull();
  });
});

describe('relationsOf', () => {
  const map: FieldMap = {
    models: {
      Inquiry: {
        dbName: null,
        fields: {
          id: { kind: 'scalar', type: 'String', isRequired: true, isList: false, isId: true },
          organization: rel({
            type: 'Organization',
            fromFields: ['organizationId'],
            toFields: ['id'],
          }),
          parent: rel({
            type: 'Inquiry',
            fromFields: ['parentId'],
            toFields: ['id'],
            annotations: { tree: { parent: true } },
          }),
          children: rel({ type: 'Inquiry', isList: true }),
        },
      },
    },
  };

  it('lists only object fields with collapsed foreign keys', () => {
    const relations = relationsOf(map, 'Inquiry');
    expect(relations.map((r) => r.field)).toEqual(['organization', 'parent', 'children']);
    expect(relations.find((r) => r.field === 'organization')?.foreignKey).toEqual({
      id: 'organizationId',
    });
    expect(relations.find((r) => r.field === 'children')?.foreignKey).toBeNull();
  });

  it('carries isRequired, and reads an absent isList / isRequired as false', () => {
    const relations = relationsOf(
      { models: { A: { fields: { b: { kind: 'object', type: 'B' } } } } },
      'A',
    );
    expect(relations).toEqual([
      { field: 'b', targetModel: 'B', isList: false, isRequired: false, foreignKey: null },
    ]);
    expect(relationsOf(map, 'Inquiry')[0]?.isRequired).toBe(true);
  });

  it('reads own properties only', () => {
    expect(() => relationsOf(map, 'toString')).toThrow('Model toString not found');
  });

  it('carries annotations through to RelationInfo', () => {
    const parent = relationsOf(map, 'Inquiry').find((r) => r.field === 'parent');
    expect(parent?.annotations).toEqual({ tree: { parent: true } });
  });

  it('throws on an unknown model', () => {
    expect(() => relationsOf(map, 'Nope')).toThrow();
  });
});
