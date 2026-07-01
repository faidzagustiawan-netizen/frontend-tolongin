import React from 'react';
import { Award } from 'lucide-react';

interface TalentBadgesTabProps {
  earnedBadges: any[];
}

export const TalentBadgesTab = ({ earnedBadges }: TalentBadgesTabProps) => {
  if (!earnedBadges || earnedBadges.length === 0) return null;

  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
      <h3 className="font-display text-xl font-bold text-white border-b border-dark-border pb-4">
        Lencana Kompetensi (Gamifikasi)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {earnedBadges.map((tb: any) => (
          <div key={tb.badge.id} className="bg-dark-bg border border-dark-border rounded-2xl p-5 text-center space-y-3 shadow-md">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{tb.badge.title}</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{tb.badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
