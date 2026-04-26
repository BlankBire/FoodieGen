'use client';
import React, { useEffect, useState } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';

interface AppHeaderProps {
  onOpenSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSettings }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('foodiegen_theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved || (systemDark ? 'dark' : 'light');
    setTheme(initialTheme as 'light' | 'dark');
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('foodiegen_theme', newTheme);
  };

  return (
  <header className="header-responsive" style={{
    textAlign: 'center',
    padding: 'var(--space-8) 0 var(--space-6)',
    borderBottom: '1px solid var(--border-default)',
    marginBottom: 'var(--space-6)',
    position: 'relative'
  }}>
    <div style={{ position: 'absolute', top: '24px', right: '0', display: 'flex', gap: '8px' }}>
      <button 
        onClick={toggleTheme}
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '10px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
        title={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <button 
        onClick={onOpenSettings}
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '10px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 500,
          boxShadow: 'var(--shadow-card)',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
        title="Cài đặt API"
        className="btn-settings-header"
      >
        <Settings size={18} />
        <span className="hide-mobile">Cài đặt</span>
      </button>
    </div>

    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-2)',
    }}>
      <div style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img 
          src="logo.png" 
          alt="FoodieGen Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
      <h1 className="header-title" style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: 28, fontWeight: 500,
        letterSpacing: '-0.01em',
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>FoodieGen</h1>
    </div>
    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
      Tạo video marketing đồ ăn tự động với AI
    </p>
  </header>
  );
};
