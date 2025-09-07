import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
};

export default ThemeToggle;
