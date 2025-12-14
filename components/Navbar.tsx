'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState('GUEST');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // 1. Cek Token & Data User
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      if (name) setUserName(name.split(' ')[0]); // Ambil nama depan saja
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Hapus semua data sesi
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName('GUEST');
    router.push('/login');
  };

  // --- LOGIKA MENU BERDASARKAN ROLE ---
  const getNavLinks = () => {
    // Menu Dasar (Selalu ada)
    const baseMenu = [
      { label: 'EXHIBITION', sub: '3D BOOTH', href: '/exhibition' },
    ];

    // Jika ADMIN
    if (userRole === 'admin') {
      return [
        ...baseMenu,
        { label: 'VERIFIKASI KARYA', sub: 'ADMIN PANEL', href: '/dashboard' }
      ];
    }

    // Jika USER (Mahasiswa)
    if (userRole === 'user') {
      return [
        ...baseMenu,
        { label: 'UPLOAD KARYA', sub: 'SUBMISSION', href: '/upload' },
        { label: 'MANAGE KARYA', sub: 'PORTFOLIO', href: '/manage' }
      ];
    }

    // Jika GUEST (Belum Login)
    return baseMenu;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* 1. LOGO */}
          <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo Politeknik"
                width={140}
                height={50}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* 2. MENU TENGAH (DINAMIS) */}
          <div className="hidden md:flex space-x-8 lg:space-x-12">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group flex flex-col items-center text-center relative p-2">
                <span className="text-sm font-extrabold text-gray-800 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                  {link.label}
                </span>
                <span className="text-[9px] text-gray-400 font-medium uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">
                  {link.sub}
                </span>
                {/* Animated Underline */}
                <span className="absolute bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* 3. KANAN: AUTH & PROFILE */}
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="group relative px-6 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase rounded-full shadow-lg hover:shadow-blue-500/30 overflow-hidden transition-all hover:bg-blue-600"
              >
                <span className="relative z-10">Login Masuk</span>
              </Link>
            ) : (
              // User Profile Dropdown
              <div
                className="relative"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <button className="flex items-center gap-3 focus:outline-none group">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-900 uppercase">{userName}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{userRole}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px] shadow-md group-hover:shadow-lg transition-all">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                       <span className="text-blue-700 font-bold text-sm">{userName.charAt(0)}</span>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Halo,</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      KELUAR / LOGOUT
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}