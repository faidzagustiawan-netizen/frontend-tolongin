import React, { useState, useEffect } from 'react';
import { SolverProps } from '../types';
import Editor from '@monaco-editor/react';

export default function LiveCodingSolver({ comp, value, onChange }: SolverProps) {
  const defaultLanguage = comp.metadata?.language || 'javascript';
  const initialCode = comp.metadata?.initialCode || '';
  
  const [code, setCode] = useState(value || initialCode);

  useEffect(() => {
    if (!value && initialCode) {
      onChange(initialCode);
    }
  }, []);

  const handleEditorChange = (val: string | undefined) => {
    setCode(val || '');
    onChange(val || '');
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden h-[400px]">
      <Editor
        height="100%"
        language={defaultLanguage}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
