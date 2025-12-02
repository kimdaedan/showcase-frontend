'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Scene3D from '../../../components/Scene3D';
import { Suspense, useEffect, useState } from 'react';

// Tipe data proyek sesuai respons API
type Project = {
  id: number;
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  karya_type: 'IMAGE' | 'PDF' | 'YOUTUBE';
  karya_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  major?: string;
  prodi?: string;
};

export default function ProdiDetailPage() {
  const params = useParams();
  const code = typeof params.code === 'string' ? params.code.toLowerCase() : '';

  const isInformatika = code === 'if';

  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  const prodiNameMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika",
    trm: "D4 Teknologi Rekayasa Multimedia",
    cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi",
    rpl: "D4 Rekayasa Perangkat Lunak",
    elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika",
    ak: "D3 Akuntansi"
  };

  const title = prodiNameMap[code] || "Detail Program Studi";
  const targetProdi = prodiNameMap[code];

  useEffect(() => {
    if (!targetProdi) return;

    const fetchApprovedProject = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/projects');
        const data = await res.json();

        const approved = data.find((p: Project) =>
          p.status === 'APPROVED' &&
          p.karya_type === 'IMAGE' &&
          p.prodi === targetProdi
        );

        if (approved) {
          const imageUrl = `http://localhost:5000/${approved.karya_url}`;
          setProjectImage(imageUrl);
          setDisplayProject(approved);
        } else {
          setProjectImage(null);
          setDisplayProject(null);
        }
      } catch (err) {
        console.error("Gagal mengambil karya:", err);
      }
    };

    fetchApprovedProject();
  }, [code, targetProdi]);

  return (
    <main className="flex min-h-screen flex-col font-sans relative">

      {/* 1. BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background Future"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        {/* Overlay Gelap agar konten terbaca jelas */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* 2. KONTEN UTAMA (Relative & Z-index tinggi) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-grow px-4 py-8 flex justify-center">
          <div className="w-full max-w-7xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden flex flex-col border border-white/20">

            {/* Header Halaman */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">KODE: {code}</p>
              </div>
              <Link
                href="/exhibition"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center font-bold"
              >
                &larr; Kembali ke Daftar
              </Link>
            </div>

            <div className="flex-grow p-6">
              {isInformatika ? (
                // === TAMPILAN KHUSUS INFORMATIKA (3D) ===
                <div className="flex flex-col h-[75vh]">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Pameran Virtual 3D</h2>
                    <p className="text-gray-600 text-sm">
                      Gunakan <b>WASD</b> untuk berjalan dan <b>Mouse</b> untuk melihat sekeliling.
                    </p>

                    {/* BAGIAN INFO "SEDANG DITAMPILKAN" TELAH DIHAPUS DARI SINI */}
                  </div>

                  {/* Area 3D Viewer */}
                  <div className="flex-grow w-full rounded-xl border-4 border-gray-300 bg-gray-900 relative shadow-inner overflow-hidden">
                    <Suspense fallback={
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-black/80">
                        <div className="animate-pulse font-mono">Loading 3D Environment...</div>
                      </div>
                    }>
                      <Scene3D
                        modelUrl="/models/informatika.glb"
                        projectImageUrl={projectImage}
                      />
                    </Suspense>
                  </div>
                </div>
              ) : (
                // === TAMPILAN PRODI LAIN ===
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Booth Virtual {title}</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
                      Model 3D untuk prodi ini sedang dalam tahap pengembangan.
                      Silakan kunjungi booth <b>Teknik Informatika</b> untuk melihat demonstrasi pameran virtual.
                    </p>
                    <Link
                      href="/exhibition/if"
                      className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-bold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                      Lihat Demo Informatika &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}