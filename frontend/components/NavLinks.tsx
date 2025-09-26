'use client';

import Link from 'next/link';

const navItems = [
  { href: '/trade', label: 'Trade', active: true },
  { href: '/portfolio', label: 'Portfolio', active: false },
  { href: '/dao', label: 'DAO', active: false },
  { href: '/buy-crypto', label: 'Buy Crypto', active: false },
  { href: '/card', label: 'Card', active: false },
];

export function NavLinks() {
  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors ${
            item.active
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}