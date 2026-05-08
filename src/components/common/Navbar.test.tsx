import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/common/Navbar';

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Navbar', () => {
    render(<Navbar />);
    expect(screen.getByText('Vulture')).toBeInTheDocument();
  });

  it('should display navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Why Vulture')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Proof')).toBeInTheDocument();
    expect(screen.getByText('Company Check')).toBeInTheDocument();
  });

  it('should have a CTA button', () => {
    render(<Navbar />);
    const ctaButton = screen.getByText('Get Free Audit');
    expect(ctaButton).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    render(<Navbar />);
    const whyVultureLink = screen.getByText('Why Vulture').closest('a');
    expect(whyVultureLink).toHaveAttribute('href', '#features');
  });

  it('should have sticky positioning', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });
});
