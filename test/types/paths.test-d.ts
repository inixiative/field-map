// Compile-time tests: `tsc --noEmit` (in `bun run check`) fails if an expectation stops holding.
import type {
  FieldMap,
  FieldNameOf,
  ModelNameOf,
  RelationFieldNameOf,
  RelationPath,
  RelationPathTarget,
  RelationTargetOf,
  ScalarFieldNameOf,
  ScalarPath,
} from '../../src/index';
import type { PrismaMap } from '../fixtures/templateMap';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const expectType = <T extends true>(): T => true as T;

// Model and field names.
const model: ModelNameOf<PrismaMap> = 'OrganizationUser';
// @ts-expect-error not a model
const notModel: ModelNameOf<PrismaMap> = 'OrganisationUser';
const field: FieldNameOf<PrismaMap, 'OrganizationUser'> = 'organizationId';
const scalar: ScalarFieldNameOf<PrismaMap, 'OrganizationUser'> = 'role';
// @ts-expect-error a relation is not a scalar field
const relationAsScalar: ScalarFieldNameOf<PrismaMap, 'OrganizationUser'> = 'organization';
const relation: RelationFieldNameOf<PrismaMap, 'OrganizationUser'> = 'tokens';
expectType<
  Equal<RelationTargetOf<PrismaMap, 'OrganizationUser', 'organization'>, 'Organization'>
>();

// Scalar paths: through to-one relations, into Json, never past a to-many relation.
const own: ScalarPath<PrismaMap, 'OrganizationUser'> = 'role';
const viaToOne: ScalarPath<PrismaMap, 'OrganizationUser'> = 'organization.name';
const twoHops: ScalarPath<PrismaMap, 'OrganizationUser'> = 'user.email';
const intoJson: ScalarPath<PrismaMap, 'AuditLog'> = 'changes.anything.deep';
// @ts-expect-error a path past a to-many relation reads no single row
const pastToMany: ScalarPath<PrismaMap, 'OrganizationUser'> = 'tokens.name';
// @ts-expect-error not a field
const typo: ScalarPath<PrismaMap, 'OrganizationUser'> = 'organization.nmae';
// @ts-expect-error a relation is not a value
const bareRelation: ScalarPath<PrismaMap, 'OrganizationUser'> = 'organization';

// Relation paths: what a relation, array or aggregate rule names.
const toMany: RelationPath<PrismaMap, 'OrganizationUser'> = 'tokens';
const toOne: RelationPath<PrismaMap, 'OrganizationUser'> = 'organization';
const nested: RelationPath<PrismaMap, 'OrganizationUser'> = 'organization.tokens';
// @ts-expect-error a column is not a relation
const column: RelationPath<PrismaMap, 'OrganizationUser'> = 'role';
expectType<
  Equal<
    RelationPathTarget<PrismaMap, 'OrganizationUser', 'user.organizationUsers'>,
    'OrganizationUser'
  >
>();

// Over a map typed only as FieldMap, every path type is string.
expectType<Equal<ModelNameOf<FieldMap>, string>>();
expectType<Equal<ScalarPath<FieldMap, 'Anything'>, string>>();
expectType<Equal<RelationPath<FieldMap, 'Anything'>, string>>();

export const used = [
  model,
  notModel,
  field,
  scalar,
  relationAsScalar,
  relation,
  own,
  viaToOne,
  twoHops,
  intoJson,
  pastToMany,
  typo,
  bareRelation,
  toMany,
  toOne,
  nested,
  column,
];
