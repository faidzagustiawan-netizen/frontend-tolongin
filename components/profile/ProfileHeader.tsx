import React from 'react';
import Image from 'next/image';
import { User, ShieldCheck } from 'lucide-react';

interface ProfileHeaderProps {
  user: any;
  isTalent: boolean;
  talentProfile: any;
  companyProfile: any;
}

export const ProfileHeader = ({ user, isTalent, talentProfile, companyProfile }: ProfileHeaderProps) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex items-center gap-6 relative z-10">
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xl">
          {isTalent && talentProfile?.avatarUrl ? (
            <Image src={talentProfile.avatarUrl} alt={talentProfile.fullName} fill sizes="112px" className="object-cover" />
          ) : !isTalent && companyProfile?.logoUrl ? (
            <Image src={companyProfile.logoUrl} alt={companyProfile.companyName} fill sizes="112px" className="object-cover" />
          ) : (
            <User className="relative z-10 h-12 w-12 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              {isTalent ? talentProfile?.fullName || user.email : companyProfile?.companyName || user.email}
            </h1>
            {((isTalent && talentProfile?.faceVerificationStatus === 'VERIFIED') || (!isTalent && companyProfile?.kybStatus === 'VERIFIED')) && (
              <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold shadow-md">
                <ShieldCheck className="h-4 w-4" /> Terverifikasi
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{isTalent ? talentProfile?.headline || 'Talenta Tolongin.co' : companyProfile?.industry || 'Perusahaan Mitra'}</p>
          <p className="text-xs text-muted-foreground">{user.email} • {user.role}</p>
        </div>
      </div>

      {isTalent && talentProfile && (
        <div className="flex items-center gap-6 bg-background border border-border rounded-2xl p-6 shadow-xl relative z-10">
          <div className="text-center px-4 border-r border-border">
            <h4 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{talentProfile.level}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Level Talenta</p>
          </div>
          <div className="text-center px-4">
            <h4 className="font-display text-3xl font-extrabold text-foreground">{talentProfile.xp}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total XP</p>
          </div>
        </div>
      )}

      {!isTalent && companyProfile && (
        <div className="flex items-center gap-6 bg-background border border-border rounded-2xl p-6 shadow-xl relative z-10">
          <div className="text-center px-4 border-r border-border">
            <h4 className={`font-display text-3xl font-extrabold ${companyProfile.trustScore >= 80 ? 'text-emerald-400' : companyProfile.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {companyProfile.trustScore ?? 100}
            </h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Trust Score</p>
          </div>
        </div>
      )}
    </div>
  );
};
