import type { FieldMap } from './types';

// Compile-time paths over a literal field map (`typeof prismaMap`, as `field-map generate`
// writes). Over a map typed only as `FieldMap`, every one of these is `string`, so a caller
// without a literal map is unchanged.

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7];

type Literal<K> = string extends K ? false : true;

type FieldsOf<M extends FieldMap, Model extends string> = Model extends keyof M['models']
  ? M['models'][Model]['fields']
  : never;

/** The model names of a map. */
export type ModelNameOf<M extends FieldMap> =
  Literal<keyof M['models']> extends true ? Extract<keyof M['models'], string> : string;

/** The field names of a model. */
export type FieldNameOf<M extends FieldMap, Model extends string> =
  Literal<keyof M['models']> extends true ? Extract<keyof FieldsOf<M, Model>, string> : string;

/** The fields of a model that hold a value: scalar and enum fields. */
export type ScalarFieldNameOf<M extends FieldMap, Model extends string> =
  Literal<keyof M['models']> extends true
    ? {
        [F in keyof FieldsOf<M, Model>]: FieldsOf<M, Model>[F] extends { kind: 'scalar' | 'enum' }
          ? F
          : never;
      }[keyof FieldsOf<M, Model>] &
        string
    : string;

/** The relation fields of a model. */
export type RelationFieldNameOf<M extends FieldMap, Model extends string> =
  Literal<keyof M['models']> extends true
    ? {
        [F in keyof FieldsOf<M, Model>]: FieldsOf<M, Model>[F] extends { kind: 'object' }
          ? F
          : never;
      }[keyof FieldsOf<M, Model>] &
        string
    : string;

/** The model a relation field leads to: the type twin of `relationTargetOf`. */
export type RelationTargetOf<M extends FieldMap, Model extends string, Field extends string> =
  Literal<keyof M['models']> extends true
    ? Field extends keyof FieldsOf<M, Model>
      ? FieldsOf<M, Model>[Field] extends { kind: 'object'; type: infer Target extends string }
        ? Target
        : never
      : never
    : string;

/** Whether a field entry is a to-many relation. */
export type IsToMany<Entry> = Entry extends { kind: 'object'; isList: true } ? true : false;

/**
 * The dotted paths from a model to a value its row can be read at: a scalar or enum field,
 * through any number of to-one relations up to `Depth`, and on into a Json column with any
 * sub-path (`meta.anything`), as a json-rules field rule reads them. A path never passes a to-many
 * relation, which reads no single row.
 */
export type ScalarPath<M extends FieldMap, Model extends string, Depth extends number = 3> =
  Literal<keyof M['models']> extends true ? ScalarPathAt<M, Model, Depth> : string;

type ScalarPathAt<M extends FieldMap, Model extends string, Depth extends number> = {
  [F in keyof FieldsOf<M, Model> & string]: FieldsOf<M, Model>[F] extends {
    kind: 'scalar';
    type: 'Json';
  }
    ? F | `${F}.${string}`
    : FieldsOf<M, Model>[F] extends { kind: 'scalar' | 'enum' }
      ? F
      : FieldsOf<M, Model>[F] extends { kind: 'object'; isList: true }
        ? never
        : [Depth] extends [0]
          ? never
          : FieldsOf<M, Model>[F] extends { kind: 'object'; type: infer Target extends string }
            ? `${F}.${ScalarPathAt<M, Target, Prev[Depth]>}`
            : never;
}[keyof FieldsOf<M, Model> & string];

/**
 * The dotted paths from a model to a relation, through to-one relations up to `Depth`: what a
 * relation, array or aggregate node names. `IsToMany` on the entry says which kind it ends on.
 */
export type RelationPath<M extends FieldMap, Model extends string, Depth extends number = 3> =
  Literal<keyof M['models']> extends true ? RelationPathAt<M, Model, Depth> : string;

type RelationPathAt<M extends FieldMap, Model extends string, Depth extends number> = {
  [F in keyof FieldsOf<M, Model> & string]: FieldsOf<M, Model>[F] extends {
    kind: 'object';
    isList: true;
  }
    ? F
    : FieldsOf<M, Model>[F] extends { kind: 'object'; type: infer Target extends string }
      ? F | ([Depth] extends [0] ? never : `${F}.${RelationPathAt<M, Target, Prev[Depth]>}`)
      : never;
}[keyof FieldsOf<M, Model> & string];

/** The model a relation path leads to. */
export type RelationPathTarget<
  M extends FieldMap,
  Model extends string,
  Path extends string,
> = Path extends `${infer Head}.${infer Rest}`
  ? RelationPathTarget<M, RelationTargetOf<M, Model, Head>, Rest>
  : RelationTargetOf<M, Model, Path>;
