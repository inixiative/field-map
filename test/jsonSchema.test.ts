import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { fieldMapFromJsonSchema, type JsonSchema } from '../src/index';

const at = { model: 'Event' };

describe('fieldMapFromJsonSchema: scalars, enums, required', () => {
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      at: { type: 'string', format: 'date-time' },
      count: { type: 'integer' },
      score: { type: 'number' },
      done: { type: 'boolean' },
      status: { type: 'string', enum: ['open', 'closed'] },
      kind: { type: 'string', const: 'pr.opened' },
      level: { type: 'integer', enum: [1, 2, 3] },
      anything: {},
      also: true,
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'at', 'status', 'tags'],
  } as const satisfies JsonSchema;
  const map = fieldMapFromJsonSchema(schema, at);
  const fields = map.models.Event.fields;

  test('maps JSON types to field kinds; `required` is isRequired', () => {
    expect(fields.id).toEqual({ kind: 'scalar', type: 'String', isList: false, isRequired: true });
    expect(fields.at).toEqual({
      kind: 'scalar',
      type: 'DateTime',
      isList: false,
      isRequired: true,
    });
    expect(fields.count).toEqual({ kind: 'scalar', type: 'Int', isList: false, isRequired: false });
    expect(fields.score.type).toBe('Float');
    expect(fields.done.type).toBe('Boolean');
    expect(fields.anything.type).toBe('Json');
    expect(fields.also.type).toBe('Json');
    expect(fields.tags).toEqual({ kind: 'scalar', type: 'String', isList: true, isRequired: true });
  });

  test('a string enum or const is an enum, registered in `enums` like prisma-map', () => {
    expect(fields.status).toEqual({
      kind: 'enum',
      type: 'Event.status',
      values: ['open', 'closed'],
      isList: false,
      isRequired: true,
    });
    expect(fields.kind).toMatchObject({ kind: 'enum', values: ['pr.opened'] });
    expect(map.enums).toEqual({ 'Event.status': ['open', 'closed'], 'Event.kind': ['pr.opened'] });
  });

  test('a non-string enum is a plain scalar of its type', () => {
    expect(fields.level).toEqual({ kind: 'scalar', type: 'Int', isList: false, isRequired: false });
  });
});

describe('fieldMapFromJsonSchema: nullable', () => {
  const schema = {
    type: 'object',
    properties: {
      anyOfNull: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
      typeArray: { type: ['integer', 'null'] },
      openApi: { type: 'boolean', nullable: true },
      enumNull: { type: ['string', 'null'], enum: ['a', 'b', null] },
      obj: {
        anyOf: [{ type: 'object', properties: { id: { type: 'string' } } }, { type: 'null' }],
      },
      list: { anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] },
    },
    required: ['anyOfNull', 'typeArray', 'openApi', 'enumNull', 'obj', 'list'],
  } as const satisfies JsonSchema;
  const fields = fieldMapFromJsonSchema(schema, at).models.Event.fields;

  test('resolves to the non-null shape, never required', () => {
    expect(fields.anyOfNull).toEqual({
      kind: 'scalar',
      type: 'DateTime',
      isList: false,
      isRequired: false,
    });
    expect(fields.typeArray).toMatchObject({ type: 'Int', isRequired: false });
    expect(fields.openApi).toMatchObject({ type: 'Boolean', isRequired: false });
    expect(fields.enumNull).toMatchObject({ kind: 'enum', values: ['a', 'b'], isRequired: false });
    expect(fields.obj).toEqual({
      kind: 'object',
      type: 'Event.obj',
      isList: false,
      isRequired: false,
    });
    expect(fields.list).toMatchObject({ type: 'String', isList: true, isRequired: false });
  });
});

