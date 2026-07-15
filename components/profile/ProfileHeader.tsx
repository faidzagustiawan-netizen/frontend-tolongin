import React from 'react';
import { User, ShieldCheck, Pencil } from 'lucide-react';
import { Button } from '../common/Button';

interface ProfileHeaderProps {
  user: any;
  isTalent: boolean;
  talentProfile: any;
  companyProfile: any;
  onEditIntroClick?: () => void;
  onAddSectionClick?: () => void;
  onEditPhotoClick?: () => void;
}

export const ProfileHeader = ({ 
  user, isTalent, talentProfile, companyProfile, 
  onEditIntroClick, onAddSectionClick, onEditPhotoClick 
}: ProfileHeaderProps) => {
  const latestEducation = talentProfile?.educations?.[0];
  const latestExperience = talentProfile?.experiences?.[0];

  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col gap-6">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Edit Pencil Icon for Owner Intro */}
      {onEditIntroClick && (
        <button 
          onClick={onEditIntroClick}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-5 w-5" />
        </button>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
        {/* Left Side: Photo, Name, Bio */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
          <div className="flex items-center gap-4">
            {/* Foto Publik */}
            <div 
              className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-foreground/5 border-4 border-card flex flex-col items-center justify-center overflow-hidden flex-shrink-0 shadow-xl group cursor-pointer"
              onClick={onEditPhotoClick}
            >
              {isTalent && talentProfile?.avatarUrl ? (
                <img src={talentProfile.avatarUrl} alt={talentProfile.fullName || 'User'} className="w-full h-full object-cover" />
              ) : !isTalent && companyProfile?.logoUrl ? (
                <img src={companyProfile.logoUrl} alt={companyProfile.companyName || 'Company'} className="w-full h-full object-cover" />
              ) : (
                <User className="relative z-10 h-12 w-12 text-muted-foreground" />
              )}
              
              {/* Hover Edit Overlay */}
              {onEditPhotoClick && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                  <Pencil className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            
            {/* Foto Privat */}
            {isTalent && talentProfile?.encryptedPrivateFace && (
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-black border-2 border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <img src={talentProfile.encryptedPrivateFace} alt="Foto Privat" className="w-full h-full object-cover opacity-80" />
                <div className="absolute bottom-0 inset-x-0 bg-emerald-900/90 text-emerald-300 text-[8px] font-bold uppercase flex items-center justify-center py-0.5 z-20">
                  Privat
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 sm:mt-0 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
                {isTalent ? talentProfile?.fullName || user.email : companyProfile?.companyName || user.email}
              </h1>
              {isTalent && (
                <span className="text-emerald-500 border border-emerald-500 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0">
                  Talent
                </span>
              )}
              {((isTalent && talentProfile?.faceVerificationStatus === 'VERIFIED') || (!isTalent && companyProfile?.kybStatus === 'VERIFIED')) && (
                <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                </span>
              )}
            </div>
            {isTalent && talentProfile?.bio && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-2 line-clamp-3">
                {talentProfile.bio}
              </p>
            )}
            {!isTalent && (
              <p className="text-base text-foreground/90 font-medium">
                {companyProfile?.industry || 'Perusahaan Mitra'}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {isTalent ? talentProfile?.location || 'Lokasi belum diatur' : companyProfile?.location || 'Lokasi belum diatur'}
            </p>
            <p className="text-sm text-emerald-500 font-medium cursor-pointer hover:underline">
              {talentProfile?.connections || '500+ koneksi'}
            </p>
          </div>
        </div>

        {/* Right Side: Education and Company */}
        {isTalent && (
          <div className="flex flex-col gap-3 md:items-end justify-center md:w-64 mt-4 md:mt-0">
            {latestExperience && (
              <div className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-emerald-500 cursor-pointer transition-colors">
                <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">{latestExperience.companyName?.substring(0,2).toUpperCase()}</span>
                </div>
                <span className="truncate max-w-[150px]">{latestExperience.companyName}</span>
              </div>
            )}
            {latestEducation && (
              <div className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-emerald-500 cursor-pointer transition-colors">
                <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">{latestEducation.school?.substring(0,2).toUpperCase()}</span>
                </div>
                <span className="truncate max-w-[150px]">{latestEducation.school}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: Stats on left, Add Section button on right */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 relative z-10">
        <div className="flex gap-4">
          {isTalent && talentProfile && (
            <div className="flex items-center gap-6 bg-background/50 border border-border rounded-2xl p-4 shadow-sm w-max">
              <div className="text-center px-4 border-r border-border">
                <h4 className="font-display text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{talentProfile.level || 1}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Level Talenta</p>
              </div>
              <div className="text-center px-4">
                <h4 className="font-display text-2xl font-extrabold text-foreground">{talentProfile.xp || 0}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total XP</p>
              </div>
            </div>
          )}

          {!isTalent && companyProfile && (
            <div className="flex items-center gap-6 bg-background/50 border border-border rounded-2xl p-4 shadow-sm w-max">
              <div className="text-center px-4 border-r border-border">
                <h4 className={`font-display text-2xl font-extrabold ${companyProfile.trustScore >= 80 ? 'text-emerald-400' : companyProfile.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {companyProfile.trustScore ?? 100}
                </h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Trust Score</p>
              </div>
            </div>
          )}
        </div>

        {onAddSectionClick && (
          <Button variant="secondary" onClick={onAddSectionClick} className="rounded-full px-6 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 shrink-0">
            Tambahkan bagian
          </Button>
        )}
      </div>
    </div>
  );
};
