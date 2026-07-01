import React from 'react';
import { Card } from '../common/Card';
import { FadeIn } from '../animations/FadeIn';

const stats = [
  {
    value: '50.000+',
    label: 'Talenta Terverifikasi Biometrik',
    color: 'emerald',
    valueClass: 'text-white'
  },
  {
    value: '500+',
    label: 'Perusahaan & Startup Mitra',
    color: 'cyan',
    valueClass: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400'
  },
  {
    value: '99.4%',
    label: 'Akurasi AI Evaluator',
    color: 'teal',
    valueClass: 'text-white'
  },
  {
    value: 'Rp 35M+',
    label: 'Total Penawaran Kerja Terjalin',
    color: 'amber',
    valueClass: 'text-amber-400'
  }
];

export const StatsSection = () => {
  return (
    <FadeIn delay={0.4} y={30}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-24 px-4 sm:px-6 lg:px-8">
        {stats.map((stat, i) => (
          <Card 
            key={i}
            variant="glass" 
            interactive={true}
            hoverEffect={stat.color as any}
            className="p-6 text-center group"
          >
            <div className={`absolute inset-0 bg-gradient-to-b from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <h3 className={`font-display text-3xl sm:text-4xl font-extrabold mb-1 relative z-10 ${stat.valueClass}`}>
              {stat.value}
            </h3>
            <p className="text-xs font-semibold text-gray-400 relative z-10">{stat.label}</p>
          </Card>
        ))}
      </div>
    </FadeIn>
  );
};
