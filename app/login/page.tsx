'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type FormData = {
  email: string;
  password: string;
};

type LoginSuccessResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
  }
};

type ErrorResponse = {
  message: string;
};

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ErrorResponse).message || 'Gagal login');
      }

      const successData = data as LoginSuccessResponse;

      if (successData.token) localStorage.setItem('token', successData.token);
      if (successData.user) {
        localStorage.setItem('userName', successData.user.name);
        localStorage.setItem('userRole', successData.user.role);
      }

      setSuccess('Login berhasil! Mengarahkan...');

      setTimeout(() => {
        if (successData.user.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/manage');
        }
      }, 1500);

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Terjadi kesalahan yang tidak diketahui');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">

      {/* 1. BACKGROUND IMAGE & OVERLAY */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg" // Pastikan gambar ini ada di folder public
          alt="Background"
          fill
          className="object-cover blur-[2px] scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-black/80"></div>
      </div>

      {/* 2. CARD LOGIN GLASSMORPHISM */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">

        {/* Efek Kaca (Backdrop Blur) */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl"></div>

        <div className="relative z-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 text-blue-300 mb-4 border border-blue-400/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-blue-100 text-sm mt-2 opacity-80">
              Masuk untuk mengelola karya pameran Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Input Email dengan Ikon */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all shadow-inner"
              />
            </div>

            {/* Input Password dengan Ikon */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all shadow-inner"
              />
            </div>

            {/* Tombol Login Gradient */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </button>

            {/* Pesan Error / Sukses */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-100 text-sm text-center animate-pulse">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-100 text-sm text-center">
                ✅ {success}
              </div>
            )}
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
            <p className="text-sm text-gray-300">
              Belum punya akun?{' '}
              <Link href="/register" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Daftar Gratis
              </Link>
            </p>

            <Link
              href="/"
              className="inline-flex items-center text-xs text-gray-400 hover:text-white transition-colors gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}