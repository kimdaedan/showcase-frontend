import Link from 'next/link';
import Image from 'next/image'; // Import Image dari Next.js
import Navbar from '../components/Navbar'; // Pastikan path ini sesuai dengan struktur folder Anda

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col font-sans">
      {/* Navbar Global */}
      {/* Navbar sudah menangani logo di header kiri dan menu di tengah */}
      <Navbar />

      {/* Hero Section dengan Background Image */}
      <div className="relative flex-grow flex items-center justify-center px-4">

        {/* Layer Gambar Background */}
        <div className="absolute inset-0 z-0">
          {/* Pastikan file background.jpg ada di folder public */}
          {/* Jika nama file Anda berbeda, sesuaikan bagian src */}
          <Image
            src="/future.jpg"
            alt="Background Hijau"
            fill // Properti fill membuat gambar memenuhi container parent
            priority // Memuat gambar lebih cepat karena ini LCP (Largest Contentful Paint)
            className="object-cover" // Agar gambar tidak gepeng (crop otomatis)
            quality={100}
          />
          {/* Opsional: Overlay hitam transparan agar teks lebih kontras jika background terlalu terang */}
          {/* <div className="absolute inset-0 bg-black bg-opacity-10"></div> */}
        </div>

        {/* Kotak Putih Tengah */}
        {/* z-10 agar berada di atas gambar background */}
        <div className="relative z-10 bg-white/95 backdrop-blur-sm max-w-4xl w-full p-12 md:p-16 text-center shadow-2xl rounded-sm">

          {/* Judul Utama */}
          <h1 className="text-5xl md:text-6xl text-gray-900 font-normal leading-tight mb-6 tracking-tight">
            Presentasikan,<br />
            Manage dan <br />
            <span className="font-bold">Pamerkan Karya Kalian</span>
          </h1>

          {/* Subjudul */}
          <p className="text-gray-500 text-lg mb-12 font-light tracking-wide">
            Tempat di mana Anda bisa mengupload dan <br />
            memamerkan karya.
          </p>

          {/* Tombol View Examples */}
          <div className="flex justify-center">
            <Link
              href="/exhibition" // Pastikan rute ini ada atau ganti ke /dashboard sementara
              className="group inline-flex items-center space-x-3 text-gray-900 font-bold tracking-[0.15em] uppercase hover:text-blue-600 transition-colors pb-1 border-b-2 border-transparent hover:border-blue-600"
            >
              {/* Ikon Mata dalam lingkaran hitam */}
              <div className="bg-black text-white rounded-full p-1.5 group-hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span>VIEW EXAMPLES</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      {/* Menggunakan bg-[#1e2329] agar warnanya gelap seperti di mockup */}
      <footer className="bg-[#1e2329] text-white py-4 px-8 border-t border-gray-800 relative z-20">
        {/* Grid 3 kolom untuk footer agar konsisten dengan header */}
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">

          {/* Kiri: Logo Footer */}
          <div className="flex justify-start">
             <Image
                src="/logo.png" // Pastikan logo.png ada di folder public
                alt="Logo Footer"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto object-contain opacity-80 grayscale hover:grayscale-0 transition-all"
              />
          </div>

          {/* Tengah: Copyright (Benar-benar di tengah) */}
          <div className="text-gray-400 text-[10px] md:text-xs text-center tracking-wide uppercase">
            © 2025 Politeknik Negeri Batam
          </div>

          {/* Kanan: Contact Admin */}
          <div className="flex justify-end">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">
              Contact Admin
            </a>
          </div>

        </div>
      </footer>
    </main>
  );
}