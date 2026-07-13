import { describe, expect, it } from 'vitest';
import { arizonaDayKey, formatArizona, parseArizonaDateTime, toArizonaInput } from '../src/shared/arizonaTime.js';

describe('America/Phoenix wall-clock conversion', () => {
  it.each([
    ['winter standard-time date', '2027-01-15T08:30'],
    ['summer date while most of the US observes daylight saving time', '2027-07-15T08:30'],
  ])('preserves an owner-entered %s', (_label, entered) => {
    const instant = parseArizonaDateTime(entered);
    expect(instant.toISOString()).toBe(`${entered.slice(0, 10)}T15:30:00.000Z`);
    expect(toArizonaInput(instant)).toBe(entered);
    expect(arizonaDayKey(instant)).toBe(entered.slice(0, 10));
    expect(formatArizona(instant)).toContain('8:30 AM');
  });

  it('normalizes explicit instants for Arizona display rather than the viewer timezone', () => {
    expect(toArizonaInput('2027-07-15T15:30:00.000Z')).toBe('2027-07-15T08:30');
    expect(toArizonaInput('2027-07-15T08:30:00-07:00')).toBe('2027-07-15T08:30');
  });

  it('treats SQLite audit timestamps as UTC before formatting in Arizona', () => {
    expect(toArizonaInput('2027-07-15 15:30:00')).toBe('2027-07-15T08:30');
    expect(formatArizona('2027-01-15 15:30:00')).toContain('8:30 AM');
  });
});
