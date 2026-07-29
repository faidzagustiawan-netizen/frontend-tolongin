'use client';

import React, { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { Button } from '../common/Button';
import { Textarea } from '../common/Input';
import { MessageSquare, CornerDownRight, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Discussion {
  id: string;
  userId: string;
  message: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id?: string;
    role: string;
    companyProfile?: { companyName?: string; logoUrl?: string; slug?: string } | null;
    talentProfile?: { fullName?: string; avatarUrl?: string; slug?: string } | null;
  };
}

export interface DiscussionThreadProps {
  challengeId: string;
  discussions: Discussion[];
  onNewComment: (message: string, parentId?: string) => Promise<void>;
}

export const DiscussionThread: React.FC<DiscussionThreadProps> = ({ challengeId, discussions, onNewComment }) => {
  const { isAuthenticated, user } = useUserStore();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rootDiscussions = discussions.filter((d) => !d.parentId);
  const repliesByParent = discussions.reduce((acc, d) => {
    if (d.parentId) {
      if (!acc[d.parentId]) acc[d.parentId] = [];
      acc[d.parentId].push(d);
    }
    return acc;
  }, {} as Record<string, Discussion[]>);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const msg = parentId ? replyMessage : newComment;
    if (!msg.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onNewComment(msg, parentId);
      if (parentId) {
        setReplyMessage('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (disc: Discussion, isReply = false) => {
    const replies = repliesByParent[disc.id] || [];
    const isCompany = disc.user.role === 'COMPANY';
    // Nama diambil dari profil. Ruang diskusi bisa dibaca tanpa masuk, jadi
    // alamat surel tidak lagi ikut dikirim backend.
    const authorName =
      disc.user.companyProfile?.companyName
      || disc.user.talentProfile?.fullName
      || 'Pengguna Tolongin';

    return (
      <div key={disc.id} className={`space-y-4 ${isReply ? 'ml-8 sm:ml-12 border-l-2 border-border pl-4 sm:pl-6' : ''}`}>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                isCompany ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              }`}>
                {authorName[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-semibold text-gray-200">{authorName}</h5>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isCompany ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-foreground/5 border-foreground/10 text-muted-foreground'
                  }`}>
                    {disc.user.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(disc.createdAt)}</p>
              </div>
            </div>

            {!isReply && isAuthenticated && (
              <button
                onClick={() => setReplyingTo(replyingTo === disc.id ? null : disc.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                <span>Balas</span>
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{disc.message}</p>

          <AnimatePresence>
            {replyingTo === disc.id && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={(e) => handleSubmit(e, disc.id)}
                className="mt-4 pt-4 border-t border-border space-y-3"
              >
                <Textarea
                  placeholder="Tulis balasan Anda..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setReplyingTo(null)}>
                    Batal
                  </Button>
                  <Button size="sm" type="submit" isLoading={isSubmitting} disabled={!replyMessage.trim()}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Kirim Balasan
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {replies.map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <MessageSquare className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-bold text-foreground">Forum Diskusi & Q&A ({discussions.length})</h3>
      </div>

      {isAuthenticated ? (
        <form onSubmit={(e) => handleSubmit(e)} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Tanya Seputar Studi Kasus</h4>
          <Textarea
            placeholder="Tulis pertanyaan atau ulasan Anda di sini..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Kirim Pertanyaan
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Anda harus masuk untuk berdiskusi di studi kasus ini.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
            Masuk Sekarang
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {rootDiscussions.length > 0 ? (
          rootDiscussions.map((disc) => renderComment(disc))
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <p className="text-sm text-muted-foreground mb-1">Belum ada diskusi untuk studi kasus ini.</p>
            <p className="text-xs text-gray-600">Jadilah yang pertama memulai diskusi!</p>
          </div>
        )}
      </div>
    </div>
  );
};
