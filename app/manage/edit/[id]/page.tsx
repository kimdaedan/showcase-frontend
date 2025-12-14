'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../../components/Navbar';

type FormData = {
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  // Tambahan untuk preview
  current_type?: string;
  current_url?: string;
};

export default function EditProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', nama_ketua: '', nim_ketua: '',
  });
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const fetchProject = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/projects/${id}`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();

        if (data.status !== 'PENDING') {
          alert('Karya ini sudah diverifikasi dan tidak bisa diedit.');
          router.push('/manage');
          return;
        }

        setFormData({
          title: data.title,
          description: data.description,
          nama_ketua: data.nama_ketua,
          nim_ketua: data.nim_ketua,
          current_type: data.karya_type,
          current_url: data.karya_url
        });

        if (data.karya_type === 'YOUTUBE') {
          setUploadType('youtube');
          setYoutubeLink(data.karya_url);
        } else {
          setUploadType('file');
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data proyek');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('nama_ketua', formData.nama_ketua);
    data.append('nim_ketua', formData.nim_ketua);

    if (uploadType === 'file' && selectedFile) {
      data.append('karyaFile', selectedFile);
    } else if (uploadType === 'youtube' && youtubeLink) {
      data.append('youtube_link', youtubeLink);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal update');
      }

      alert('Berhasil update data!');
      router.push('/manage');

    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans relative text-gray-800">

      {/* 1. BACKGROUND FUTURISTIK */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background"
          fill
          className="object-cover blur-[4px] scale-105"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-blue-900/40"></div>
      </div>

      <div className="relative z-20">
        <Navbar />
      </div>

      <div className="relative z-10 flex justify-center py-12 px-4 md:px-8">

        {/* 2. CARD GLASSMORPHISM LEBAR */}
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20">

          {/* KOLOM KIRI: PREVIEW MEDIA */}
          <div className="md:w-1/3 bg-gray-100/50 p-8 border-r border-gray-200 flex flex-col items-center justify-center text-center">
             <h3 className="text-lg font-bold text-gray-700 mb-4">Media Saat Ini</h3>

             <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-white mb-4 bg-gray-200 group">
                {formData.current_type === 'IMAGE' ? (
                   <Image
                     src={`http://localhost:5000/${formData.current_url}`}
                     alt="Preview"
                     fill
                     className="object-cover group-hover:scale-110 transition-transform duration-500"
                     unoptimized
                   />
                ) : formData.current_type === 'YOUTUBE' ? (
                   <div className="flex items-center justify-center h-full bg-black">
                      <iframe
                        src={formData.current_url?.replace('watch?v=', 'embed/').split('&')[0]}
                        className="w-full h-full pointer-events-none" // Disable interaction in preview
                        title="YT Preview"
                      ></iframe>
                   </div>
                ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">PDF File</div>
                )}
             </div>

             <p className="text-xs text-gray-500">
               Media ini akan diganti jika Anda mengupload file baru atau mengubah link YouTube.
             </p>
          </div>

          {/* KOLOM KANAN: FORM EDIT */}
          <div className="md:w-2/3 p-8 md:p-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Edit Karya</h2>
            <p className="text-gray-500 text-sm mb-8">Perbarui informasi karya Anda agar lebih menarik.</p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Judul */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 group-focus-within:text-blue-600 transition-colors">Judul Karya</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 border-b-2 border-gray-200 px-3 py-3 text-gray-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all rounded-t-md"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 group-focus-within:text-blue-600 transition-colors">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-50 border-b-2 border-gray-200 px-3 py-3 text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all rounded-t-md resize-none"
                />
              </div>

              {/* Identitas (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 group-focus-within:text-blue-600 transition-colors">Nama Ketua</label>
                  <input
                    type="text"
                    value={formData.nama_ketua}
                    onChange={(e) => setFormData({...formData, nama_ketua: e.target.value})}
                    className="w-full bg-gray-50 border-b-2 border-gray-200 px-3 py-3 text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all rounded-t-md"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 group-focus-within:text-blue-600 transition-colors">NIM Ketua</label>
                  <input
                    type="text"
                    value={formData.nim_ketua}
                    onChange={(e) => setFormData({...formData, nim_ketua: e.target.value})}
                    className="w-full bg-gray-50 border-b-2 border-gray-200 px-3 py-3 text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all rounded-t-md"
                  />
                </div>
              </div>

              {/* Upload Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-4">Ganti Media (Opsional)</p>

                <div className="flex gap-4 mb-4">
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${uploadType === 'file' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="type" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="hidden" />
                    <span className="text-sm font-bold">📁 File Upload</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${uploadType === 'youtube' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="type" checked={uploadType === 'youtube'} onChange={() => setUploadType('youtube')} className="hidden" />
                    <span className="text-sm font-bold">▶️ YouTube Link</span>
                  </label>
                </div>

                {uploadType === 'file' ? (
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                     <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                     <p className="text-sm text-gray-500">
                        {selectedFile ? <span className="text-blue-600 font-bold">{selectedFile.name}</span> : "Klik atau seret file baru ke sini"}
                     </p>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 text-sm"
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 animate-pulse">
                  <p className="text-red-600 text-center text-sm font-bold">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-1/3 bg-white text-gray-700 py-3 rounded-xl font-bold border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all transform disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}