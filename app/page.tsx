'use client'; // Wajib ditambahkan karena kita pakai useState

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import SplashScreen from '../components/SplashScreen'; // Import komponen baru

export default function HomePage() {
  // State untuk mengontrol tampilan Splash Screen
  const [showSplash, setShowSplash] = useState(true);

  // Opsional: Cek apakah user sudah pernah melihat intro (disimpan di session)
  // Agar kalau refresh tidak muncul lagi. Hapus useEffect ini jika ingin selalu muncul.
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenIntro', 'true'); // Tandai sudah dilihat
  };

  // Tampilkan Splash Screen jika state masih true
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // --- KONTEN UTAMA HALAMAN (Kode lama Anda) ---
  return (
    <main className="flex min-h-screen flex-col font-sans fade-in-animation">
      <Navbar />

      <div className="relative flex-grow flex items-center justify-center px-4">

        <div className="absolute inset-0 z-0">
          <Image
            src="/future.jpg"
            alt="Background Hijau"
            fill
            priority
            className="object-cover"
            quality={100}
          />
        </div>

        <div className="relative z-10 bg-white/95 backdrop-blur-sm max-w-4xl w-full p-12 md:p-16 text-center shadow-2xl rounded-sm">

          <h1 className="text-5xl md:text-6xl text-gray-900 font-normal leading-tight mb-6 tracking-tight">
            Presentasikan,<br />
            Manage dan <br />
            <span className="font-bold">Pamerkan Karya Mahasiswa</span>
          </h1>

          <p className="text-gray-500 text-lg mb-12 font-light tracking-wide">
            Tempat di mana Anda bisa mengupload dan <br />
            memamerkan karya.
          </p>

          <div className="flex justify-center">
            <Link
              href="/exhibition"
              className="group inline-flex items-center space-x-3 text-gray-900 font-bold tracking-[0.15em] uppercase hover:text-blue-600 transition-colors pb-1 border-b-2 border-transparent hover:border-blue-600"
            >
              <div className="bg-black text-white rounded-full p-1.5 group-hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span>VIEW CONTOH terbaru Ser;in</span>
            </Link>
          </div>
        </div>

      </div>

      <footer className="bg-[#1e2329] text-white py-4 px-8 border-t border-gray-800 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
          <div className="flex justify-start">
             <Image
                src="/logo.png"
                alt="Logo Footer"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto object-contain opacity-80 grayscale hover:grayscale-0 transition-all"
              />
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs text-center tracking-wide uppercase">
            © 2025 Politeknik Negeri Batam
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">
              Contact Admin
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}