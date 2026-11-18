import { modelOf } from './own';
import type { FieldMap, Identifier, RelationField, RelationInfo } from './types';

/**
 * Collapse a relation's FK columns into a lookup Identifier.
 *
 * - no `fromFields` (a back-relation) → `null`
 * - a single same-named pair → the bare field name (string)
 * - otherwise → a `{ referencedField: localField }` map
 *
 * Mismatched-length pairs yield `null`.
 */
export const relationForeignKey = (field: RelationField): Identifier | null => {
  const fromFields = field.fromFields ?? [];
  const toFields = field.toFields ?? [];
  if (fromFields.length === 0 || fromFields.length !== toFields.length) return null;
  if (fromFields.length === 1 && fromFields[0] === toFields[0]) return fromFields[0];

  const composite: Record<string, string> = {};
  for (let i = 0; i < fromFields.length; i++) composite[toFields[i]] = fromFields[i];
  return composite;
};

/**
 * A model's relation fields as RelationInfo: the field, its target model, list-ness,
 * required-ness, collapsed foreign key, and any annotations. An absent `isList` or `isRequired`
 * reads as false.
 *
 * @throws if `modelName` is not in the map.
 */
export const relationsOf = (map: FieldMap, modelName: string): RelationInfo[] => {
  const model = modelOf(map, modelName);
  if (!model) throw new Error(`Model ${modelName} not found in the field map`);

  const relations: RelationInfo[] = [];
  for (const [field, entry] of Object.entries(model.fields)) {
    if (entry.kind !== 'object') continue;
    relations.push({
      field,
      targetModel: entry.type,
      isList: entry.isList ?? false,
      isRequired: entry.isRequired ?? false,
      foreignKey: relationForeignKey(entry),
      ...(entry.annotations ? { annotations: entry.annotations } : {}),
    });
  }
  return relations;
};
