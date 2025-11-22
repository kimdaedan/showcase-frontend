'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State untuk menyimpan nama user, defaultnya 'GUEST'
  const [userName, setUserName] = useState('GUEST');

  useEffect(() => {
    // Cek apakah ada token di localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      // Ambil nama user dari localStorage saat komponen dimuat
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        // Ambil kata pertama saja (nama depan) agar muat dan rapi di navbar
        setUserName(storedName.split(' ')[0]);
      }
    }
  }, []);

  const handleLogout = () => {
    // Hapus data sesi
    localStorage.removeItem('token');
    localStorage.removeItem('userName');

    // Reset state
    setIsLoggedIn(false);
    setUserName('GUEST');

    // Arahkan ke halaman login
    router.push('/login');
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 relative z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-20">

          {/* KOLOM KIRI: Logo */}
          <div className="flex justify-start">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo"
                width={150}
                height={50}
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* KOLOM TENGAH: Menu Navigasi */}
          <div className="flex justify-center items-center space-x-10">
            <Link href="/exhibition" className="group flex flex-col items-center text-center">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider group-hover:text-blue-600 transition-colors">EXHIBITION</span>
              <span className="text-[10px] text-gray-500 font-light uppercase tracking-widest">3D BOOTH PRODI</span>
            </Link>

            {/* Dropdown Upload Karya */}
            <div className="relative h-full flex items-center" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
              <button className="group flex flex-col items-center text-center focus:outline-none">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wider group-hover:text-blue-600 transition-colors">UPLOAD KARYA</span>
                  <svg className={`ml-1 h-3 w-3 text-gray-400 transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <span className="text-[10px] text-gray-500 font-light uppercase tracking-widest">3D Exhibitions</span>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 w-48 bg-white border border-gray-100 rounded-md shadow-xl py-2 z-50">
                   <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white"></div>
                  <Link href="/upload" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50">Upload Karya Baru</Link>
                  <Link href="/dashboard" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">Hasil Verifikasi</Link>
                </div>
              )}
            </div>

            <Link href="/manage" className="group flex flex-col items-center text-center">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider group-hover:text-blue-600 transition-colors">MANAGE KARYA</span>
              <span className="text-[10px] text-gray-500 font-light uppercase tracking-widest">atur karya</span>
            </Link>
          </div>

          {/* KOLOM KANAN: Login & User Info */}
          <div className="flex justify-end items-center space-x-6">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="bg-red-600 text-white px-5 py-2 rounded shadow-md text-xs font-bold hover:bg-red-700 transition-all transform hover:scale-105 uppercase tracking-wide">LOGOUT</button>
            ) : (
              <Link href="/login" className="bg-[#1e2329] text-white px-5 py-2 rounded shadow-md text-xs font-bold hover:bg-gray-800 transition-all transform hover:scale-105 uppercase tracking-wide">LOGIN</Link>
            )}

            <div className="flex items-center space-x-2 cursor-default">
              {/* Menampilkan Nama User */}
              <span className="text-xs font-bold text-[#4a3aff] uppercase tracking-wider">
                {userName}
              </span>
              <div className="h-8 w-8 rounded-full bg-[#4a3aff] text-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}