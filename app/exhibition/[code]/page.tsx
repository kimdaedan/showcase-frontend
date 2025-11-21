"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Scene3D from "../../../components/Scene3D";
import { Suspense } from "react";

export default function ProdiDetailPage() {
  // Mengambil parameter 'code' dari URL (misal: 'if', 'trm', 'cyber')
  const params = useParams();
  const code = typeof params.code === "string" ? params.code.toLowerCase() : "";

  // Cek apakah ini prodi informatika
  const isInformatika = code === "if";

  // Data dummy untuk detail prodi (Bisa disesuaikan dengan API nanti)
  const prodiNameMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika",
    trm: "D4 Teknologi Rekayasa Multimedia",
    cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi",
    rpl: "D4 Rekayasa Perangkat Lunak",
    elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika",
    ak: "D3 Akuntansi",
  };

  const title = prodiNameMap[code] || "Detail Program Studi";

  return (
    <main className="flex min-h-screen flex-col font-sans bg-[#424b24]">
      <Navbar />

      <div className="flex-grow px-4 py-8 flex justify-center">
        <div className="w-full max-w-7xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* Header Halaman */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                KODE: {code}
              </p>
            </div>
            <Link
              href="/exhibition"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
            >
              &larr; Kembali ke Daftar
            </Link>
          </div>

          {/* Konten Utama */}
          <div className="flex-grow p-6">
            {isInformatika ? (
              // === TAMPILAN KHUSUS INFORMATIKA (3D) ===
              <div className="flex flex-col h-[70vh]">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Pameran Virtual 3D
                  </h2>
                  <p className="text-gray-600">
                    Selamat datang di booth virtual Teknik Informatika. Gunakan
                    WASD untuk berjalan dan Mouse untuk melihat sekeliling.
                  </p>
                </div>

                {/* Area 3D Viewer */}
                <div className="flex-grow w-full rounded-xl border-4 border-gray-200 bg-gray-100 relative">
                  <Suspense
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center">
                        Loading 3D Engine...
                      </div>
                    }
                  >
                    {/* Pastikan file ada di public/models/informatika.glb */}
                    <Scene3D modelUrl="/models/booth_a.glb" />
                  </Suspense>
                </div>
              </div>
            ) : (
              // === TAMPILAN PRODI LAIN (Placeholder) ===
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Pameran {title}
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Saat ini konten 3D untuk prodi ini belum tersedia atau
                    sedang dalam pengembangan. Silakan cek kembali nanti atau
                    lihat prodi Teknik Informatika untuk demo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
