// Main dashboard component for NVIDIA earnings call analysis
// This component allows users to select transcripts, analyze them, and view results with charts and themes.
// It includes a toggle switch for AI analysis mode and displays historical data with various visualizations.

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AnalysisResult } from '@/lib/types';

interface TranscriptData {
  quarter: string;
  date: string;
  content: string;
  title?: string;
  source?: string;
  success: boolean;
  error?: string;
  isCustom?: boolean;
}

// Helper to parse quarter strings
const parseQuarter = (quarterStr: string) => {
  const [qPart, year] = quarterStr.split(' ');
  return {
    year: parseInt(year),
    quarter: parseInt(qPart.substring(1))
  };
};

const compareQuartersAsc = (a: string, b: string) => {
  const aInfo = parseQuarter(a);
  const bInfo = parseQuarter(b);
  return aInfo.year - bInfo.year || aInfo.quarter - bInfo.quarter;
};

// Toggle Switch Component
const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-green-600' : 'bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function Dashboard() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTranscripts, setFetchingTranscripts] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [historicalData, setHistoricalData] = useState<Record<string, AnalysisResult>>({});
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [customQuarterInput, setCustomQuarterInput] = useState('');
  const [availableTranscripts, setAvailableTranscripts] = useState<TranscriptData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastAnalysisMethod, setLastAnalysisMethod] = useState<string>('');
  const [useAI, setUseAI] = useState(false);

  const itemsPerPage = 4;

  // Load AI preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('useAI');
    if (saved === 'true') {
      setUseAI(true);
    }
  }, []);

  // Save AI preference to localStorage
  useEffect(() => {
    localStorage.setItem('useAI', useAI.toString());
  }, [useAI]);

  const allTranscripts = (() => {
    const transcripts = [...availableTranscripts];
    const fetchedQuarters = new Set(availableTranscripts.map(t => t.quarter));
    const customQuarters = Object.keys(historicalData).filter(q => !fetchedQuarters.has(q));
    customQuarters.forEach(quarter => {
      transcripts.push({
        quarter,
        date: 'Custom Entry',
        content: '',
        success: true,
        isCustom: true
      });
    });
    return transcripts.sort((a, b) => compareQuartersAsc(a.quarter, b.quarter));
  })();

  const totalPages = Math.ceil(allTranscripts.length / itemsPerPage);
  const availableQuarters = allTranscripts
    .map(t => t.quarter)
    .filter(Boolean)
    .sort(compareQuartersAsc);

  useEffect(() => {
    if (availableQuarters.length > 0 && !selectedQuarter) {
      const saved = localStorage.getItem('selectedQuarter');
      if (saved && availableQuarters.includes(saved)) {
        setSelectedQuarter(saved);
      } else {
        setSelectedQuarter(availableQuarters[0]);
      }
    }
  }, [availableQuarters, selectedQuarter]);

  useEffect(() => {
    if (selectedQuarter && selectedQuarter !== 'custom') {
      localStorage.setItem('selectedQuarter', selectedQuarter);
    }
  }, [selectedQuarter]);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        setCurrentPage(p => p - 1);
      } else if (e.key === 'ArrowRight' && (currentPage + 1) * itemsPerPage < allTranscripts.length) {
        setCurrentPage(p => p + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, itemsPerPage, allTranscripts.length]);

  const fetchTranscripts = async () => {
    setFetchingTranscripts(true);
    try {
      const res = await fetch('/api/transcripts');
      const data = await res.json();
      if (data.success && data.transcripts) {
        setAvailableTranscripts(data.transcripts);
        for (const t of data.transcripts) {
          if (t.success && t.content) {
            await analyzeTranscript(t.content, t.quarter);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingTranscripts(false);
    }
  };

  const analyzeTranscript = async (text: string, quarter: string) => {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: text,
          useAI: useAI
        })
      });
      const data = await res.json();
      if (data.success) {
        setHistoricalData(prev => ({ ...prev, [quarter]: data.analysis }));
        if (quarter === selectedQuarter) {
          setCurrentAnalysis(data.analysis);
        }
        setLastAnalysisMethod(data.metadata?.method || 'unknown');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualAnalyze = async () => {
    if (!transcript.trim()) return;
    let quarterToUse = selectedQuarter;
    if (selectedQuarter === 'custom' && customQuarterInput.trim()) {
      quarterToUse = customQuarterInput.trim();
      setSelectedQuarter(quarterToUse);
      localStorage.setItem('selectedQuarter', quarterToUse);
    }
    setLoading(true);
    try {
      await analyzeTranscript(transcript, quarterToUse);
      setTranscript('');
      setCustomQuarterInput('');
    } finally {
      setLoading(false);
    }
  };

  const selectTranscript = (t: TranscriptData) => {
    if (!t.isCustom) setTranscript(t.content);
    setSelectedQuarter(t.quarter);
    setCustomQuarterInput('');
    localStorage.setItem('selectedQuarter', t.quarter);
    const idx = allTranscripts.findIndex(x => x.quarter === t.quarter);
    if (idx !== -1) {
      const page = Math.floor(idx / itemsPerPage);
      if (page !== currentPage) setCurrentPage(page);
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const displayData = historicalData[selectedQuarter] || currentAnalysis;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              NVIDIA Earnings Call Analyzer
            </h1>
            <p className="text-gray-600">
              AI-powered sentiment analysis and theme extraction
            </p>
            {/* AI Toggle Control */}
            <div className="mt-4 flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Analysis Mode:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!useAI ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    📊 Keyword
                  </span>
                  <ToggleSwitch 
                    checked={useAI} 
                    onChange={setUseAI}
                  />
                  <span className={`text-sm ${useAI ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    🤖 AI
                  </span>
                </div>
              </div>
              {useAI && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-700">Gemini AI Active</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={fetchTranscripts}
            disabled={fetchingTranscripts}
            className="bg-black text-green-400 px-6 py-3 rounded-lg hover:bg-gray-900 border-2 border-green-400 hover:border-green-300 hover:text-green-300 disabled:bg-gray-400 disabled:text-gray-300 disabled:border-gray-400 transition-all duration-200"
            aria-label="Fetch recent transcripts">
            {fetchingTranscripts ? 'Fetching...' : '🔄 Fetch Recent Transcripts'}
          </button>
        </div>

        {/* Transcript Selector */}
        {allTranscripts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Transcripts</h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {Math.min((currentPage + 1) * itemsPerPage, allTranscripts.length)} of {allTranscripts.length} quarters
                </div>
                {totalPages > 1 && (
                  <div className="hidden md:block text-xs text-gray-400">Use ← → keys</div>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className={`absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 transition ${
                  currentPage > 0 ? 'hover:bg-gray-50' : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Previous transcripts"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
                {allTranscripts
                  .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                  .map(t => (
                    <button
                      key={t.quarter}
                      onClick={() => selectTranscript(t)}
                      disabled={!t.success}
                      className={`p-3 md:p-4 rounded-lg border-2 transition relative ${
                        t.success
                          ? t.isCustom
                            ? 'border-purple-200 hover:border-purple-500 hover:bg-purple-50'
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      } ${selectedQuarter === t.quarter ? (t.isCustom ? 'border-purple-500 bg-purple-50' : 'border-blue-500 bg-blue-50') : ''}`}
                    >
                      {t.isCustom && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2">
                          <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                            Custom
                          </span>
                        </div>
                      )}
                      <div className="font-semibold text-sm md:text-base">{t.quarter}</div>
                      <div className="text-xs md:text-sm text-gray-600 truncate">{t.date}</div>
                      {historicalData[t.quarter] && (
                        <div className="text-xs text-green-600 mt-1">✓ Analyzed</div>
                      )}
                      {!t.success && (
                        <div className="text-xs text-red-600 mt-1">Failed to fetch</div>
                      )}
                    </button>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={(currentPage + 1) * itemsPerPage >= allTranscripts.length}
                className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 transition ${
                  (currentPage + 1) * itemsPerPage < allTranscripts.length
                    ? 'hover:bg-gray-50'
                    : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Next transcripts"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2 h-2 rounded-full transition ${
                      currentPage === i ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {transcript ? 'Edit Transcript' : 'Paste Custom Transcript'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
                {selectedQuarter && selectedQuarter !== 'custom' && (
                  <span className="ml-2 text-xs text-gray-500">(saved selection)</span>
                )}
              </label>
              <select
                value={selectedQuarter}
                onChange={e => {
                  const v = e.target.value;
                  setSelectedQuarter(v);
                  if (v !== 'custom') setCustomQuarterInput('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableQuarters.length === 0 ? (
                  <option value="">Select Quarter</option>
                ) : (
                  availableQuarters.map(q => <option key={q} value={q}>{q}</option>)
                )}
                <option value="custom">+ Add Custom Quarter</option>
              </select>

              {selectedQuarter === 'custom' && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Enter quarter (e.g., Q1 2025)"
                    value={customQuarterInput}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      customQuarterInput && !/^Q[1-4]\s+20\d{2}$/.test(customQuarterInput.trim())
                        ? 'border-yellow-300 focus:ring-yellow-400'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    onChange={e => setCustomQuarterInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && customQuarterInput.trim()) {
                        handleManualAnalyze();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Suggested format: Q# YYYY (e.g., Q1 2025). Press Enter or click Analyze.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transcript Text</label>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste NVIDIA earnings call transcript here..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleManualAnalyze}
              disabled={
                loading ||
                !transcript.trim() ||
                (selectedQuarter === 'custom' && !customQuarterInput.trim())
              }
              className="relative w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{useAI ? 'AI is analyzing...' : 'Analyzing with keywords...'}</span>
                </div>
              ) : (
                <>
                  {selectedQuarter === 'custom' && customQuarterInput
                    ? `Analyze Transcript for ${customQuarterInput}`
                    : 'Analyze Transcript'}
                  {useAI && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      AI ✨
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {displayData && (
          <div className="space-y-6">
            {/* Analysis Info Banner */}
            {lastAnalysisMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-800">
                    Analysis powered by {lastAnalysisMethod === 'gemini-ai' ? '🤖 Google Gemini AI' : '📊 Keyword Detection'}
                  </span>
                </div>
                {lastAnalysisMethod !== 'gemini-ai' && (
                  <button
                    onClick={() => setUseAI(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Switch to AI analysis →
                  </button>
                )}
              </div>
            )}

            {/* Quarter Tabs */}
            {Object.keys(historicalData).length > 0 && (
              <div className="relative bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <div className="flex space-x-2 p-2 min-w-max">
                    {Object.keys(historicalData).sort(compareQuartersAsc).map(quarter => (
                      <button
                        key={quarter}
                        onClick={() => {
                          setSelectedQuarter(quarter);
                          setCustomQuarterInput('');
                          localStorage.setItem('selectedQuarter', quarter);
                          const idx = allTranscripts.findIndex(t => t.quarter === quarter);
                          if (idx !== -1) {
                            const page = Math.floor(idx / itemsPerPage);
                            if (page !== currentPage) setCurrentPage(page);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                          selectedQuarter === quarter
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {quarter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Management Sentiment</h3>
                <div className={`rounded-lg p-4 ${getSentimentColor(displayData.managementSentiment.label).split(' ')[1]}`}>
                  <div className={`text-3xl font-bold ${getSentimentColor(displayData.managementSentiment.label).split(' ')[0]}`}>
                    {displayData.managementSentiment.score}%
                  </div>
                  <div className="text-sm font-medium capitalize mt-1">
                    {displayData.managementSentiment.label}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{displayData.managementSentiment.summary}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Overall Tone</h3>
                <div className="text-2xl font-bold capitalize text-gray-800">
                  {displayData.overallTone}
                </div>
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    {displayData.overallTone === 'confident' && <span className="text-green-500">✓ Strong outlook</span>}
                    {displayData.overallTone === 'cautious' && <span className="text-yellow-500">⚠ Reserved approach</span>}
                    {displayData.overallTone === 'mixed' && <span className="text-blue-500">◆ Balanced perspective</span>}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Themes Found</span>
                    <span className="font-bold">{displayData.keyThemes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quarter</span>
                    <span className="font-bold">
                      {selectedQuarter === 'custom' ? customQuarterInput || 'Custom' : selectedQuarter}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sentiment</span>
                    <span className="font-bold capitalize">{displayData.managementSentiment.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Themes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">
                Strategic Focus Areas - {selectedQuarter === 'custom' ? (customQuarterInput || 'Custom Quarter') : selectedQuarter}
              </h3>
              <div className="flex flex-wrap gap-3">
                {displayData.keyThemes.map((theme, i) => {
                  const colors = [
                    'bg-blue-100 text-blue-800',
                    'bg-green-100 text-green-800',
                    'bg-purple-100 text-purple-800',
                    'bg-yellow-100 text-yellow-800',
                    'bg-pink-100 text-pink-800'
                  ];
                  return (
                    <span key={theme} className={`px-4 py-2 rounded-full text-sm font-medium ${colors[i % colors.length]}`}>
                      {theme}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            {Object.keys(historicalData).length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Sentiment Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={Object.entries(historicalData)
                        .sort(([a], [b]) => compareQuartersAsc(a, b))
                        .map(([quarter, data]) => ({ quarter, sentiment: data.managementSentiment.score }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sentiment" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Quarter-over-Quarter Change</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={Object.entries(historicalData)
                        .sort(([a], [b]) => compareQuartersAsc(a, b))
                        .map(([quarter, data]) => ({ quarter, sentiment: data.managementSentiment.score }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="sentiment" fill="#10B981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}