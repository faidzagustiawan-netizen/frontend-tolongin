import React, { useState, useEffect } from 'react';
import { SolverProps } from '../types';
import Editor from '@monaco-editor/react';
import { Play } from 'lucide-react';
import { pistonService } from '../../../services/piston.service';

export default function LiveCodingSolver({
  comp,
  value,
  onChange,
  readOnly,
}: SolverProps) {
  const defaultLanguage = comp.metadata?.language || 'javascript';
  const initialCode = comp.metadata?.initialCode || '';
  
  const [code, setCode] = useState(value || initialCode);
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('Executing...');
    try {
      const output = await pistonService.execute(defaultLanguage, code);
      setExecutionOutput(output);
    } catch (err: any) {
      setExecutionOutput(`[Error]\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Kode awal disemai sekali sebagai jawaban, supaya kandidat yang tidak
  // menyentuh editor tetap mengumpulkan sesuatu. Tidak berlaku setelah
  // dikumpulkan — menulis apa pun ke jawaban yang sudah final itu salah.
  useEffect(() => {
    if (!readOnly && !value && initialCode) {
      onChange(initialCode);
    }
  }, []);

  const handleEditorChange = (val: string | undefined) => {
    setCode(val || '');
    onChange(val || '');
  };

  return (
    <div className="flex flex-col bg-[#0d0d0d] border border-border rounded-xl overflow-hidden shadow-xl">
      <div className="bg-[#1a1a1a] px-4 py-3 border-b border-border flex justify-between items-center">
         <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 font-mono">
           main.{defaultLanguage === 'typescript' ? 'ts' : defaultLanguage === 'python' ? 'py' : defaultLanguage === 'go' ? 'go' : defaultLanguage === 'java' ? 'java' : defaultLanguage === 'rust' ? 'rs' : 'js'}
         </span>
         <button
           type="button"
           onClick={handleRunCode}
           disabled={isExecuting}
           className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
         >
           <Play className="w-4 h-4 fill-current" />
           {isExecuting ? 'Running...' : 'Run Code'}
         </button>
      </div>
      <Editor
        height="400px"
        language={defaultLanguage}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
      
      <div className="bg-[#1e1e1e] border-t border-border flex flex-col">
        <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terminal Output</span>
        </div>
        <div className="p-4 h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
          {executionOutput ? (
            <pre className={executionOutput.startsWith('[Error]') || executionOutput.startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
              {executionOutput}
            </pre>
          ) : (
            <span className="text-gray-600 italic">Jalankan kode untuk melihat hasil output...</span>
          )}
        </div>
      </div>
    </div>
  );
}
