import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Container from '@/components/common/Container';

describe('Container Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(<Container>Test Content</Container>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply default container styling', () => {
    const { container } = render(<Container>Content</Container>);
    const div = container.querySelector('div');
    expect(div?.className).toContain('mx-auto');
    expect(div?.className).toContain('max-w-6xl');
  });

  it('should accept and apply custom className prop', () => {
    const { container } = render(
      <Container className="custom-class">Content</Container>
    );
    const div = container.querySelector('div');
    expect(div?.className).toContain('custom-class');
  });

  it('should render with multiple children', () => {
    render(
      <Container>
        <span>Child 1</span>
        <span>Child 2</span>
      </Container>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
