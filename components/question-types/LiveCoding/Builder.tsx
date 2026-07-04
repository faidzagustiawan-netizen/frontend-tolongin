import React, { useState } from 'react';
import { BuilderProps } from '../types';
import { Play } from 'lucide-react';
import { pistonService } from '../../../services/piston.service';

export default function LiveCodingBuilder({ comp, onChange }: BuilderProps) {
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('Executing...');
    try {
      const code = comp.metadata?.initialCode || '';
      const language = comp.metadata?.language || 'javascript';
      const output = await pistonService.execute(language, code);
      setExecutionOutput(output);
    } catch (err: any) {
      setExecutionOutput(`[Error]\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="pt-2 space-y-4">
      <div>
        <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">Bahasa Pemrograman Default</label>
        <select 
          value={comp.metadata?.language || 'javascript'} 
          onChange={(e) => onChange('metadata', { ...comp.metadata, language: e.target.value })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="rust">Rust</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="swift">Swift</option>
        </select>
      </div>
      <div>
        <div className="flex justify-between items-end mb-2">
          <label className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">Kode Awal (Template)</label>
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isExecuting}
            className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-3 py-1.5 rounded-lg transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
        </div>
        <textarea 
          value={comp.metadata?.initialCode || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, initialCode: e.target.value })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 font-mono text-xs"
          rows={6}
          placeholder="// Tuliskan kode awal yang akan dilihat pengguna..."
        />
        {executionOutput && (
          <div className="mt-2 bg-[#1e1e1e] border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="bg-black/40 px-3 py-1.5 border-b border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Terminal Output</span>
            </div>
            <div className="p-3 max-h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
              <pre className={executionOutput.startsWith('[Error]') || executionOutput.startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
                {executionOutput}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
