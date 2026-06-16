import { today } from '@/lib/dates';

describe('today', () => {
  it('formats as yyyy-MM-dd', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
