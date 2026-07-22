import React from 'react';
import { Pencil } from 'lucide-react';

interface PublicProfileCardProps {
  linkedinUrl?: string;
  githubUrl?: string;
  figmaUrl?: string;
  onEditClick?: () => void;
}

export const PublicProfileCard = ({ linkedinUrl, githubUrl, figmaUrl, onEditClick }: PublicProfileCardProps) => {
  const hasAnyLink = linkedinUrl || githubUrl || figmaUrl;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-6">
      <div className="flex justify-between items-start">
        <div className="overflow-hidden space-y-3 w-full mr-4">
          <h3 className="font-semibold text-foreground text-lg">Profil publik dan URL</h3>
          
          {!hasAnyLink && (
            <p className="text-sm text-muted-foreground italic">Belum ada tautan profil yang ditambahkan.</p>
          )}

          {linkedinUrl && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">LinkedIn</p>
              <a href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 truncate hover:underline block">
                {linkedinUrl}
              </a>
            </div>
          )}
          
          {githubUrl && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">GitHub</p>
              <a href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 truncate hover:underline block">
                {githubUrl}
              </a>
            </div>
          )}

          {figmaUrl && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Figma</p>
              <a href={figmaUrl.startsWith('http') ? figmaUrl : `https://${figmaUrl}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 truncate hover:underline block">
                {figmaUrl}
              </a>
            </div>
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
