import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the storefront landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /chiếc điện thoại hợp gu/i })).toBeInTheDocument();
});
