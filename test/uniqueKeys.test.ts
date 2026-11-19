import { describe, expect, it } from 'bun:test';
import { readPrismaSchema } from '../src/prisma/v6/build';
import type { FieldMap } from '../src/types';
import { uniqueKeysOf } from '../src/uniqueKeys';

const schema = `
enum Plan {
  FREE
  PAID
}

model Account {
  id     String @id
  email  String @unique
  plan   Plan   @unique
  name   String
  orgId  String
  slug   String

  @@unique([orgId, slug])
  @@index([name])
}

model Membership {
  userId String
  orgId  String
  role   String

  @@id([userId, orgId])
}
`;

describe('uniqueKeysOf', () => {
  const map = readPrismaSchema(schema).map;

  it('lists field-level @id and @unique keys, then each @@unique, and no plain @@index', () => {
    expect(uniqueKeysOf(map, 'Account')).toEqual([['email'], ['id'], ['plan'], ['orgId', 'slug']]);
  });

  it('lists a compound @@id as one key, not each of its fields', () => {
    expect(uniqueKeysOf(map, 'Membership')).toEqual([['userId', 'orgId']]);
  });

  it('reads a hand-written map that has no indexes', () => {
    const handWritten: FieldMap = {
      models: {
        Tag: { dbName: null, fields: { id: { kind: 'scalar', type: 'String', isId: true } } },
      },
      enums: {},
    };
    expect(uniqueKeysOf(handWritten, 'Tag')).toEqual([['id']]);
  });

  it('refuses a model the map does not have', () => {
    expect(() => uniqueKeysOf(map, 'Missing')).toThrow('Model Missing not found in the field map');
  });
});
