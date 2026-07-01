import React, { useState } from 'react';
import { SolverProps } from '../types';
import { Video, Mic, StopCircle, Play } from 'lucide-react';

export default function VideoRecordingSolver({ comp, value, onChange }: SolverProps) {
  const [isRecording, setIsRecording] = useState(false);

  const maxDuration = comp.metadata?.maxDurationMinutes;

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      onChange('mock-video-url.mp4'); // Mock recorded value
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="border border-border rounded-xl p-4 bg-bg flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-400">
            <Video className="w-6 h-6" />
            <div>
              <p className="text-sm font-bold">Rekaman selesai</p>
              <p className="text-xs text-muted">video_recording.mp4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg">
              <Play className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onChange(null)}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-500/10 rounded-lg"
            >
              Rekam Ulang
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl p-8 bg-bg flex flex-col items-center justify-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'
          }`}>
            {isRecording ? <Mic className="w-8 h-8" /> : <Video className="w-8 h-8" />}
          </div>
          <h4 className="text-white font-bold mb-1">
            {isRecording ? 'Sedang Merekam...' : 'Siap Merekam'}
          </h4>
          <p className="text-xs text-muted mb-6 max-w-xs">
            {maxDuration ? `Durasi maksimal adalah ${maxDuration} menit.` : 'Pastikan pencahayaan dan suara Anda jelas sebelum memulai.'}
          </p>
          
          <button 
            onClick={toggleRecording}
            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-black'
            }`}
          >
            {isRecording ? (
              <><StopCircle className="w-4 h-4" /> Hentikan Rekaman</>
            ) : (
              <><Video className="w-4 h-4" /> Mulai Merekam</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
