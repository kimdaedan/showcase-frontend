'use client';

import { useEffect, useState } from 'react';
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
  author_name?: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    fetchProjects(token);
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
            // Opsional: Hilangkan alert agar UX lebih cepat
            // alert(`Status diubah ke ${newStatus}`);
        } else {
            alert("Gagal update status.");
        }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
      const token = localStorage.getItem('token');
      if(!confirm('Yakin ingin melakukan Takedown karya ini? Data akan dihapus permanen.')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) setProjects(prev => prev.filter(p => p.id !== id));
          else alert("Gagal melakukan takedown");
      } catch(e) { console.error(e); }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'APPROVED') colorClass = 'bg-green-100 text-green-800';
    if (status === 'REJECTED') colorClass = 'bg-red-100 text-red-800';
    return <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${colorClass}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Verifikasi Karya</h1>
          {userRole !== 'admin' && (
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Mode Lihat (User)</span>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Karya</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Pengupload</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{project.title}</div>
                      <div className="text-xs text-gray-500">{project.karya_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {project.nama_ketua} <br/> <span className="text-xs text-gray-400">({project.nim_ketua})</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={project.status || 'PENDING'} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">

                      {/* TOMBOL DETAIL */}
                      <button onClick={() => setSelectedProject(project)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 font-bold border border-blue-200">Detail</button>

                      {/* LOGIKA TOMBOL ADMIN */}
                      {userRole === 'admin' && (
                        <>
                          {/* TOMBOL SETUJU */}
                          <button
                            onClick={() => handleStatusUpdate(project.id, 'APPROVED')}
                            disabled={project.status === 'REJECTED'} // Disable jika sudah ditolak
                            className={`px-3 py-1 rounded font-bold border transition-colors ${
                              project.status === 'APPROVED'
                                ? 'bg-green-600 text-white border-green-700 cursor-default' // Aktif & Terpilih
                                : project.status === 'REJECTED'
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' // Mati karena status lain
                                  : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' // Normal (Pending)
                            }`}
                          >
                            {project.status === 'APPROVED' ? 'Disetujui' : 'Setuju'}
                          </button>

                          {/* TOMBOL TOLAK */}
                          <button
                            onClick={() => handleStatusUpdate(project.id, 'REJECTED')}
                            disabled={project.status === 'APPROVED'} // Disable jika sudah disetujui
                            className={`px-3 py-1 rounded font-bold border transition-colors ${
                              project.status === 'REJECTED'
                                ? 'bg-yellow-500 text-white border-yellow-600 cursor-default' // Aktif & Terpilih
                                : project.status === 'APPROVED'
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' // Mati karena status lain
                                  : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200' // Normal (Pending)
                            }`}
                          >
                            {project.status === 'REJECTED' ? 'Ditolak' : 'Tolak'}
                          </button>

                          {/* TOMBOL TAKEDOWN (HAPUS) */}
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 font-bold border border-red-200"
                          >
                            Takedown
                          </button>
                        </>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="w-full border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-900 flex justify-center items-center min-h-[400px]">
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
              <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedProject.description}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t text-right sticky bottom-0">
              <button onClick={() => setSelectedProject(null)} className="bg-gray-600 text-white px-6 py-2 rounded font-bold">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}