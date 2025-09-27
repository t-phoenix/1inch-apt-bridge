'use client';

import { useNotification } from '@/lib/NotificationContext';

export function NavLinks() {
  const { showInfo } = useNotification();
  
  const handleNavClick = (href: string, label: string, active: boolean) => {
    if (!active && href !== '/trade') {
      showInfo(`${label} page coming soon!`, 'Coming Soon');
      return;
    }
    // For active/trade page, do nothing as we're already there
  };

  const navItems = [
    { href: '/trade', label: 'Trade', active: true },
    { href: '/portfolio', label: 'Portfolio', active: false },
    { href: '/dao', label: 'DAO', active: false },
    { href: '/buy-crypto', label: 'Buy Crypto', active: false },
    { href: '/card', label: 'Card', active: false },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <button
          key={item.href}
          onClick={() => handleNavClick(item.href, item.label, item.active)}
          className={`text-sm font-medium transition-colors ${
            item.active
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}