describe('fieldMapFromJsonSchema: objects, records, unions', () => {
  const schema = {
    type: 'object',
    properties: {
      subject: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          owner: { type: 'object', properties: { id: {} } },
        },
      },
      comments: {
        type: 'array',
        items: { type: 'object', properties: { body: { type: 'string' } } },
      },
      record: { type: 'object', additionalProperties: { type: 'string' } },
      empty: { type: 'object', properties: {} },
      bare: { type: 'object' },
      union: {
        oneOf: [
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { b: { type: 'number' } } },
        ],
      },
      mixed: { anyOf: [{ type: 'string' }, { type: 'integer' }] },
      literals: { anyOf: [{ const: 'x' }, { type: 'string', enum: ['y', 'z'] }, { type: 'null' }] },
      intersection: {
        allOf: [
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { b: { type: 'string' } } },
        ],
      },
      restTuple: { type: 'array', prefixItems: [{ type: 'number' }], items: { type: 'string' } },
      tuple: { type: 'array', prefixItems: [{ type: 'string' }] },
      oldTuple: { type: 'array', items: [{ type: 'string' }] },
      matrix: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    },
  } as const satisfies JsonSchema;
  const models = fieldMapFromJsonSchema(schema, at).models;
  const fields = models.Event.fields;

  test('a nested object is the model <parent>.<field>, to any depth', () => {
    expect(fields.subject).toMatchObject({ kind: 'object', type: 'Event.subject', isList: false });
    expect(models['Event.subject'].fields.owner).toMatchObject({ type: 'Event.subject.owner' });
    expect(models['Event.subject.owner'].fields.id.type).toBe('Json');
  });

  test('an array of objects is a to-many relation', () => {
    expect(fields.comments).toMatchObject({ kind: 'object', type: 'Event.comments', isList: true });
    expect(models['Event.comments'].fields.body.type).toBe('String');
  });

  test('a record, an empty object or a bare object is Json, not a model', () => {
    for (const name of ['record', 'empty', 'bare'])
      expect(fields[name]).toMatchObject({ kind: 'scalar', type: 'Json' });
    expect(models['Event.record']).toBeUndefined();
  });

  test('a union of several shapes, allOf, and tuples are Json', () => {
    for (const name of ['union', 'mixed', 'intersection', 'tuple', 'oldTuple', 'restTuple'])
      expect(fields[name]).toMatchObject({ kind: 'scalar', type: 'Json', isList: false });
    expect(models['Event.union']).toBeUndefined();
  });

  test('a union of string literals is one enum', () => {
    expect(fields.literals).toMatchObject({ kind: 'enum', values: ['x', 'y', 'z'] });
  });

  test('an array of arrays is a list of Json', () => {
    expect(fields.matrix).toMatchObject({ kind: 'scalar', type: 'Json', isList: true });
  });

  test('a root array lenses its items', () => {
    const list = fieldMapFromJsonSchema({ type: 'array', items: schema }, at);
    expect(Object.keys(list.models.Event.fields)).toEqual(Object.keys(fields));
  });
});

describe('fieldMapFromJsonSchema: $ref and $defs', () => {
  test('a reused $defs shape is one model named after its key', () => {
    const schema = {
      type: 'object',
      properties: {
        author: { $ref: '#/$defs/User' },
        reviewers: { type: 'array', items: { $ref: '#/$defs/User' } },
        role: { $ref: '#/definitions/Role' },
      },
      $defs: {
        User: {
          type: 'object',
          properties: { id: { $ref: '#/$defs/Id' }, role: { $ref: '#/definitions/Role' } },
        },
        Id: { type: 'string' },
      },
      definitions: { Role: { type: 'string', enum: ['admin', 'member'] } },
    } as const satisfies JsonSchema;
    const map = fieldMapFromJsonSchema(schema, at);
    expect(map.models.Event.fields.author).toMatchObject({ kind: 'object', type: 'User' });
    expect(map.models.Event.fields.reviewers).toMatchObject({ type: 'User', isList: true });
    expect(map.models.User.fields.id.type).toBe('String');
    expect(map.models.User.fields.role).toMatchObject({ kind: 'enum', type: 'Role' });
    expect(map.models.Event.fields.role).toMatchObject({ kind: 'enum', type: 'Role' });
    expect(map.enums).toEqual({ Role: ['admin', 'member'] });
    expect(Object.keys(map.models).sort()).toEqual(['Event', 'User']);
  });

  test('a recursive reference is a relation to the model already built', () => {
    const Node: z.ZodType = z.object({
      name: z.string(),
      get children() {
        return z.array(Node);
      },
      get parent() {
        return Node.nullable();
      },
    });
    const self = fieldMapFromJsonSchema(z.toJSONSchema(Node), { model: 'Node' });
    expect(Object.keys(self.models)).toEqual(['Node']);
    expect(self.models.Node.fields.children).toMatchObject({
      type: 'Node',
      isList: true,
    });
    expect(self.models.Node.fields.parent).toMatchObject({
      type: 'Node',
      isRequired: false,
    });

    const viaDefs = fieldMapFromJsonSchema(z.toJSONSchema(z.object({ root: Node, other: Node })), {
      model: 'Forest',
    });
    const [defName] = Object.keys(z.toJSONSchema(z.object({ root: Node })).$defs ?? {});
    const models = viaDefs.models;
    expect(Object.keys(models).sort()).toEqual(['Forest', defName].sort());
    expect(models.Forest.fields.root.type).toBe(defName);
    expect(models.Forest.fields.other.type).toBe(defName);
    expect(models[defName].fields.children).toMatchObject({ type: defName, isList: true });
  });

  test('a root that is a $ref anchors the referenced model under the caller’s name', () => {
    const schema = {
      $ref: '#/$defs/Node',
      $defs: {
        Node: { type: 'object', properties: { next: { $ref: '#/$defs/Node' } } },
      },
    } as const satisfies JsonSchema;
    const models = fieldMapFromJsonSchema(schema, at).models;
    expect(Object.keys(models)).toEqual(['Event']);
    expect(models.Event.fields.next.type).toBe('Event');
  });

  test('a ref that is not local, or has no target, throws', () => {
    expect(() =>
      fieldMapFromJsonSchema(
        { type: 'object', properties: { a: { $ref: 'https://x/y.json' } } },
        at,
      ),
    ).toThrow('local');
    expect(() =>
      fieldMapFromJsonSchema(
        { type: 'object', properties: { a: { $ref: '#/$defs/Missing' } } },
        at,
      ),
    ).toThrow('no target');
  });

  test('two shapes that would share a model name throw', () => {
    const schema = {
      type: 'object',
      properties: { a: { $ref: '#/$defs/Event' } },
      $defs: { Event: { type: 'object', properties: { x: { type: 'string' } } } },
    } as const satisfies JsonSchema;
    expect(() => fieldMapFromJsonSchema(schema, at)).toThrow("model 'Event'");
  });
});

