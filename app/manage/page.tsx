'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Define Project type locally since it's used for state
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
  // State untuk modal detail
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMyProjects(token);
  }, [router]);

  const fetchMyProjects = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus karya ini selamanya?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

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
      alert('Terjadi kesalahan koneksi');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'APPROVED') colorClass = 'bg-green-100 text-green-800';
    if (status === 'REJECTED') colorClass = 'bg-red-100 text-red-800';
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Karya Saya</h1>
          <button
            onClick={() => router.push('/upload')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
          >
            + Upload Baru
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Memuat data...</p>
        ) : projects.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow text-center">
            <p className="text-gray-500">Belum ada karya yang diupload.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karya</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-bold text-gray-900">{project.title}</div>
                          <div className="text-sm text-gray-500">{project.nama_ketua} ({project.nim_ketua})</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={project.status || 'PENDING'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">

                      {/* [TAMBAHAN] Tombol DETAIL */}
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-blue-600 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1 rounded"
                      >
                        Detail
                      </button>

                      {/* Tombol EDIT: Hanya aktif jika PENDING */}
                      {project.status === 'PENDING' ? (
                        <button
                          onClick={() => router.push(`/manage/edit/${project.id}`)}
                          className="text-yellow-600 hover:text-yellow-900 font-semibold bg-yellow-50 px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed px-3 py-1 bg-gray-100 rounded">
                          Locked
                        </span>
                      )}

                      {/* Tombol HAPUS */}
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-900 font-semibold bg-red-50 px-3 py-1 rounded"
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

      {/* === [TAMBAHAN] MODAL DETAIL KARYA === */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">

            {/* Header Modal */}
            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold">&times;</button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div><span className="font-bold block text-gray-700">Ketua Tim:</span> {selectedProject.nama_ketua} ({selectedProject.nim_ketua})</div>
                <div><span className="font-bold block text-gray-700">Status Verifikasi:</span> <StatusBadge status={selectedProject.status || 'PENDING'} /></div>
                <div><span className="font-bold block text-gray-700">Tanggal Upload:</span> {new Date(selectedProject.created_at).toLocaleDateString('id-ID')}</div>
                <div><span className="font-bold block text-gray-700">Tipe Karya:</span> {selectedProject.karya_type}</div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Deskripsi Karya</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line leading-relaxed">{selectedProject.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Preview Karya</h4>
                <div className="w-full border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-900 flex justify-center items-center min-h-[400px] shadow-inner">
                  {selectedProject.karya_type === 'IMAGE' && (
                    <div className="relative w-full h-[500px]">
                     <Image
                        src={`http://localhost:5000/${selectedProject.karya_url}`}
                        alt="Preview Karya"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}

                  {selectedProject.karya_type === 'PDF' && (
                    <iframe
                      src={`http://localhost:5000/${selectedProject.karya_url}#toolbar=0`}
                      className="w-full h-[600px]"
                      title="PDF Preview"
                    ></iframe>
                  )}

                  {selectedProject.karya_type === 'YOUTUBE' && (
                    <iframe
                      width="100%"
                      height="500"
                      src={selectedProject.karya_url.replace('watch?v=', 'embed/').split('&')[0]}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
                 {/* Tombol buka di tab baru jika bukan YouTube */}
                 {selectedProject.karya_type !== 'YOUTUBE' && (
                  <div className="mt-3 text-right">
                    <a
                      href={`http://localhost:5000/${selectedProject.karya_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Buka File Asli
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t text-right sticky bottom-0">
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-gray-600 text-white px-6 py-2 rounded-md font-bold hover:bg-gray-700 transition-colors"
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