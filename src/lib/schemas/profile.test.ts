import { describe, expect, it } from 'vitest';
import { completeProfileSchema } from './profile';

describe('completeProfileSchema', () => {
  it('accepts a name and trims it', () => {
    const result = completeProfileSchema.safeParse({ name: '  Júlia Almeida  ' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe('Júlia Almeida');
    }
  });

  it('rejects an empty name', () => {
    const result = completeProfileSchema.safeParse({ name: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    const result = completeProfileSchema.safeParse({ name: 'a'.repeat(101) });

    expect(result.success).toBe(false);
  });

  it('ignores fields other than the name', () => {
    const result = completeProfileSchema.safeParse({
      name: 'Júlia',
      email: 'other@example.com'
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ name: 'Júlia' });
    }
  });
});
