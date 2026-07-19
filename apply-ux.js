const fs = require('fs');

function applyUXOptimizations() {
  const filePath = 'd:/Tolongin/frontend/app/(dashboard)/workspace/[enrollmentId]/page.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add WorkspaceTour component at the top of the return statement
  content = content.replace(
    /return \(\n    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">/g,
    `return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <WorkspaceTour run={runTour} onFinish={finishTour} />`
  );

  // 2. Move AutoSave indicator and Add Proctoring Transparency to the Header 
  // and update Timer UX (Green/Yellow/Red & hide toggle)
  const headerSearch = `<div className="flex items-center gap-3">
                <div className={\`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md transition-all \${
                  isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-background border-border text-emerald-400'
                }\`}>
                  {isExpired ? <Lock className="h-4 w-4 flex-shrink-0" /> : <Timer className="h-4 w-4 flex-shrink-0 animate-spin-slow" />}
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold tracking-wider">{timeLeftString}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">{isExpired ? 'Waktu Habis' : (selectedEnrollment?.submissions?.length > 0) ? 'Sisa Waktu (Saat Submit)' : 'Sisa Waktu Server'}</p>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider bg-foreground/5 border border-foreground/10 px-3 py-2 rounded-xl text-muted-foreground">
                  {selectedEnrollment.status}
                </span>
              </div>`;

  const headerReplace = `<div className="flex items-center gap-3 flex-wrap justify-end">
                {/* Auto-Save Indicator */}
                {currentStep === 'QUESTIONS' && !isExpired && (
                  <div className="tour-autosave hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background shadow-sm text-[10px] font-bold tracking-wider uppercase">
                    {isSavingDraft ? (
                      <><Cloud className="w-3 h-3 text-amber-500 animate-pulse" /> <span className="text-amber-500">Menyimpan...</span></>
                    ) : (
                      <><Check className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">Tersimpan</span></>
                    )}
                  </div>
                )}
                
                {/* Proctoring UX */}
                {isProctored && currentStep === 'QUESTIONS' && (
                  <div className="tour-proctoring group relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 cursor-help transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute right-0 top-12 w-64 p-3 bg-card border border-border shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <p className="text-xs font-bold text-foreground mb-1">Pengawasan Aktif (Proctoring)</p>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        <li>• Tab Switching: {tabSwitchCount} / {maxTabSwitches || '∞'} kali</li>
                        <li>• Enforce Fullscreen: {enforceFullscreen ? 'Ya' : 'Tidak'}</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className={\`tour-timer flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md transition-all \${
                  isExpired 
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
                    : (timeLeftString.startsWith('00h') ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-background border-border text-emerald-500')
                }\`}>
                  {isExpired ? <Lock className="h-4 w-4 flex-shrink-0" /> : <Timer className="h-4 w-4 flex-shrink-0" />}
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-xs font-mono font-bold tracking-wider">{hideTimer && !isExpired ? '--:--:--' : timeLeftString}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-semibold">{isExpired ? 'Waktu Habis' : 'Sisa Waktu'}</p>
                    </div>
                    {!isExpired && (
                      <button type="button" onClick={() => setHideTimer(!hideTimer)} className="text-muted-foreground hover:text-foreground">
                        {hideTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider bg-foreground/5 border border-foreground/10 px-3 py-2 rounded-xl text-muted-foreground hidden sm:inline-block">
                  {selectedEnrollment.status}
                </span>
              </div>`;
  content = content.replace(headerSearch, headerReplace);

  // Remove the old auto-save indicator from the Description section
  const oldAutoSaveSearch = `{/* INDIKATOR AUTO-SAVE */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      {isSavingDraft ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Timer className="w-3 h-3 animate-spin-slow" /> Menyimpan draf...
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tersimpan di awan
                        </span>
                      )}
                    </div>`;
  content = content.replace(oldAutoSaveSearch, '');

  // 3. Add Split-pane and Terminal UX to LIVE_CODING
  const liveCodingSearch = `{currentComp.type === 'LIVE_CODING' && (
                                      <div className="rounded-xl overflow-hidden border border-border shadow-2xl flex flex-col min-w-0">
                                        <div className="bg-card px-4 py-3 border-b border-border flex flex-wrap gap-3 justify-between items-center">
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                              Main.{currentComp.metadata?.language || 'js'}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Live Editor</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRunCode(currentComp.id, currentComp.metadata?.language || 'javascript')}
                                            disabled={isExecuting[currentComp.id]}
                                            className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
                                          >
                                            <Play className="w-4 h-4 fill-current" /> 
                                            {isExecuting[currentComp.id] ? 'Running...' : 'Run Code'}
                                          </button>
                                        </div>
                                        <div className="w-full">
                                          <Editor
                                            height="400px"
                                            language={currentComp.metadata?.language || 'javascript'}
                                            theme="vs-dark"
                                            value={componentResponses[currentComp.id]?.textValue || ''}
                                            onChange={(value) => handleComponentChange(currentComp.id, value, 'textValue')}
                                            options={{
                                              minimap: { enabled: false },
                                              fontSize: 14,
                                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                              scrollBeyondLastLine: false,
                                              smoothScrolling: true,
                                              cursorBlinking: "smooth",
                                              cursorSmoothCaretAnimation: "on",
                                              formatOnPaste: true,
                                              wordWrap: "on"
                                            }}
                                          />
                                        </div>
                                        <div className="bg-[#1e1e1e] border-t border-border flex flex-col">
                                          <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-border">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terminal Output</span>
                                          </div>
                                          <div className="p-4 h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
                                            {executionOutput[currentComp.id] ? (
                                              <pre className={executionOutput[currentComp.id].startsWith('[Error]') || executionOutput[currentComp.id].startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
                                                {executionOutput[currentComp.id]}
                                              </pre>
                                            ) : (
                                              <span className="text-gray-600 italic">Klik 'Run Code' untuk melihat hasil eksekusi...</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}`;

  const splitPaneReplacement = `{currentComp.type === 'LIVE_CODING' && (
                                      <div className="tour-editor border border-border rounded-xl overflow-hidden shadow-2xl bg-card">
                                        <PanelGroup direction="horizontal" className="min-h-[600px]">
                                          <Panel defaultSize={40} minSize={25}>
                                            <div className="h-full overflow-y-auto p-6 bg-background custom-scrollbar">
                                              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-emerald-500" /> Kasus Live Coding
                                              </h3>
                                              <div className="prose prose-invert max-w-none text-muted-foreground text-sm">
                                                <p className="whitespace-pre-wrap leading-relaxed">{currentComp.question}</p>
                                                {currentComp.description && (
                                                  <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5 whitespace-pre-wrap">
                                                    {currentComp.description}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </Panel>
                                          
                                          <PanelResizeHandle className="w-1 bg-border hover:bg-emerald-500/50 transition-colors cursor-col-resize flex flex-col items-center justify-center">
                                            <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
                                          </PanelResizeHandle>

                                          <Panel defaultSize={60} minSize={30} className="flex flex-col bg-[#1e1e1e]">
                                            <div className="bg-card px-4 py-3 border-b border-border flex flex-wrap gap-3 justify-between items-center">
                                              <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                  Main.{currentComp.metadata?.language || 'js'}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleRunCode(currentComp.id, currentComp.metadata?.language || 'javascript')}
                                                disabled={isExecuting[currentComp.id]}
                                                className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
                                              >
                                                <Play className="w-4 h-4 fill-current" /> 
                                                {isExecuting[currentComp.id] ? 'Running...' : 'Run Code'}
                                              </button>
                                            </div>
                                            <div className="flex-1 min-h-[300px]">
                                              <Editor
                                                height="100%"
                                                language={currentComp.metadata?.language || 'javascript'}
                                                theme="vs-dark"
                                                value={componentResponses[currentComp.id]?.textValue || ''}
                                                onChange={(value) => handleComponentChange(currentComp.id, value, 'textValue')}
                                                options={{
                                                  minimap: { enabled: false },
                                                  fontSize: 14,
                                                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                  scrollBeyondLastLine: false,
                                                  smoothScrolling: true,
                                                  cursorBlinking: "smooth",
                                                  formatOnPaste: true,
                                                  wordWrap: "on"
                                                }}
                                              />
                                            </div>
                                            
                                            <div className="tour-terminal bg-[#111] border-t border-border flex flex-col h-48 shrink-0">
                                              <div className="bg-black/60 px-4 py-2 flex items-center justify-between border-b border-border">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                  <Terminal className="w-3 h-3" /> Terminal Output
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(executionOutput[currentComp.id] || '');
                                                    setCopySuccess({ ...copySuccess, [currentComp.id]: true });
                                                    setTimeout(() => setCopySuccess({ ...copySuccess, [currentComp.id]: false }), 2000);
                                                  }}
                                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                                >
                                                  {copySuccess[currentComp.id] ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                  {copySuccess[currentComp.id] ? 'Tersalin' : 'Salin'}
                                                </button>
                                              </div>
                                              <div className="p-4 flex-1 overflow-y-auto font-mono text-xs custom-scrollbar">
                                                {executionOutput[currentComp.id] ? (
                                                  <pre className={executionOutput[currentComp.id].startsWith('[Error]') || executionOutput[currentComp.id].startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap font-bold' : 'text-[#a6accd] whitespace-pre-wrap'}>
                                                    {executionOutput[currentComp.id]}
                                                  </pre>
                                                ) : (
                                                  <span className="text-gray-600 italic">Klik 'Run Code' untuk melihat hasil eksekusi...</span>
                                                )}
                                              </div>
                                            </div>
                                          </Panel>
                                        </PanelGroup>
                                      </div>
                                    )}`;

  content = content.replace(liveCodingSearch, splitPaneReplacement);
  
  // Since we use Terminal icon in the split pane, let's make sure it's imported
  content = content.replace('Maximize2, Minimize2', 'Maximize2, Minimize2, Terminal');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Applied UX optimizations successfully!');
}

applyUXOptimizations();
