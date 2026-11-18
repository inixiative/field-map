import { describe, expect, it } from 'bun:test';
import {
  columnName,
  hasColumn,
  isEnumField,
  isScalarField,
  storedValue,
  tableName,
} from '../src/identifiers';
import { readPrismaSchema } from '../src/prisma/v6/build';
import type { DbIdentifier, DbValue, EnumField, ScalarField } from '../src/types';

// A stand-in for a future toSql builder: it must accept only RESOLVED identifiers.
const eq = (column: DbIdentifier, value: DbValue): string => `${column} = '${value}'`;

describe('DbIdentifier / DbValue brands', () => {
  const map = readPrismaSchema(`
enum MissionTypeName {
  SOCIAL_POST @map("Social Post")
}

model MissionTypes {
  id               Int             @id
  missionTypeName  MissionTypeName
  createdAt        DateTime        @map("created_at")
}
`);
  const model = map.map.models.MissionTypes;

  it('accepts resolved identifiers and emits the DB surface', () => {
    const column = columnName(model.fields.missionTypeName as EnumField, 'missionTypeName');
    const value = storedValue(model.fields.missionTypeName as EnumField, 'SOCIAL_POST');

    const table: string = tableName(model, 'MissionTypes');
    const created: string = columnName(model.fields.createdAt as ScalarField, 'createdAt');

    expect(eq(column, value)).toBe("missionTypeName = 'Social Post'");
    expect(table).toBe('MissionTypes');
    expect(created).toBe('created_at');
  });

  it('rejects raw Prisma names at the type level', () => {
    // @ts-expect-error — a bare Prisma field name is not a resolved DbIdentifier
    eq('missionTypeName', storedValue(model.fields.missionTypeName as EnumField, 'SOCIAL_POST'));

    // @ts-expect-error — a bare enum member name is not a resolved DbValue
    eq(columnName(model.fields.missionTypeName as EnumField, 'missionTypeName'), 'SOCIAL_POST');

    expect(true).toBe(true); // the assertions above are compile-time
  });

  it('guards narrow ModelField so callers need no hand-rolled kind check', () => {
    const createdAt = model.fields.createdAt;
    const typeName = model.fields.missionTypeName;
    const id = model.fields.id;

    expect(isScalarField(createdAt)).toBe(true);
    expect(isEnumField(typeName)).toBe(true);
    expect(isScalarField(typeName)).toBe(false);
    expect(hasColumn(createdAt) && hasColumn(typeName) && hasColumn(id)).toBe(true);

    // narrowed by the guard — no cast needed, which is the point
    if (hasColumn(createdAt))
      expect(columnName(createdAt, 'createdAt') as string).toBe('created_at');
    if (isEnumField(typeName))
      expect(storedValue(typeName, 'SOCIAL_POST') as string).toBe('Social Post');
  });
});