describe('fieldMapFromJsonSchema: refusals', () => {
  test('a schema with no fields throws instead of building an empty map', () => {
    expect(() => fieldMapFromJsonSchema({}, at)).toThrow('no fields');
    expect(() => fieldMapFromJsonSchema({ type: 'string' }, at)).toThrow('no fields');
  });
});

describe('fieldMapFromJsonSchema: a zod v4 event envelope', () => {
  const Actor = z.object({ id: z.string(), model: z.enum(['User', 'Token']) });
  const EventEnvelope = z.object({
    id: z.string(),
    occurredAt: z.iso.datetime(),
    type: z.string(),
    actor: Actor.nullable(),
    subject: z.object({ model: z.string(), id: z.string() }),
    labels: z.array(z.string()),
    reviews: z.array(z.object({ state: z.enum(['approved', 'changes']), by: z.string() })),
    payload: z.record(z.string(), z.unknown()),
    deliveredAt: z.iso.datetime().nullable().optional(),
  });
  const map = fieldMapFromJsonSchema(z.toJSONSchema(EventEnvelope), { model: 'Event' });
  const models = map.models;

  test('round-trips through z.toJSONSchema', () => {
    expect(models.Event.fields).toEqual({
      id: { kind: 'scalar', type: 'String', isList: false, isRequired: true },
      occurredAt: { kind: 'scalar', type: 'DateTime', isList: false, isRequired: true },
      type: { kind: 'scalar', type: 'String', isList: false, isRequired: true },
      actor: { kind: 'object', type: 'Event.actor', isList: false, isRequired: false },
      subject: { kind: 'object', type: 'Event.subject', isList: false, isRequired: true },
      labels: { kind: 'scalar', type: 'String', isList: true, isRequired: true },
      reviews: { kind: 'object', type: 'Event.reviews', isList: true, isRequired: true },
      payload: { kind: 'scalar', type: 'Json', isList: false, isRequired: true },
      deliveredAt: { kind: 'scalar', type: 'DateTime', isList: false, isRequired: false },
    });
    expect(models['Event.actor'].fields.model).toMatchObject({
      kind: 'enum',
      values: ['User', 'Token'],
    });
    expect(map.enums).toEqual({
      'Event.actor.model': ['User', 'Token'],
      'Event.reviews.state': ['approved', 'changes'],
    });
  });
});

