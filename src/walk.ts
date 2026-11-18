import { fieldOf, modelOf } from './own';
import type { FieldEntry, FieldMap } from './types';

/** The model a relation field leads to; null for a column. */
export const relationTargetOf = (entry: FieldEntry): string | null =>
  entry.kind === 'object' ? entry.type : null;

const segmentsOf = (path: string | readonly string[]): readonly string[] =>
  typeof path === 'string' ? path.split('.') : path;

/**
 * The field a dotted path ends on, each segment read at the model the relation before it leads
 * to (to-one or to-many). Undefined when a segment is undeclared, when the path continues past a
 * column (a Json column included: what is inside it is not declared), or when a relation leads to
 * a model the map doesn't have.
 */
export const fieldAtPath = (
  map: FieldMap,
  model: string,
  path: string | readonly string[],
): FieldEntry | undefined => {
  const segments = segmentsOf(path);
  let at = model;
  for (let index = 0; index < segments.length; index++) {
    const entry = fieldOf(map, at, segments[index]);
    if (!entry) return undefined;
    if (index === segments.length - 1) return entry;
    const next = relationTargetOf(entry);
    if (next === null || !modelOf(map, next)) return undefined;
    at = next;
  }
  return undefined;
};

/** The model a path of relations leads to; null when it doesn't end on a declared relation. */
export const relationTarget = (
  map: FieldMap,
  model: string,
  path: string | readonly string[],
): string | null => {
  const entry = fieldAtPath(map, model, path);
  return entry ? relationTargetOf(entry) : null;
};
