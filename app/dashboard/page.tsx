'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';

// Tipe Data Proyek
type Project = {
  id: number;
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  karya_type: 'IMAGE' | 'PDF' | 'YOUTUBE';
  karya_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  author_name: string;
  created_at: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); // Untuk Modal Detail
  const router = useRouter();

  // Ambil data saat halaman dimuat
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Update Status (Setuju/Tolak)
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Update state lokal agar UI berubah tanpa refresh
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
        alert(`Status berhasil diubah menjadi ${newStatus}`);
      } else {
        alert('Gagal mengubah status');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  // Fungsi Hapus
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karya ini?')) return;

    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Gagal menghapus');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  // Komponen Badge Status
  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'APPROVED') colorClass = 'bg-green-100 text-green-800';
    if (status === 'REJECTED') colorClass = 'bg-red-100 text-red-800';

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Verifikasi Karya</h1>

        {isLoading ? (
          <p>Loading data...</p>
        ) : (
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul Karya</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahasiswa (Ketua)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{project.nama_ketua}</div>
                      <div className="text-sm text-gray-500">{project.nim_ketua}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {project.karya_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={project.status || 'PENDING'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      {/* Tombol Detail */}
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                      >
                        Detail
                      </button>

                      {/* Tombol Setuju */}
                      <button
                        onClick={() => handleStatusUpdate(project.id, 'APPROVED')}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                      >
                        Setuju
                      </button>

                      {/* Tombol Tolak */}
                      <button
                        onClick={() => handleStatusUpdate(project.id, 'REJECTED')}
                        className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 px-3 py-1 rounded"
                      >
                        Tolak
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === MODAL DETAIL === */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            {/* Header Modal */}
            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Ketua:</span> {selectedProject.nama_ketua} ({selectedProject.nim_ketua})</div>
                <div><span className="font-bold">Status:</span> <StatusBadge status={selectedProject.status || 'PENDING'} /></div>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-2">Deskripsi:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedProject.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-2">Preview Karya:</h4>
                <div className="w-full border rounded-lg overflow-hidden bg-black flex justify-center items-center min-h-[300px]">
                  {selectedProject.karya_type === 'IMAGE' && (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`http://localhost:5000/${selectedProject.karya_url}`}
                      alt="Preview"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )}

                  {selectedProject.karya_type === 'PDF' && (
                    <iframe
                      src={`http://localhost:5000/${selectedProject.karya_url}`}
                      className="w-full h-[500px]"
                    ></iframe>
                  )}

                  {selectedProject.karya_type === 'YOUTUBE' && (
                    <iframe
                      width="100%"
                      height="400"
                      src={selectedProject.karya_url.replace('watch?v=', 'embed/')}
                      title="YouTube video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
                {selectedProject.karya_type !== 'YOUTUBE' && (
                  <a
                    href={`http://localhost:5000/${selectedProject.karya_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:underline text-sm"
                  >
                    Buka file asli di tab baru
                  </a>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t text-right">
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}