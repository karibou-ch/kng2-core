/**
 * Test suite for UserAddress.normalizePhone function
 *
 * Tests various phone number formats and edge cases to ensure
 * the normalization function works correctly for international usage.
 */

import { UserAddress } from '../src/user.service';

describe('UserAddress.normalizePhone', () => {

  it('should preserve international format with leading +', () => {
    expect(UserAddress.normalizePhone('+41791234567')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+33612345678')).toBe('+33612345678');
    expect(UserAddress.normalizePhone('+1234567890')).toBe('+1234567890');
  });

  it('should remove spaces and formatting but keep leading +', () => {
    expect(UserAddress.normalizePhone('+41 79 123 45 67')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+41-79-123-45-67')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+41 (79) 123.45.67')).toBe('+41791234567');
  });

  it('should convert 00 prefix to international + format', () => {
    expect(UserAddress.normalizePhone('0041791234567')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('0033612345678')).toBe('+33612345678');
    expect(UserAddress.normalizePhone('00 41 79 123 45 67')).toBe('+41791234567');
  });

  it('should handle Swiss mobile numbers (07x/08x/09x)', () => {
    expect(UserAddress.normalizePhone('079 123 45 67')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('076.123.45.67')).toBe('+41761234567');
    expect(UserAddress.normalizePhone('078-123-45-67')).toBe('+41781234567');
    expect(UserAddress.normalizePhone('079 123 45 67')).toBe('+41791234567');
  });

  it('should handle edge cases', () => {
    expect(UserAddress.normalizePhone('')).toBe('');
    expect(UserAddress.normalizePhone(null as any)).toBe('');
    expect(UserAddress.normalizePhone(undefined as any)).toBe('');
  });

  it('should handle numbers with mixed formatting', () => {
    expect(UserAddress.normalizePhone('(+41) 79 123-45.67')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+41 (0)79 123 45 67')).toBe('+41791234567');
  });

  it('should handle various Swiss landline formats', () => {
    expect(UserAddress.normalizePhone('022 123 45 67')).toBe('0221234567');  // Geneva landline
    expect(UserAddress.normalizePhone('031 123 45 67')).toBe('0311234567');  // Bern landline
    expect(UserAddress.normalizePhone('044 123 45 67')).toBe('0441234567');  // Zurich landline
  });

  it('should not modify already normalized Swiss mobile numbers', () => {
    expect(UserAddress.normalizePhone('+41791234567')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+41781234567')).toBe('+41781234567');
  });

  it('should handle international numbers correctly', () => {
    expect(UserAddress.normalizePhone('+49 30 12345678')).toBe('+493012345678');    // Germany
    expect(UserAddress.normalizePhone('+33 1 23 45 67 89')).toBe('+33123456789');   // France
    expect(UserAddress.normalizePhone('+39 02 1234 5678')).toBe('+390212345678');   // Italy
    expect(UserAddress.normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');   // USA
  });

  // Test regression: ensure we fix the original bug
  it('should fix the original bug where + was stripped', () => {
    // This was the failing case in the original function
    expect(UserAddress.normalizePhone('+41791234567')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('+41 79 123 45 67')).toBe('+41791234567');

    // This should still work (00 → + conversion)
    expect(UserAddress.normalizePhone('0041791234567')).toBe('+41791234567');
  });

  it('should handle letters and special characters', () => {
    expect(UserAddress.normalizePhone('+41 79 ABC 123 DEF 45 67')).toBe('+41791234567');
    expect(UserAddress.normalizePhone('079#123*45&67')).toBe('+41791234567');
  });
});
