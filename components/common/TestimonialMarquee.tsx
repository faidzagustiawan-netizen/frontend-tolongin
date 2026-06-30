'use client';

import React from 'react';
import Image from 'next/image';

const testimonialsRow1 = [
  {
    quote: "Platform ini sangat membantu kami dalam menemukan talenta IT terbaik dengan verifikasi yang terjamin.",
    name: "Budi Santoso",
    role: "HRD PT. TELKOMSEL",
    image: "https://i.pravatar.cc/150?u=budi",
  },
  {
    quote: "Saya berhasil mendapatkan pekerjaan impian saya berkat studi kasus yang menantang dan relevan di sini.",
    name: "Siti Aminah",
    role: "UI/UX Designer",
    image: "https://i.pravatar.cc/150?u=siti",
  },
  {
    quote: "Sistem penilaian AI-nya luar biasa akurat. Sangat menghemat waktu screening CV dan portofolio kandidat.",
    name: "Andi Wijaya",
    role: "CTO TechIndo",
    image: "https://i.pravatar.cc/150?u=andi",
  },
  {
    quote: "Gamifikasi dan leaderboard membuat proses belajar dan mengerjakan tes menjadi lebih seru dan kompetitif.",
    name: "Rina Marlina",
    role: "Product Manager",
    image: "https://i.pravatar.cc/150?u=rina",
  },
];

const testimonialsRow2 = [
  {
    quote: "Inovasi biometrik wajah memberikan rasa aman bagi perusahaan bahwa kandidat yang mengerjakan tes adalah orang yang tepat.",
    name: "Hendrik Kusuma",
    role: "VP of Engineering Gojek",
    image: "https://i.pravatar.cc/150?u=hendrik",
  },
  {
    quote: "Platform terbaik untuk membangun portofolio. Saya bisa memamerkan skill coding saya langsung ke perusahaan.",
    name: "Dewi Lestari",
    role: "Frontend Developer",
    image: "https://i.pravatar.cc/150?u=dewi",
  },
  {
    quote: "Koreksi otomatis dengan analisis AST dan Big-O sangat membantu dalam melihat seberapa efisien kode yang ditulis kandidat.",
    name: "Fajar Nugroho",
    role: "Senior Software Engineer",
    image: "https://i.pravatar.cc/150?u=fajar",
  },
  {
    quote: "Kami dapat melihat wawasan mendalam tentang potensi setiap talenta. Platform ini merevolusi cara kami merekrut.",
    name: "Alya Rahma",
    role: "Industry Analyst",
    image: "https://i.pravatar.cc/150?u=alya",
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
  <div className="flex-shrink-0 w-[350px] sm:w-[400px] p-6 rounded-2xl bg-card border border-border shadow-xl hover:border-primary/50 transition-colors mx-3 flex flex-col justify-between h-full">
    <p className="text-body text-sm sm:text-base leading-relaxed mb-6">
      "{testimonial.quote}"
    </p>
    <div className="flex items-center gap-4 mt-auto">
      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border">
        <Image
          src={testimonial.image}
          alt={testimonial.name}
          fill
          className="object-cover"
        />
      </div>
      <div>
        <h4 className="font-bold text-title text-sm">{testimonial.name}</h4>
        <p className="text-xs text-muted">{testimonial.role}</p>
      </div>
    </div>
  </div>
);

export const TestimonialMarquee = () => {
  return (
    <section className="w-full max-w-7xl mx-auto py-24 border-t border-border overflow-hidden">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 px-4">
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-title tracking-tight leading-tight">
          Dipercaya oleh Talenta & Instansi Terkemuka
        </h2>
        <p className="text-muted text-base">
          Platform andalan untuk merevolusi proses rekrutmen dan pengembangan karir di seluruh dunia.
        </p>
      </div>

      <div className="relative flex flex-col gap-6 group">
        {/* Row 1 */}
        <div className="flex w-fit animate-marquee-ltr">
          {[...testimonialsRow1, ...testimonialsRow1].map((t, i) => (
            <TestimonialCard key={`row1-${i}`} testimonial={t} />
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex w-fit animate-marquee-ltr" style={{ animationDuration: '45s' }}>
          {[...testimonialsRow2, ...testimonialsRow2].map((t, i) => (
            <TestimonialCard key={`row2-${i}`} testimonial={t} />
          ))}
        </div>
        
        {/* Gradient overlays to hide edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-[var(--color-bg)] to-transparent z-10"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-[var(--color-bg)] to-transparent z-10"></div>
      </div>
    </section>
  );
};
