import React from 'react';
import { Pencil } from 'lucide-react';

interface PublicProfileCardProps {
  profileUrl?: string;
  onEditClick?: () => void;
}

export const PublicProfileCard = ({ profileUrl, onEditClick }: PublicProfileCardProps) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-6">
      <div className="flex justify-between items-start">
        <div className="overflow-hidden">
          <h3 className="font-semibold text-foreground text-lg">Profil publik dan URL</h3>
          {profileUrl && (
            <p className="text-sm text-muted-foreground truncate hover:text-emerald-500 cursor-pointer">{profileUrl}</p>
          )}
        </div>
        {onEditClick && (
          <button 
            onClick={onEditClick}
            className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors flex-shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
