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
  prodi: string;
  karya_type: 'IMAGE' | 'PDF' | 'YOUTUBE';
  karya_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) { router.push('/login'); return; }
    setUserRole(role);
    fetchProjects(token);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenActionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  const fetchProjects = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
        setOpenActionId(null);
      } else { alert("Gagal update status."); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!confirm('Yakin ingin melakukan Takedown karya ini? Data akan dihapus permanen.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          setProjects(prev => prev.filter(p => p.id !== id));
          setOpenActionId(null);
      } else alert("Gagal melakukan takedown");
    } catch (e) { console.error(e); }
  };

  const toggleActionMenu = (id: number) => {
    if (openActionId === id) setOpenActionId(null);
    else setOpenActionId(id);
  };

  // [PERBAIKAN] Helper Thumbnail YouTube yang Lebih Kuat (Regex)
  const getYouTubeThumb = (url: string) => {
    let videoId = "";
    // Regex untuk menangkap ID dari link biasa, short link, atau embed
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);

    if (match && match[1]) {
      videoId = match[1];
      // Gunakan mqdefault (Medium Quality) karena hqdefault kadang tidak tersedia di beberapa video
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    // Gambar Fallback jika link rusak
    return "https://via.placeholder.com/150/000000/FFFFFF/?text=No+Thumbnail";
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-gray-100 text-gray-600 border-gray-200";
    let label = "Pending";
    if (status === 'APPROVED') { styles = "bg-green-50 text-green-700 border-green-200"; label = "Approved"; }
    if (status === 'REJECTED') { styles = "bg-red-50 text-red-700 border-red-200"; label = "Rejected"; }
    return <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase border ${styles}`}>{label}</span>;
  };

  const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{count}</h3>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
        {title.charAt(0)}
      </div>
    </div>
  );

  const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'PENDING').length,
    approved: projects.filter(p => p.status === 'APPROVED').length,
    rejected: projects.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        <div className="flex justify-between items-end mb-8">
          <div>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Verifikasi</h1>
             <p className="text-gray-500 mt-1">Kelola persetujuan karya mahasiswa.</p>
          </div>
          {userRole !== 'admin' && <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">View Mode: User</span>}
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <StatCard title="Total" count={stats.total} color="bg-blue-500" />
           <StatCard title="Pending" count={stats.pending} color="bg-yellow-500" />
           <StatCard title="Approved" count={stats.approved} color="bg-green-500" />
           <StatCard title="Rejected" count={stats.rejected} color="bg-red-500" />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
             <button key={status} onClick={() => setFilterStatus(status as any)} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${filterStatus === status ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
               {status === 'ALL' ? 'Semua Karya' : status}
             </button>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Info Karya</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Mahasiswa & Prodi</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProjects.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-12 text-gray-400">Tidak ada data ditemukan.</td></tr>
              ) : (
                filteredProjects.map((project) => {
                  const isFinalStatus = project.status === 'APPROVED' || project.status === 'REJECTED';
                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-gray-200 border border-gray-200 relative">
                              {/* THUMBNAIL (IMAGE ATAU YOUTUBE) */}
                              {project.karya_type === 'IMAGE' ? (
                                <Image src={`http://localhost:5000/${project.karya_url}`} alt="Thumb" fill className="object-cover" unoptimized />
                              ) : project.karya_type === 'YOUTUBE' ? (
                                <Image
                                  src={getYouTubeThumb(project.karya_url)}
                                  alt="YT Thumb"
                                  fill
                                  className="object-cover"
                                  unoptimized // Penting agar bisa load dari domain luar (youtube)
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-[10px] font-bold text-gray-500 bg-orange-100">PDF</div>
                              )}
                           </div>
                           <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900 line-clamp-1">{project.title}</div>
                              <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">{project.karya_type}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <div className="text-sm font-bold text-gray-900">{project.nama_ketua}</div>
                            <div className="text-xs text-gray-500 mb-1">NIM: {project.nim_ketua}</div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded w-fit">{project.prodi || 'Unassigned'}</div>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={project.status || 'PENDING'} />
                        <div className="text-[10px] text-gray-400 mt-1">{new Date(project.created_at).toLocaleDateString()}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                        <button onClick={(e) => { e.stopPropagation(); toggleActionMenu(project.id); }} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                        {openActionId === project.id && (
                          <div ref={dropdownRef} className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden text-left animate-in fade-in zoom-in duration-100" style={{ right: '30px', top: '-10px' }}>
                            <button onClick={() => { setSelectedProject(project); setOpenActionId(null); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">👁️ Detail</button>
                            {userRole === 'admin' && (
                              <>
                                <div className="border-t border-gray-100"></div>
                                <button onClick={() => handleStatusUpdate(project.id, 'APPROVED')} disabled={isFinalStatus} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isFinalStatus ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}>✅ Setujui</button>
                                <button onClick={() => handleStatusUpdate(project.id, 'REJECTED')} disabled={isFinalStatus} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isFinalStatus ? 'text-gray-300 cursor-not-allowed' : 'text-yellow-600 hover:bg-yellow-50'}`}>❌ Tolak</button>
                                <div className="border-t border-gray-100"></div>
                                <button onClick={() => handleDelete(project.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">🗑️ Takedown</button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative ring-1 ring-white/20">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProject.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedProject.prodi} • {selectedProject.nama_ketua}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors">&times;</button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Deskripsi Lengkap</h4>
                  <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-line">{selectedProject.description}</p>
              </div>

              {/* MEDIA VIEWER */}
              <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4 aspect-video relative">
                {selectedProject.karya_type === 'IMAGE' && (
                  <Image src={`http://localhost:5000/${selectedProject.karya_url}`} alt="Preview" fill className="object-contain" unoptimized />
                )}
                {selectedProject.karya_type === 'YOUTUBE' && (
                  <iframe width="100%" height="100%" src={selectedProject.karya_url.replace('watch?v=', 'embed/').split('&')[0]} title="YT" frameBorder="0" allowFullScreen className="absolute inset-0"></iframe>
                )}
                {selectedProject.karya_type === 'PDF' && (
                  <iframe src={`http://localhost:5000/${selectedProject.karya_url}`} className="w-full h-full" title="PDF"></iframe>
                )}
              </div>

              {/* [BARU] TOMBOL YOUTUBE */}
              {selectedProject.karya_type === 'YOUTUBE' && (
                 <a
                   href={selectedProject.karya_url}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    Tonton Langsung di YouTube
                 </a>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right sticky bottom-0">
              <button onClick={() => setSelectedProject(null)} className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-50 shadow-sm transition-all text-sm">Tutup Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}