'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  major?: string; // Kolom jurusan dari tabel users
};

export default function ProdiDetailPage() {
  const params = useParams();
  const code = typeof params.code === 'string' ? params.code.toLowerCase() : '';

  // Menentukan apakah ini prodi Informatika (karena kita baru punya model 3D informatika.glb)
  const isInformatika = code === 'if';

  // State untuk menyimpan URL gambar proyek yang akan ditampilkan di 3D
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  // Mapping Kode URL ke Nama Prodi (Harus sama persis dengan input user saat Register)
  // Tips: Di sistem nyata, sebaiknya gunakan ID Prodi agar lebih akurat daripada mencocokkan string nama.
  const prodiNameMap: { [key: string]: string } = {
    if: "Teknik Informatika", // Disederhanakan untuk pencarian string
    trm: "Multimedia",
    cyber: "Keamanan Siber",
    animasi: "Animasi",
    rpl: "Rekayasa Perangkat Lunak",
    elka: "Elektronika",
    mk: "Mekatronika",
    ak: "Akuntansi"
  };

  // Nama lengkap untuk judul halaman
  const prodiTitleMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika",
    trm: "D4 Teknologi Rekayasa Multimedia",
    cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi",
    rpl: "D4 Rekayasa Perangkat Lunak",
    elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika",
    ak: "D3 Akuntansi"
  };

  const title = prodiTitleMap[code] || "Detail Program Studi";
  const searchKeyword = prodiNameMap[code] || "";

  useEffect(() => {
    const fetchApprovedProject = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/projects');
        const data = await res.json();

        // LOGIKA FILTERING:
        // 1. Status harus APPROVED
        // 2. Tipe harus IMAGE (karena 3D frame butuh tekstur gambar)
        // 3. Jurusan (major) harus mengandung kata kunci prodi yang sedang dibuka
        const approved = data.find((p: Project) =>
          p.status === 'APPROVED' &&
          p.karya_type === 'IMAGE' &&
          (p.major && p.major.toLowerCase().includes(searchKeyword.toLowerCase()))
        );

        if (approved) {
          // Format URL gambar agar lengkap dengan host backend
          const imageUrl = `http://localhost:5000/${approved.karya_url}`;
          setProjectImage(imageUrl);
          setDisplayProject(approved);
          console.log("✅ Menampilkan karya di 3D:", approved.title);
        } else {
          console.log("⚠️ Tidak ada karya APPROVED bertipe IMAGE untuk prodi ini.");
          setProjectImage(null);
        }
      } catch (err) {
        console.error("Gagal mengambil karya:", err);
      }
    };

    fetchApprovedProject();
  }, [code, searchKeyword]);

  return (
    <main className="flex min-h-screen flex-col font-sans bg-[#424b24]">
      <Navbar />

      <div className="flex-grow px-4 py-8 flex justify-center">
        <div className="w-full max-w-7xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">

          {/* Header Halaman */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wider">KODE: {code}</p>
            </div>
            <Link
              href="/exhibition"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center font-semibold"
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

                  {/* Info Karya yang sedang tampil */}
                  {displayProject && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md inline-block">
                      <p className="text-sm text-blue-800">
                        <span className="font-bold">Sedang Ditampilkan:</span> {displayProject.title}
                        <span className="mx-2">|</span>
                        Oleh: {displayProject.nama_ketua}
                      </p>
                    </div>
                  )}
                </div>

                {/* Area 3D Viewer */}
                <div className="flex-grow w-full rounded-xl border-4 border-gray-200 bg-gray-900 relative shadow-inner overflow-hidden">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="animate-pulse">Loading Environment...</div>
                    </div>
                  }>
                    <Scene3D
                      modelUrl="/models/booth_a.glb"
                      projectImageUrl={projectImage} // Mengirim gambar ke Scene3D
                    />
                  </Suspense>
                </div>
              </div>
            ) : (
              // === TAMPILAN PRODI LAIN (Placeholder) ===
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Booth Virtual {title}</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Model 3D untuk prodi ini sedang dalam pengembangan.
                    Silakan kunjungi booth <b>Teknik Informatika</b> untuk melihat demo pameran virtual.
                  </p>
                  <Link href="/exhibition/if" className="mt-4 inline-block text-blue-600 hover:underline font-medium">
                    Lihat Demo Informatika &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}