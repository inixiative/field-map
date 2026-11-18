import { describe, expect, it } from 'bun:test';
import { fieldAtPath, fieldOf, modelOf, own, relationTarget, relationTargetOf } from '../src/index';
import { prismaMap } from './fixtures/templateMap';

describe('own, modelOf, fieldOf: own properties only', () => {
  it('reads a model and a field', () => {
    expect(modelOf(prismaMap, 'User')).toBe(prismaMap.models.User);
    expect(fieldOf(prismaMap, 'User', 'email')).toMatchObject({ kind: 'scalar', type: 'String' });
  });

  it('a name only Object.prototype has reads as absent', () => {
    expect(modelOf(prismaMap, 'toString')).toBeUndefined();
    expect(fieldOf(prismaMap, 'User', 'constructor')).toBeUndefined();
    expect(own({}, 'hasOwnProperty')).toBeUndefined();
  });
});

describe('fieldAtPath: the field a dotted path ends on', () => {
  it('walks to-one and to-many relations', () => {
    expect(fieldAtPath(prismaMap, 'OrganizationUser', 'organization.name')).toMatchObject({
      kind: 'scalar',
      type: 'String',
    });
    expect(fieldAtPath(prismaMap, 'OrganizationUser', 'tokens')).toMatchObject({
      kind: 'object',
      isList: true,
    });
    expect(fieldAtPath(prismaMap, 'OrganizationUser', ['user', 'email'])).toMatchObject({
      type: 'String',
    });
  });

  it('is undefined for an undeclared segment, past a column, or into a Json column', () => {
    expect(fieldAtPath(prismaMap, 'OrganizationUser', 'nope')).toBeUndefined();
    expect(fieldAtPath(prismaMap, 'OrganizationUser', 'id.length')).toBeUndefined();
    expect(fieldAtPath(prismaMap, 'Organization', 'toString')).toBeUndefined();
  });

  it('relationTarget names the model a relation path leads to', () => {
    expect(relationTarget(prismaMap, 'OrganizationUser', 'organization')).toBe('Organization');
    expect(relationTarget(prismaMap, 'OrganizationUser', 'user.organizationUsers')).toBe(
      'OrganizationUser',
    );
    expect(relationTarget(prismaMap, 'OrganizationUser', 'id')).toBeNull();
    expect(relationTargetOf({ kind: 'scalar', type: 'String' })).toBeNull();
  });
});
