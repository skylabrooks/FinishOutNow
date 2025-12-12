
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Play, Terminal } from 'lucide-react';
import { SYSTEM_TESTS, TestResult } from '../services/tests/testSuite';

interface DiagnosticPanelProps {
  onClose: () => void;
}

const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onClose }) => {
  const [tests, setTests] = useState<TestResult[]>(
    SYSTEM_TESTS.map(t => ({ 
      id: t.id, 
      name: t.name, 
      category: t.category as any, 
      status: 'pending' 
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> System Diagnostic Module Initialized...']);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined })));
    setLogs(['> Starting full system scan...']);

    for (const testDef of SYSTEM_TESTS) {
      // Update to running
      setTests(prev => prev.map(t => t.id === testDef.id ? { ...t, status: 'running' } : t));
      addLog(`Running: ${testDef.name}...`);
      
      const startTime = performance.now();
      try {
        const message = await testDef.run();
        const duration = Math.round(performance.now() - startTime);
        
        setTests(prev => prev.map(t => t.id === testDef.id ? { 
          ...t, 
          status: 'passed', 
          message,
          duration
        } : t));
        addLog(`PASS: ${testDef.name} (${duration}ms)`);
      } catch (error: any) {
        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testDef.id ? { 
          ...t, 
          status: 'failed', 
          message: error.message,
          duration
        } : t));
        addLog(`FAIL: ${testDef.name} - ${error.message}`);
      }
      
      // Small delay for UI visualization
      await new Promise(r => setTimeout(r, 300));
    }

    setIsRunning(false);
    addLog('> Scan complete.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <Terminal size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white font-mono">System Diagnostics</h2>
                <p className="text-slate-400 text-xs font-mono">Front-to-Back Integration Tests</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Test List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/50">
                {tests.map(test => (
                    <div key={test.id} className={`p-3 rounded-lg border flex items-center justify-between ${
                        test.status === 'running' ? 'bg-blue-900/10 border-blue-800' :
                        test.status === 'passed' ? 'bg-emerald-900/10 border-emerald-900/30' :
                        test.status === 'failed' ? 'bg-red-900/10 border-red-900/30' :
                        'bg-slate-800/30 border-slate-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className="w-6 flex justify-center">
                                {test.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-700"></div>}
                                {test.status === 'running' && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                                {test.status === 'passed' && <CheckCircle size={16} className="text-emerald-400" />}
                                {test.status === 'failed' && <AlertCircle size={16} className="text-red-400" />}
                            </div>
                            <div>
                                <h3 className={`text-sm font-medium ${test.status === 'failed' ? 'text-red-200' : 'text-slate-200'}`}>{test.name}</h3>
                                {test.message && (
                                    <p className={`text-xs mt-0.5 ${test.status === 'passed' ? 'text-slate-500' : 'text-red-400'}`}>
                                        {test.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {test.category}
                             </span>
                             {test.duration !== undefined && (
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">{test.duration}ms</p>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Console Log */}
            <div className="w-full md:w-1/3 bg-black border-l border-slate-800 p-4 font-mono text-xs overflow-y-auto text-slate-300">
                <div className="mb-2 text-slate-500 font-bold uppercase tracking-wider">Execution Log</div>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 break-words opacity-80 border-b border-slate-900 pb-1">
                        {log}
                    </div>
                ))}
                {isRunning && <div className="animate-pulse">_</div>}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
             <button 
                onClick={runTests}
                disabled={isRunning}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all"
            >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? 'Running Scan...' : 'Run Diagnostics'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
