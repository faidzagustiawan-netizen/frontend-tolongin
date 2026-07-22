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

  const name = isTalent ? talentProfile?.fullName || user.email : companyProfile?.companyName || user.email;
  const headline = isTalent ? talentProfile?.headline : companyProfile?.industry || 'Perusahaan Mitra';
  const location = isTalent ? talentProfile?.location || 'Lokasi belum diatur' : companyProfile?.location || 'Lokasi belum diatur';

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col gap-6">

      {/* Top Section: Avatars & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 w-full">
        {/* Avatars */}
        <div className="flex items-center gap-4">
          {/* Public Photo */}
          <div 
            className="relative h-32 w-32 rounded-full bg-foreground/5 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer shadow-lg border-4 border-card group"
            onClick={onEditPhotoClick}
          >
            {isTalent && talentProfile?.avatarUrl ? (
              <img src={talentProfile.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : !isTalent && companyProfile?.logoUrl ? (
              <img src={companyProfile.logoUrl} alt={name} className="w-full h-full object-cover" />
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
          
          {/* Privat Photo */}
          {isTalent && talentProfile?.encryptedPrivateFace && (
            <div className="relative h-20 w-20 rounded-full flex flex-col items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-black mt-8">
              <img src={talentProfile.encryptedPrivateFace} alt="Foto Privat" className="w-full h-full object-cover opacity-80" />
              <div className="absolute bottom-0 inset-x-0 bg-emerald-900/90 text-emerald-300 text-[8px] font-bold uppercase flex items-center justify-center py-0.5 z-20">
                Privat
              </div>
            </div>
          )}
        </div>

        {/* Gamification Stats */}
        {isTalent && talentProfile && (
           <div className="flex items-center gap-6 bg-card border border-border rounded-2xl p-4 shadow-sm w-max self-center">
             <div className="text-center px-4 border-r border-border">
               <h4 className="font-display text-3xl font-extrabold text-emerald-500">{talentProfile.level || 1}</h4>
               <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Level Talenta</p>
             </div>
             <div className="text-center px-4">
               <h4 className="font-display text-3xl font-extrabold text-foreground">{talentProfile.xp || 0}</h4>
               <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total XP</p>
             </div>
           </div>
        )}

        {!isTalent && companyProfile && (
           <div className="flex items-center gap-6 bg-card border border-border rounded-2xl p-4 shadow-sm w-max self-center">
             <div className="text-center px-4">
               <h4 className={`font-display text-3xl font-extrabold ${companyProfile.trustScore >= 80 ? 'text-emerald-500' : companyProfile.trustScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                 {companyProfile.trustScore ?? 100}
               </h4>
               <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Trust Score</p>
             </div>
           </div>
        )}
      </div>

      {/* Info Section: Name, Bio, Education */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10 mt-2">
         {/* Left Side */}
         <div className="flex-1 space-y-2 w-full">
           <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {name}
             </h1>
             {isTalent && (
               <span className="text-emerald-500 border border-emerald-500 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0">
                 Talent
               </span>
             )}
             {((isTalent && talentProfile?.faceVerificationStatus === 'VERIFIED') || (!isTalent && companyProfile?.kybStatus === 'VERIFIED')) && (
               <span className="flex items-center gap-1 bg-emerald-50 text-emerald-500 px-2 py-1 rounded-full text-xs font-semibold shrink-0">
                 <ShieldCheck className="h-4 w-4" />
               </span>
             )}
           </div>
           
           <p className="text-base text-foreground/90 max-w-3xl leading-relaxed">
             {headline}
           </p>
           
           <p className="text-muted-foreground text-sm mt-1">
             {location}
           </p>
         </div>

         {/* Right Side: Education/Company */}
         <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 min-w-[200px]">
            {isTalent && (
              <>
                 {latestExperience && (
                   <div className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-emerald-500 cursor-pointer transition-colors w-full justify-start lg:justify-end">
                     <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0 text-foreground font-bold">
                       {latestExperience.companyName?.substring(0,2).toUpperCase()}
                     </div>
                     <span className="truncate max-w-[200px]">{latestExperience.companyName}</span>
                   </div>
                 )}
                 {latestEducation && (
                   <div className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-emerald-500 cursor-pointer transition-colors w-full justify-start lg:justify-end">
                     <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0 text-foreground font-bold">
                       {latestEducation.school?.substring(0,2).toUpperCase()}
                     </div>
                     <span className="truncate max-w-[200px]">{latestEducation.school}</span>
                   </div>
                 )}
              </>
            )}
         </div>
      </div>

      {/* Buttons Row */}
      <div className="flex justify-between items-center relative z-10 w-full mt-2">
        <div>
          {onAddSectionClick && (
            <Button variant="outline" onClick={onAddSectionClick} className="rounded-full px-6 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 shrink-0 font-medium">
              Tambahkan bagian
            </Button>
          )}
        </div>
        
        {onEditIntroClick && (
          <button 
            onClick={onEditIntroClick}
            className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </div>

    </div>
  );
};
