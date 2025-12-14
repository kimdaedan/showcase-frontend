'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// Data Dummy dengan tambahan warna tema untuk setiap prodi
const prodiData = [
  { id: 1, name: "D3 Teknik Informatika", code: "IF", image: "/exhibitions/informatika.jpg", color: "bg-blue-600" },
  { id: 2, name: "D4 Tek. Rekayasa Multimedia", code: "TRM", image: "/exhibitions/multimedia.jpg", color: "bg-purple-600" },
  { id: 3, name: "D4 Keamanan Siber", code: "CYBER", image: "/exhibitions/siber.png", color: "bg-slate-800" },
  { id: 4, name: "D4 Animasi", code: "ANIMASI", image: "/exhibitions/animasi.jpg", color: "bg-pink-500" },
  { id: 5, name: "D4 Rekayasa Perangkat Lunak", code: "RPL", image: "/exhibitions/rpl.jpg", color: "bg-indigo-600" },
  { id: 6, name: "D3 Teknik Elektronika", code: "ELKA", image: "/exhibitions/game.jpg", color: "bg-yellow-500" },
  { id: 7, name: "D4 Mekatronika", code: "MK", image: "/exhibitions/geomatika.jpg", color: "bg-red-600" },
  { id: 8, name: "D3 Akuntansi", code: "AK", image: "/exhibitions/robotika.jpg", color: "bg-green-600" },
];

export default function ExhibitionPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProdi = prodiData.filter((prodi) =>
    prodi.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex min-h-screen flex-col font-sans relative overflow-x-hidden">

      {/* 1. BACKGROUND DINAMIS */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background"
          fill
          className="object-cover blur-[3px] scale-105"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-gray-900/95"></div>
      </div>

      {/* Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Konten Utama */}
      <div className="relative z-10 flex-grow px-4 py-12 md:px-8 flex flex-col items-center max-w-7xl mx-auto w-full">

        {/* 2. HEADER & SEARCH BAR GLASSMORPHISM */}
        <div className="w-full text-center mb-12 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Galeri Program Studi
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto font-light">
            Temukan karya inovatif dari mahasiswa terbaik Politeknik Negeri Batam. Pilih jurusan untuk memulai eksplorasi virtual.
          </p>

          {/* Search Input Modern */}
          <div className="relative max-w-xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl overflow-hidden">
              <span className="pl-4 text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="w-full py-3 px-4 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                placeholder="Cari jurusan (misal: Informatika)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 3. GRID CARD INTERAKTIF */}
        {filteredProdi.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full perspective-1000">
            {filteredProdi.map((prodi, index) => (
              <Link
                key={prodi.id}
                href={`/exhibition/${prodi.code.toLowerCase()}`}
                className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] bg-gray-800 border border-gray-700 hover:border-blue-500/50"
                style={{ animationDelay: `${index * 100}ms` }} // Efek muncul bergantian
              >
                {/* Gambar Background */}
                <Image
                  src={prodi.image}
                  alt={prodi.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                />

                {/* Overlay Gradient Gelap di Bawah */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300"></div>

                {/* Konten Text */}
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  {/* Badge Kode Prodi */}
                  <span className={`inline-block px-3 py-1 text-xs font-bold text-white rounded-full mb-3 shadow-md ${prodi.color}`}>
                    {prodi.code}
                  </span>

                  <h3 className="text-xl font-bold text-white leading-tight mb-1 drop-shadow-md group-hover:text-blue-300 transition-colors">
                    {prodi.name.replace("Prodi ", "")}
                  </h3>

                  {/* Garis Dekorasi */}
                  <div className="w-12 h-1 bg-blue-500 rounded-full mt-3 transition-all duration-300 group-hover:w-full group-hover:bg-white/50"></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* State Kosong */
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 w-full max-w-2xl mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white">Jurusan tidak ditemukan</h3>
            <p className="mt-2 text-gray-400">Silakan coba kata kunci pencarian lain.</p>
          </div>
        )}

      </div>

      {/* Footer Minimalis */}
      <div className="relative z-10 py-6 text-center text-gray-500 text-sm mt-auto border-t border-white/5">
        &copy; 2025 Politeknik Negeri Batam • Virtual Exhibition Platform
      </div>

    </main>
  );
}