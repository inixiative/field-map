import { describe, expect, it } from 'bun:test';
import { fieldOf } from '../src/own';
import { readPrismaSchema } from '../src/prisma/v6/build';

describe('readPrismaSchema: the finishing step every Prisma reader shares', () => {
  const schema = `
enum Role {
  USER
  ADMIN
}

model Zebra {
  id    String @id
  role  Role
  title String
}

model Account {
  id        String                   @id
  search    Unsupported("tsvector")? @map("search_vector")
  legacy    String                   @ignore
  balance   Decimal
}

model Archived {
  id String @id

  @@ignore
}
`;
  const { map, unsupportedColumns } = readPrismaSchema(schema);

  it('sorts models and fields by name', () => {
    expect(Object.keys(map.models)).toEqual(['Account', 'Zebra']);
    expect(Object.keys(map.models.Zebra.fields)).toEqual(['id', 'role', 'title']);
  });

  it('registers each enum in `enums`, members sorted', () => {
    expect(map.enums).toEqual({ Role: ['ADMIN', 'USER'] });
  });

  it('moves Unsupported columns out of the map into unsupportedColumns', () => {
    expect(map.models.Account.fields).not.toHaveProperty('search');
    expect(unsupportedColumns).toEqual({ Account: ['search'] });
  });

  it('leaves out @ignore fields and @@ignore models, which the client has neither of', () => {
    expect(map.models.Account.fields).not.toHaveProperty('legacy');
    expect(map.models).not.toHaveProperty('Archived');
  });

  it('refuses a scalar type a field map does not hold', () => {
    expect(() =>
      readPrismaSchema(
        'type Address {\n  street String\n}\nmodel A {\n  id String @id\n  at Address\n}',
      ),
    ).toThrow("A.at: scalar type 'Address' is not one a field map holds");
  });

  it('reads a model or enum named after an Object.prototype key as its own', () => {
    const read = readPrismaSchema('model constructor {\n  id String @id\n}');
    expect(Object.keys(read.map.models)).toEqual(['constructor']);
    expect(fieldOf(read.map, 'constructor', 'id')).toMatchObject({
      kind: 'scalar',
      type: 'String',
    });
  });
});
