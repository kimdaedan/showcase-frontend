'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Import Link untuk navigasi
import Navbar from '../../components/Navbar';

// Data Dummy untuk 8 Prodi
const prodiData = [
  {
    id: 1,
    name: "Prodi D3 Teknik Informatika",
    code: "IF",
    // Pastikan gambar ada di public/prodi/ atau ganti ke placeholder jika belum ada
    image: "exhibitions/informatika.jpg",
  },
  {
    id: 2,
    name: "Prodi D4 Teknologi Rekayasa Multimedia",
    code: "TRM",
    image: "exhibitions/multimedia.jpg",
  },
  {
    id: 3,
    name: "Prodi D4 Keamanan Siber",
    code: "CYBER",
    image: "exhibitions/siber.png",
  },
  {
    id: 4,
    name: "Prodi D4 Animasi",
    code: "ANIMASI",
    image: "exhibitions/animasi.jpg",
  },
  {
    id: 5,
    name: "Prodi D4 Rekayasa Perangkat Lunak",
    code: "RPL",
    image: "exhibitions/rpl.jpg",
  },
  {
    id: 6,
    name: "Prodi D3 Teknik Elektronika",
    code: "ELKA",
    image: "exhibitions/game.jpg",
  },
  {
    id: 7,
    name: "Prodi D4 Mekatronika",
    code: "MK",
    image: "exhibitions/geomatika.jpg",
  },
  {
    id: 8,
    name: "Prodi D3 Akuntansi",
    code: "AK",
    image: "exhibitions/robotika.jpg",
  },
];

export default function ExhibitionPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Logika Filter Pencarian
  const filteredProdi = prodiData.filter((prodi) =>
    prodi.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex min-h-screen flex-col font-sans relative">
      {/* Background Image Layer (Full Screen) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg" // Menggunakan background.jpg sesuai permintaan
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        {/* Overlay hitam opsional agar konten lebih mudah dibaca di atas gambar */}
        {/* <div className="absolute inset-0 bg-black bg-opacity-30"></div> */}
      </div>

      {/* Navbar Global (z-20 agar di atas background) */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Konten Utama (z-10 agar di atas background) */}
      <div className="relative z-10 flex-grow px-4 py-8 md:px-8 flex justify-center">

        {/* Container Putih Besar */}
        <div className="bg-white/95 backdrop-blur-sm w-full max-w-6xl rounded-lg shadow-xl p-6 md:p-10 h-fit">

          {/* Header & Search Bar */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daftar Program Studi</h1>
              <p className="text-gray-500 text-sm mt-1">Pilih prodi untuk melihat karya mahasiswa</p>
            </div>

            {/* Input Pencarian */}
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Cari nama prodi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Prodi (2 Kolom) */}
          {filteredProdi.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {filteredProdi.map((prodi) => (
                // Bungkus seluruh card dengan Link
                <Link
                  key={prodi.id}
                  href={`/exhibition/${prodi.code.toLowerCase()}`} // Link dinamis, misal: /exhibition/if
                  className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  {/* Bagian Gambar */}
                  <div className="relative h-48 md:h-64 w-full overflow-hidden bg-gray-200">
                    <Image
                      src={prodi.image}
                      alt={prodi.name}
                      fill
                      unoptimized // Hapus ini jika sudah pakai gambar lokal di folder public
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Overlay tipis saat hover */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </div>

                  {/* Bagian Teks */}
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {prodi.name}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        {prodi.code}
                      </p>
                    </div>

                    {/* Tulisan "Lihat Karya" SUDAH DIHAPUS sesuai permintaan */}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Tampilan jika pencarian tidak ditemukan
            <div className="text-center py-20">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Prodi tidak ditemukan</h3>
              <p className="mt-1 text-sm text-gray-500">
                Coba kata kunci lain.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Footer sederhana */}
      <div className="relative z-10 text-center py-4 text-white/80 text-xs font-medium bg-black/20">
        © 2025 Politeknik Negeri Batam
      </div>
    </main>
  );
}