import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock window.alert
global.alert = vi.fn();

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
}));

// Importar React para o mock do Link
import React from 'react';

// Limpar mocks antes de cada teste
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});