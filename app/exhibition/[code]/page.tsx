'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Scene3D from '../../../components/Scene3D';
import { Suspense, useEffect, useState, useCallback } from 'react';

// Tipe Data
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

  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  // --- STATE UNTUK INTERAKSI ---
  const [hoverInfo, setHoverInfo] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dummy Comments
  const mockComments = [
    { user: "Dosen A", text: "Karya yang sangat inovatif!", rating: 5 },
    { user: "Mahasiswa B", text: "Desain UI/UX nya rapi sekali.", rating: 4 },
  ];

  const prodiNameMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika", trm: "D4 Teknologi Rekayasa Multimedia", cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi", rpl: "D4 Rekayasa Perangkat Lunak", elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika", ak: "D3 Akuntansi"
  };
  const title = prodiNameMap[code] || "Detail Program Studi";
  const targetProdi = prodiNameMap[code];

  useEffect(() => {
    if (!targetProdi) return;
    const fetchApprovedProject = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/projects');
        const data = await res.json();

        // 1. FILTER
        const approvedList = data.filter((p: Project) =>
          p.status === 'APPROVED' &&
          p.karya_type === 'IMAGE' &&
          p.prodi === targetProdi
        );

        if (approvedList.length > 0) {
          // 2. AMBIL URL (Max 2)
          const urls = approvedList.slice(0, 2).map((p: Project) =>
            `http://localhost:5000/${p.karya_url}`
          );
          setProjectImages(urls);
          setDisplayProject(approvedList[0]);
        } else {
          setProjectImages([]);
          setDisplayProject(null);
        }
      } catch (err) { console.error(err); }
    };
    fetchApprovedProject();
  }, [code, targetProdi]);

  // --- HANDLERS (OPTIMIZED) ---

  // [OPTIMASI] Gunakan useCallback & State Guard untuk mencegah loop re-render
  const handleHoverScreen = useCallback((isHovering: boolean, x: number, y: number) => {
    setHoverInfo((prev) => {
      // Jika tidak ada perubahan, kembalikan state lama (React skip render)
      if (prev.show === isHovering && prev.x === x && prev.y === y) return prev;

      // Jika hovering true tapi tidak ada project, jangan tampilkan
      if (isHovering && !displayProject) return prev;

      if (isHovering) {
        return { show: true, x, y };
      } else {
        // Jika sebelumnya sudah false, jangan update lagi
        return prev.show ? { show: false, x: 0, y: 0 } : prev;
      }
    });
  }, [displayProject]); // Dependencies hanya displayProject

  const handleClickScreen = useCallback(() => {
    if (displayProject) {
      setShowPreviewPopup(true);
    }
  }, [displayProject]);


  return (
    <main className="flex min-h-screen flex-col font-sans relative">
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" quality={100} priority />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-grow px-4 py-8 flex justify-center">
          <div className="w-full max-w-7xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden flex flex-col border border-white/20 relative">

            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">KODE: {code}</p>
              </div>
              <Link href="/exhibition" className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center font-bold">
                &larr; Kembali ke Daftar
              </Link>
            </div>

            <div className="flex-grow p-6 relative">
              {isInformatika ? (
                <div className="flex flex-col h-[75vh]">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Pameran Virtual 3D</h2>
                    <p className="text-gray-600 text-sm">Gunakan <b>WASD</b> untuk berjalan dan <b>Mouse</b> untuk melihat sekeliling.</p>
                  </div>

                  <div className="flex-grow w-full rounded-xl border-4 border-gray-300 bg-gray-900 relative shadow-inner overflow-hidden">
                    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white bg-black/80">Loading...</div>}>
                      <Scene3D
                        modelUrl="/models/booth_a.glb"
                        images={projectImages}
                        onHoverScreen={handleHoverScreen}
                        onClickScreen={handleClickScreen}
                      />
                    </Suspense>

                    {/* TOOLTIP */}
                    {hoverInfo.show && (
                      <div
                        className="fixed pointer-events-none z-50 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20 transform -translate-x-1/2 -translate-y-full mt-[-10px]"
                        style={{ left: hoverInfo.x, top: hoverInfo.y }}
                      >
                        {displayProject?.title}
                      </div>
                    )}

                    {/* POPUP PREVIEW */}
                    {showPreviewPopup && displayProject && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center transform transition-all scale-100">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{displayProject.title}</h3>
                          <p className="text-gray-500 text-sm mb-6 line-clamp-2">{displayProject.description}</p>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => { setShowPreviewPopup(false); setShowDetailModal(true); }}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                            >
                              Lihat Detail Lengkap
                            </button>
                            <button
                              onClick={() => setShowPreviewPopup(false)}
                              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                   <p className="text-gray-500">Konten belum tersedia.</p>
                </div>
              )}
            </div>

            {/* MODAL DETAIL */}
            {showDetailModal && displayProject && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{displayProject.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">Oleh: {displayProject.nama_ketua} ({displayProject.nim_ketua})</p>
                    </div>
                    <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                  </div>

                  {/* Body */}
                  <div className="flex-grow overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Kiri */}
                      <div>
                        <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-6">
                          <Image src={`http://localhost:5000/${displayProject.karya_url}`} alt="Karya" fill className="object-cover" unoptimized />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Deskripsi Karya</h4>
                        <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{displayProject.description}</p>
                      </div>

                      {/* Kanan */}
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-gray-900 text-lg">Ulasan & Rating</h4>
                          <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                            <span className="text-yellow-600 text-lg mr-1">★</span>
                            <span className="font-bold text-yellow-800">4.8</span>
                            <span className="text-yellow-600 text-xs ml-1">/ 5.0</span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {mockComments.map((comment, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-800 text-sm">{comment.user}</span>
                                <div className="text-yellow-500 text-xs">{'★'.repeat(comment.rating)}</div>
                              </div>
                              <p className="text-gray-600 text-xs">{comment.text}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Tulis komentar Anda..."></textarea>
                          <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                            Kirim Ulasan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}