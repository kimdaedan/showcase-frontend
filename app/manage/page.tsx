'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Project = {
  id: number;
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  karya_type: 'IMAGE' | 'PDF' | 'YOUTUBE';
  karya_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
};

export default function ManagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // State untuk Dropdown Menu per Item
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) { router.push('/login'); return; }
    if (role === 'admin') { router.push('/dashboard'); return; }

    fetchMyProjects(token);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenActionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [router]);

  const fetchMyProjects = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setProjects(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleDelete = async (project: Project) => {
    if (project.status === 'APPROVED') {
        alert("Karya yang sudah disetujui tidak dapat dihapus.");
        return;
    }
    if (!confirm('Yakin ingin menghapus karya ini selamanya?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        setOpenActionId(null);
      } else { alert('Gagal menghapus'); }
    } catch (error) { alert('Terjadi kesalahan koneksi'); }
  };

  const toggleActionMenu = (id: number) => {
    if (openActionId === id) setOpenActionId(null);
    else setOpenActionId(id);
  };

  // Badge Status dengan Ikon
  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-600 border-gray-200';
    let icon = '⏳';
    let label = 'Menunggu Verifikasi';

    if (status === 'APPROVED') {
        color = 'bg-green-50 text-green-700 border-green-200';
        icon = '✅';
        label = 'Disetujui';
    }
    if (status === 'REJECTED') {
        color = 'bg-red-50 text-red-700 border-red-200';
        icon = '❌';
        label = 'Ditolak';
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
        <span className="mr-1.5">{icon}</span> {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Karya Saya</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola dan pantau status karya yang Anda upload.</p>
          </div>
          <button
            onClick={() => router.push('/upload')}
            className="group flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Karya Baru
          </button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>)}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State Modern */
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada karya</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Mulai bagikan inovasi Anda sekarang. Karya yang diupload akan direview oleh admin sebelum tampil.</p>
            <button onClick={() => router.push('/upload')} className="text-blue-600 font-bold hover:underline">Mulai Upload Sekarang &rarr;</button>
          </div>
        ) : (
          /* Card Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const isEditLocked = project.status === 'APPROVED' || project.status === 'REJECTED';
              const isDeleteLocked = project.status === 'APPROVED';

              return (
                <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">

                  {/* Thumbnail Image */}
                  <div className="relative h-48 w-full bg-gray-100 border-b border-gray-100">
                     {project.karya_type === 'IMAGE' ? (
                        <Image src={`http://localhost:5000/${project.karya_url}`} alt="Thumb" fill className="object-cover" unoptimized/>
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 font-medium">
                           {project.karya_type === 'YOUTUBE' ? '▶️ Video YouTube' : '📄 Dokumen PDF'}
                        </div>
                     )}
                     <div className="absolute top-3 left-3">
                        <StatusBadge status={project.status || 'PENDING'} />
                     </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{project.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">{new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                       <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {project.nama_ketua.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                          <span className="font-bold text-xs text-gray-900">{project.nama_ketua}</span>
                          <span className="text-[10px] text-gray-500">NIM: {project.nim_ketua}</span>
                       </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100 relative">
                       <button onClick={() => setSelectedProject(project)} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          Lihat Detail
                       </button>

                       {/* Dropdown Menu Trigger */}
                       <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActionMenu(project.id); }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                             </svg>
                          </button>

                          {openActionId === project.id && (
                            <div ref={dropdownRef} className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in duration-200">
                               <button
                                 onClick={() => router.push(`/manage/edit/${project.id}`)}
                                 disabled={isEditLocked}
                                 className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isEditLocked ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
                               >
                                  ✏️ Edit Data
                               </button>
                               <div className="border-t border-gray-100"></div>
                               <button
                                 onClick={() => handleDelete(project)}
                                 disabled={isDeleteLocked}
                                 className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isDeleteLocked ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                               >
                                  🗑️ Hapus
                               </button>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detail (Modern Style) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative ring-1 ring-white/20">

             {/* Header Sticky */}
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                 <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedProject.title}</h3>
                 <p className="text-xs text-gray-500 mt-0.5">{selectedProject.karya_type} • Diupload pada {new Date(selectedProject.created_at).toLocaleDateString('id-ID')}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500">
                 &times;
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 md:p-8 space-y-6">
                {/* Status Alert */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    selectedProject.status === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-800' :
                    selectedProject.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-800' :
                    'bg-blue-50 border-blue-100 text-blue-800'
                }`}>
                   <div className="text-xl mt-0.5">
                      {selectedProject.status === 'APPROVED' ? '🎉' : selectedProject.status === 'REJECTED' ? '⚠️' : 'ℹ️'}
                   </div>
                   <div>
                      <h4 className="font-bold text-sm uppercase mb-1">Status: {selectedProject.status}</h4>
                      <p className="text-xs opacity-80">
                         {selectedProject.status === 'APPROVED' ? 'Selamat! Karya Anda telah tayang di pameran.' :
                          selectedProject.status === 'REJECTED' ? 'Maaf, karya Anda belum memenuhi kriteria. Silakan hapus atau upload ulang.' :
                          'Karya sedang ditinjau oleh admin. Harap menunggu.'}
                      </p>
                   </div>
                </div>

                {/* Deskripsi */}
                <div>
                   <h4 className="font-bold text-gray-900 mb-2">Deskripsi Karya</h4>
                   <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{selectedProject.description}</p>
                </div>

                {/* Preview Media */}
                 <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg flex justify-center items-center min-h-[400px]">
                  {selectedProject.karya_type === 'IMAGE' && (
                    <div className="relative w-full h-[500px]">
                      <Image src={`http://localhost:5000/${selectedProject.karya_url}`} alt="Preview" fill className="object-contain" unoptimized />
                    </div>
                  )}
                  {selectedProject.karya_type === 'YOUTUBE' && (
                     <iframe width="100%" height="500" src={selectedProject.karya_url.replace('watch?v=', 'embed/').split('&')[0]} title="YT" frameBorder="0" allowFullScreen></iframe>
                  )}
                  {selectedProject.karya_type === 'PDF' && (
                    <iframe src={`http://localhost:5000/${selectedProject.karya_url}`} className="w-full h-[500px]" title="PDF"></iframe>
                  )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right sticky bottom-0">
              <button onClick={() => setSelectedProject(null)} className="bg-white text-gray-700 px-6 py-2.5 rounded-lg font-bold border border-gray-300 hover:bg-gray-50 transition-all text-sm shadow-sm">
                 Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}