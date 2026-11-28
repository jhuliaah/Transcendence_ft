import { describe, expect, it } from 'vitest';
import { createCommunitySchema, createCommunityInvitationSchema } from './community';

describe('createCommunitySchema', () => {
  it('accepts valid community data', () => {
    const result = createCommunitySchema.safeParse({
      name: '  My Community  ',
      description: 'A community description.',
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe('My Community');
    }
  });

  it('accepts an empty description', () => {
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      description: '',
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createCommunitySchema.safeParse({
      name: '   ',
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    const result = createCommunitySchema.safeParse({
      name: 'a'.repeat(101),
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      description: 'a'.repeat(2001),
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid visibility values', () => {
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      visibility: 'UNLISTED',
      joinPolicy: 'OPEN'
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid join policy values', () => {
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      visibility: 'PUBLIC',
      joinPolicy: 'ANYONE'
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = createCommunitySchema.safeParse({
      name: 'My Community'
    });

    expect(result.success).toBe(false);
  });
});

describe('createCommunityInvitationSchema', () => {
  it('accepts a valid invited user ID', () => {
    const result = createCommunityInvitationSchema.safeParse({
      invitedUserId: 'user-123'
    });

    expect(result.success).toBe(true);
  });

  it('trims whitespace from the invited user ID', () => {
    const result = createCommunityInvitationSchema.safeParse({
      invitedUserId: '  user-123  '
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.invitedUserId).toBe('user-123');
    }
  });

  it('rejects an empty invited user ID', () => {
    const result = createCommunityInvitationSchema.safeParse({
      invitedUserId: '   '
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing invited user ID', () => {
    const result = createCommunityInvitationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
