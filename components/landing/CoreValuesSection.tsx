import React from 'react';
import Image from 'next/image';

export const CoreValuesSection = () => {
  return (
    <div className="w-full bg-[#061C30] py-4">
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white-keep tracking-tight leading-tight">
            Asesmen Adil, Objektif, dan Tanpa Bias.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white-keep transition-colors duration-300 group-hover:text-emerald-400">Biometrik Wajah & KTP</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Fitur verifikasi identitas berlapis membandingkan keaslian wajah kandidat saat mengerjakan studi kasus dengan kartu identitas legal, menjamin integritas penuh.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden mt-6">
                <Image
                  src="/biometrik.svg"
                  alt="Biometrik"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="group bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white-keep transition-colors duration-300 group-hover:text-emerald-400">Mesin Koreksi Otomatis AI</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Penilaian canggih menganalisis pohon sintaksis kode (AST), kompleksitas Big-O, celah keamanan OWASP, dan indeks plagiasi dalam hitungan detik.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden mt-6">
                <Image
                  src="/koreksi.svg"
                  alt="Koreksi Otomatis"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="group bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white-keep transition-colors duration-300 group-hover:text-emerald-400">Gamifikasi Papan Peringkat</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Setiap penyelesaian studi kasus dikonversi menjadi lencana portofolio terverifikasi dan akumulasi XP untuk menduduki puncak podium talenta global.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden mt-6">
                <Image
                  src="/gamifikasi.svg"
                  alt="Gamifikasi"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
