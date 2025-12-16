'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Header component
 */
const Header = () => {
  return (
    <header className="w-full fixed top-0 left-0 z-50 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="text-black font-medium text-xl tracking-widest">
        TNF-VN<sup className="text-xl">&reg;</sup>
      </Link>
    </header>
  );
};

export default Header;