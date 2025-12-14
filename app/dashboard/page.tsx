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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // State Filter & Dropdown
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

  // --- KOMPONEN KECIL ---

  const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-gray-100 text-gray-600 border-gray-200";
    let label = "Pending";
    if (status === 'APPROVED') { styles = "bg-green-50 text-green-700 border-green-200"; label = "Approved"; }
    if (status === 'REJECTED') { styles = "bg-red-50 text-red-700 border-red-200"; label = "Rejected"; }

    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase border ${styles}`}>
        {label}
      </span>
    );
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

  // Filter Data
  const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

  // Hitung Statistik
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

        {/* Header Dashboard */}
        <div className="flex justify-between items-end mb-8">
          <div>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Verifikasi</h1>
             <p className="text-gray-500 mt-1">Kelola persetujuan karya mahasiswa.</p>
          </div>
          {userRole !== 'admin' && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">View Mode: User</span>
          )}
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <StatCard title="Total" count={stats.total} color="bg-blue-500" />
           <StatCard title="Pending" count={stats.pending} color="bg-yellow-500" />
           <StatCard title="Approved" count={stats.approved} color="bg-green-500" />
           <StatCard title="Rejected" count={stats.rejected} color="bg-red-500" />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
             <button
               key={status}
               onClick={() => setFilterStatus(status as any)}
               className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
                 filterStatus === status
                   ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
               }`}
             >
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
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Mahasiswa</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProjects.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                       Tidak ada data ditemukan untuk filter ini.
                    </td>
                 </tr>
              ) : (
                filteredProjects.map((project) => {
                  const isFinalStatus = project.status === 'APPROVED' || project.status === 'REJECTED';
                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                              project.karya_type === 'IMAGE' ? 'bg-indigo-500' :
                              project.karya_type === 'YOUTUBE' ? 'bg-red-500' : 'bg-orange-500'
                           }`}>
                              {project.karya_type === 'IMAGE' ? 'IMG' : project.karya_type === 'YOUTUBE' ? 'YT' : 'PDF'}
                           </div>
                           <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">{project.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{project.description}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                               {project.nama_ketua.charAt(0)}
                            </div>
                            <div>
                               <div className="text-sm font-medium text-gray-900">{project.nama_ketua}</div>
                               <div className="text-xs text-gray-400">{project.nim_ketua}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={project.status || 'PENDING'} />
                      </td>

                      {/* Dropdown Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleActionMenu(project.id); }}
                          className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {openActionId === project.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden text-left animate-in fade-in zoom-in duration-100"
                            style={{ minWidth: '160px', right: '30px', top: '-10px' }}
                          >
                            <button
                              onClick={() => { setSelectedProject(project); setOpenActionId(null); }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            >
                              👁️ Lihat Detail
                            </button>

                            {userRole === 'admin' && (
                              <>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => handleStatusUpdate(project.id, 'APPROVED')}
                                  disabled={isFinalStatus}
                                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isFinalStatus ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                  ✅ Setujui
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(project.id, 'REJECTED')}
                                  disabled={isFinalStatus}
                                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isFinalStatus ? 'text-gray-300 cursor-not-allowed' : 'text-yellow-600 hover:bg-yellow-50'}`}
                                >
                                  ❌ Tolak
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  🗑️ Takedown
                                </button>
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

      {/* Modal Detail (Modern) */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative ring-1 ring-white/20">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProject.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedProject.karya_type} • Diupload oleh {selectedProject.nama_ketua}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors">&times;</button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Deskripsi Lengkap</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{selectedProject.description}</p>
              </div>

              <div className="w-full bg-gray-900 rounded-xl overflow-hidden flex justify-center items-center min-h-[400px] shadow-lg">
                {selectedProject.karya_type === 'IMAGE' && (
                  <div className="relative w-full h-[500px]">
                    <Image src={`http://localhost:5000/${selectedProject.karya_url}`} alt="Preview" fill className="object-contain" unoptimized />
                  </div>
                )}
                {selectedProject.karya_type === 'YOUTUBE' && (
                  <iframe width="100%" height="500" src={selectedProject.karya_url.replace('watch?v=', 'embed/').split('&')[0]} title="YT" frameBorder="0" allowFullScreen></iframe>
                )}
                {selectedProject.karya_type === 'PDF' && (
                  <iframe src={`http://localhost:5000/${selectedProject.karya_url}`} className="w-full h-[600px]" title="PDF"></iframe>
                )}
              </div>
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