describe('fieldMapFromJsonSchema: edge shapes', () => {
  test('a one-member allOf is its member; nullable beside it makes it optional', () => {
    const schema = {
      type: 'object',
      properties: { owner: { allOf: [{ $ref: '#/$defs/User' }], nullable: true } },
      required: ['owner'],
      $defs: { User: { type: 'object', properties: { id: { type: 'string' } } } },
    } as const satisfies JsonSchema;
    expect(fieldMapFromJsonSchema(schema, at).models.Event.fields.owner).toEqual({
      kind: 'object',
      type: 'User',
      isList: false,
      isRequired: false,
    });
  });

  test('nullable on a $ref, and nullable list items, keep the referenced shape', () => {
    const schema = {
      type: 'object',
      properties: {
        role: { $ref: '#/$defs/Role', nullable: true },
        ids: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'null' }] } },
      },
      required: ['role', 'ids'],
      $defs: { Role: { type: 'string', enum: ['admin'] } },
    } as const satisfies JsonSchema;
    const fields = fieldMapFromJsonSchema(schema, at).models.Event.fields;
    expect(fields.role).toMatchObject({ kind: 'enum', type: 'Role', isRequired: false });
    expect(fields.ids).toMatchObject({ type: 'String', isList: true, isRequired: true });
  });

  test('a type array of several non-null types is Json', () => {
    const fields = fieldMapFromJsonSchema(
      { type: 'object', properties: { v: { type: ['string', 'number', 'null'] } } },
      at,
    ).models.Event.fields;
    expect(fields.v).toMatchObject({ kind: 'scalar', type: 'Json', isRequired: false });
  });

  test('mutual recursion through draft-07 definitions relates the two models', () => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { org: { $ref: '#/definitions/Org' } },
      definitions: {
        Org: { type: 'object', properties: { owner: { $ref: '#/definitions/Person' } } },
        Person: { type: 'object', properties: { org: { $ref: '#/definitions/Org' } } },
      },
    } as const satisfies JsonSchema;
    const models = fieldMapFromJsonSchema(schema, at).models;
    expect(Object.keys(models).sort()).toEqual(['Event', 'Org', 'Person']);
    expect(models.Org.fields.owner.type).toBe('Person');
    expect(models.Person.fields.org.type).toBe('Org');
  });

  test('a shape that only reaches itself is Json, not an overflow', () => {
    const schema = {
      type: 'object',
      properties: { loop: { $ref: '#/$defs/A' }, selfUnion: { $ref: '#/$defs/U' } },
      $defs: {
        A: { $ref: '#/$defs/B' },
        B: { $ref: '#/$defs/A' },
        U: { anyOf: [{ $ref: '#/$defs/U' }, { const: 'x' }] },
      },
    } as const satisfies JsonSchema;
    const fields = fieldMapFromJsonSchema(schema, at).models.Event.fields;
    expect(fields.loop).toMatchObject({ kind: 'scalar', type: 'Json' });
    expect(fields.selfUnion).toMatchObject({ kind: 'scalar', type: 'Json' });
  });

  test('a $defs key is found as written, and pointer-escaped', () => {
    const schema = {
      type: 'object',
      properties: { a: { $ref: '#/$defs/100%' }, b: { $ref: '#/$defs/a~1b' } },
      $defs: { '100%': { type: 'integer' }, 'a/b': { type: 'boolean' } },
    } as const satisfies JsonSchema;
    const fields = fieldMapFromJsonSchema(schema, at).models.Event.fields;
    expect(fields.a.type).toBe('Int');
    expect(fields.b.type).toBe('Boolean');
  });

  test('a union repeating a literal lists it once', () => {
    const fields = fieldMapFromJsonSchema(
      { type: 'object', properties: { s: { anyOf: [{ const: 'a' }, { enum: ['a', 'b'] }] } } },
      at,
    ).models.Event.fields;
    expect(fields.s).toMatchObject({ kind: 'enum', values: ['a', 'b'] });
  });

  test('a property named __proto__ is an own field, not a prototype write', () => {
    const schema = JSON.parse(
      '{"type":"object","properties":{"__proto__":{"type":"string"},"id":{"type":"string"}}}',
    ) as JsonSchema;
    const fields = fieldMapFromJsonSchema(schema, at).models.Event.fields;
    expect(Object.keys(fields)).toEqual(['__proto__', 'id']);
    expect(Object.getPrototypeOf(fields)).toBe(Object.prototype);
  });

  test('an enum $defs key shaped like a path that clashes with an inline enum throws', () => {
    const schema = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['open'] },
        other: { $ref: '#/$defs/Event.status' },
      },
      $defs: { 'Event.status': { type: 'string', enum: ['closed'] } },
    } as const satisfies JsonSchema;
    expect(() => fieldMapFromJsonSchema(schema, at)).toThrow('two value sets');
  });
});

describe('fieldMapFromJsonSchema: OpenAPI component refs', () => {
  const document = {
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: { id: { type: 'string' }, org: { $ref: '#/components/schemas/Org' } },
          required: ['id'],
        },
        Org: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
  };
  const reward = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      owner: { allOf: [{ $ref: '#/components/schemas/User' }], nullable: true },
    },
  } as const satisfies JsonSchema;

  test('a #/components/schemas ref resolves against the document, named after its key', () => {
    const map = fieldMapFromJsonSchema(reward, { model: 'Reward', document });
    expect(Object.keys(map.models).sort()).toEqual(['Org', 'Reward', 'User']);
    expect(map.models.Reward.fields.owner).toEqual({
      kind: 'object',
      type: 'User',
      isList: false,
      isRequired: false,
    });
    expect(map.models.User.fields.org).toMatchObject({ kind: 'object', type: 'Org' });
  });

  test('without the document it says what it needs', () => {
    expect(() => fieldMapFromJsonSchema(reward, { model: 'Reward' })).toThrow(
      'needs the document it points into',
    );
  });

  test('a pointer into the document that has no target throws', () => {
    const missing = { type: 'object', properties: { a: { $ref: '#/components/schemas/Nope' } } };
    expect(() => fieldMapFromJsonSchema(missing, { model: 'R', document })).toThrow('no target');
  });
});
