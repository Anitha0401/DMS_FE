import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './pages/Login';
import { formatDate } from './components/utils/formatDate';

test('login form shows user ID and password fields', () => {
  render(<Login onLogin={() => undefined} isToShowAlert={false} />);
  expect(screen.getByLabelText('User ID')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
});

test('login shows the error message it is given', () => {
  render(<Login onLogin={() => undefined} isToShowAlert alertText="Invalid user ID or password." />);
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid user ID or password.');
});

test('dates use one format across the app', () => {
  expect(formatDate('2026-09-28T00:00:00')).toBe('28 Sep 2026');
  expect(formatDate('28-Sep-2026')).toBe('28 Sep 2026');
  expect(formatDate(null)).toBe('–');
});
