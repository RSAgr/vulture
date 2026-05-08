import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge classNames correctly', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn(isActive && 'bg-blue-500', 'text-white');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('should handle empty string', () => {
    const result = cn('', 'px-2', '');
    expect(result).toContain('px-2');
  });
});
