import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User'
    });

    expect(result.success).toBe(true);
  });

  it('normalizes email whitespace', () => {
    const result = registerSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123'
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects invalid email addresses', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'password123'
    });

    expect(result.success).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '1234567'
    });

    expect(result.success).toBe(false);
  });

  it('rejects passwords longer than 128 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(129)
    });

    expect(result.success).toBe(false);
  });

  it('rejects emails longer than 254 characters', () => {
    const result = registerSchema.safeParse({
      email: `${'a'.repeat(243)}@example.com`,
      password: 'password123'
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty names', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: ''
    });

    expect(result.success).toBe(false);
  });

  it('rejects names longer than 100 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'a'.repeat(101)
    });

    expect(result.success).toBe(false);
  });

  it('accepts registration without an optional name', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(true);
  });

  it('normalizes email whitespace', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123'
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects invalid email addresses', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123'
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty passwords', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: ''
    });

    expect(result.success).toBe(false);
  });

  it('rejects passwords longer than 128 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(129)
    });

    expect(result.success).toBe(false);
  });
});
