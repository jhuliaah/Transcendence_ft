// src/lib/server/permissions/community-permissions.test.ts
import { describe, expect, it } from 'vitest';
import {
  can,
  canChangeRole,
  canManageMember,
  type CommunityAction,
  type CommunityRole
} from './community-permissions';

const rows: [CommunityAction, CommunityRole, boolean][] = [
  ['community:edit_settings', 'OWNER', true],
  ['community:edit_settings', 'ADMIN', false],
  ['community:edit_settings', 'MEMBER', false],
  ['community:leave', 'OWNER', false],
  ['community:leave', 'ADMIN', true],
  ['community:leave', 'MEMBER', true],
  ['join_request:review', 'OWNER', true],
  ['join_request:review', 'ADMIN', true],
  ['join_request:review', 'MEMBER', false],
  ['invitation:send', 'OWNER', true],
  ['invitation:send', 'ADMIN', true],
  ['invitation:send', 'MEMBER', false],
  ['member:remove', 'OWNER', true],
  ['member:remove', 'ADMIN', true],
  ['member:remove', 'MEMBER', false],
  ['message:send', 'OWNER', true],
  ['message:send', 'ADMIN', true],
  ['message:send', 'MEMBER', true],
  ['message:moderate', 'OWNER', true],
  ['message:moderate', 'ADMIN', true],
  ['message:moderate', 'MEMBER', false],
  ['rules:change', 'OWNER', true],
  ['rules:change', 'ADMIN', true],
  ['rules:change', 'MEMBER', false]
];

describe('can', () => {
  it.each(rows)('%s as %s is %s', (action, role, expected) => {
    expect(can(role, action)).toBe(expected);
  });
});

describe('canManageMember', () => {
  it('lets the owner manage admins and members but not another owner', () => {
    expect(canManageMember('OWNER', 'ADMIN')).toBe(true);
    expect(canManageMember('OWNER', 'MEMBER')).toBe(true);
    expect(canManageMember('OWNER', 'OWNER')).toBe(false);
  });

  it('lets an admin manage only members', () => {
    expect(canManageMember('ADMIN', 'MEMBER')).toBe(true);
    expect(canManageMember('ADMIN', 'ADMIN')).toBe(false);
    expect(canManageMember('ADMIN', 'OWNER')).toBe(false);
  });

  it('never lets a member manage anyone', () => {
    expect(canManageMember('MEMBER', 'MEMBER')).toBe(false);
    expect(canManageMember('MEMBER', 'ADMIN')).toBe(false);
    expect(canManageMember('MEMBER', 'OWNER')).toBe(false);
  });
});

describe('canChangeRole', () => {
  it('allows only the owner to change roles', () => {
    expect(canChangeRole('OWNER', 'MEMBER', 'ADMIN')).toBe(true);
    expect(canChangeRole('ADMIN', 'MEMBER', 'ADMIN')).toBe(false);
  });

  it('never changes the owner role or promotes someone to owner', () => {
    expect(canChangeRole('OWNER', 'OWNER', 'ADMIN')).toBe(false);
    expect(canChangeRole('OWNER', 'MEMBER', 'OWNER')).toBe(false);
  });
});
