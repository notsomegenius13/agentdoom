'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = [
  { key: 'money', label: 'Finance & Money', icon: '💰' },
  { key: 'productivity', label: 'Productivity', icon: '⚡' },
  { key: 'social', label: 'Social', icon: '🌐' },
  { key: 'creator', label: 'Creator Tools', icon: '🎨' },
  { key: 'business', label: 'Business', icon: '📊' },
  { key: 'utility', label: 'Utilities', icon: '🔧' },
];

const PRICING_OPTIONS = [
  { key: 'free', label: 'Free', desc: 'Anyone can use it' },
  { key: 'paid', label: 'Paid', desc: 'Set your own price' },
];

const STAGES = [
  'classifying',
  'generating',
  'assembling',
  'validating',
  'moderating',
  'deploying',
  'done',
] as const;
type Stage = (typeof STAGES)[number] | 'error' | null;

interface ToolDraft {
  category: string;
  title: string;
  description: string;
  pricing: 'free' | 'paid';
  priceCents: number;
}

const STEP_LABELS = ['Category', 'Describe', 'Generate'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
              i < current
                ? 'bg-doom-green text-white'
                : i === current
                  ? 'bg-doom-accent text-white'
                  : 'bg-doom-gray text-gray-500'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <span
            className={`text-sm font-medium hidden sm:block ${
              i === current ? 'text-white' : 'text-gray-500'
            }`}
          >
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && <div className="w-8 h-px bg-gray-800 hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  classifying: 'Classifying prompt…',
  generating: 'Generating tool…',
  assembling: 'Assembling components…',
  validating: 'Validating output…',
  moderating: 'Moderating content…',
  deploying: 'Deploying…',
  done: 'Done!',
  error: 'Error',
};

function StageProgress({ stage }: { stage: Stage }) {
  const activeIdx = stage ? STAGES.indexOf(stage as (typeof STAGES)[number]) : -1;
  return (
    <div className="space-y-2 mb-6">
      {STAGES.filter((s) => s !== 'done').map((s, i) => {
        const isActive = s === stage;
        const isDone = activeIdx > i || stage === 'done';
        return (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                isDone
                  ? 'bg-doom-green text-white'
                  : isActive
                    ? 'bg-doom-accent text-white'
                    : 'bg-doom-gray text-gray-600'
              }`}
            >
              {isDone ? (
                '✓'
              ) : isActive ? (
                <span className="h-2.5 w-2.5 rounded-full border-2 border-white border-t-transparent animate-spin block" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm transition-colors ${
                isDone ? 'text-doom-green' : isActive ? 'text-white font-medium' : 'text-gray-600'
              }`}
            >
              {STAGE_LABELS[s] ?? s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CreateToolPage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ToolDraft>({
    category: '',
    title: '',
    description: '',
    pricing: 'free',
    priceCents: 0,
  });

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<Stage>(null);
  const [stageLine, setStageLine] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [toolUrl, setToolUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const update = useCallback(
    (patch: Partial<ToolDraft>) => setDraft((prev) => ({ ...prev, ...patch })),
    [],
  );

  const canAdvance = () => {
    if (step === 0) return !!draft.category;
    if (step === 1) return draft.title.trim().length >= 3 && draft.description.trim().length >= 10;
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStage(null);
    setStageLine('');
    setPreviewHtml(null);
    setToolUrl(null);
    setGenError(null);

    const prompt = `Build a ${draft.category} tool called "${draft.title}". ${draft.description}`;

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.text();
        setGenError(body || `Request failed: ${res.status}`);
        setStage('error');
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.stage) setStage(event.stage as Stage);
          if (event.line) setStageLine(event.line as string);
          if (event.preview) setPreviewHtml(event.preview as string);

          if (event.stage === 'done') {
            const url = (event.deployUrl ?? event.url) as string | undefined;
            if (url) setToolUrl(url);
            setGenerating(false);
          }

          if (event.stage === 'error') {
            setGenError((event.line as string) || 'Generation failed');
            setGenerating(false);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setGenError(err instanceof Error ? err.message : 'Unknown error');
        setStage('error');
      }
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create a Tool</h1>
          <p className="text-gray-400 text-sm mb-6">
            Follow the steps to build and publish your tool to the marketplace.
          </p>
        </motion.div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* Step 1: Category */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">Pick a category</h2>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => update({ category: cat.key })}
                    className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${
                      draft.category === cat.key
                        ? 'border-doom-accent bg-doom-accent/10'
                        : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="mt-2 text-sm font-medium text-white">{cat.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Describe */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-semibold">Describe your tool</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g. Budget Planner, Invoice Generator"
                  className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="What does your tool do? Who is it for?"
                  rows={4}
                  className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pricing</label>
                <div className="flex gap-3">
                  {PRICING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        update({
                          pricing: opt.key as 'free' | 'paid',
                          priceCents: opt.key === 'free' ? 0 : draft.priceCents || 499,
                        })
                      }
                      className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                        draft.pricing === opt.key
                          ? 'border-doom-accent bg-doom-accent/10'
                          : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {draft.pricing === 'paid' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <label className="block text-xs text-gray-400 mb-1">Price (USD)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        value={(draft.priceCents / 100).toFixed(2)}
                        onChange={(e) =>
                          update({
                            priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                          })
                        }
                        className="w-28 rounded-lg border border-gray-800 bg-doom-dark px-3 py-2 text-white focus:border-doom-accent focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      You earn ${((draft.priceCents * 0.85) / 100).toFixed(2)} per sale (85% revenue
                      share)
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-1">Generate your tool</h2>
              <p className="text-sm text-gray-400 mb-6">
                AI will build <span className="text-white font-medium">{draft.title}</span> and
                deploy it live.
              </p>

              {/* Progress */}
              {(generating || stage) && (
                <div className="mb-6 rounded-2xl border border-gray-800 bg-doom-dark p-5">
                  <StageProgress stage={stage} />
                  {stageLine && <p className="text-xs text-gray-500 mt-2 truncate">{stageLine}</p>}
                </div>
              )}

              {/* Error */}
              {genError && (
                <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  {genError}
                </div>
              )}

              {/* Live preview iframe */}
              {previewHtml && (
                <div className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden mb-6">
                  <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-doom-green animate-pulse" />
                    <span className="text-xs text-gray-400">Live Preview</span>
                  </div>
                  <div className="h-64 bg-white">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full pointer-events-none"
                      sandbox=""
                      title="Tool Preview"
                    />
                  </div>
                </div>
              )}

              {/* Done: tool link */}
              {stage === 'done' && toolUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-doom-green/40 bg-doom-green/5 p-5 mb-4"
                >
                  <p className="text-sm font-semibold text-doom-green mb-3">Tool deployed!</p>
                  <a
                    href={toolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-doom-green text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-400 transition-colors"
                  >
                    View Tool →
                  </a>
                </motion.div>
              )}

              {/* Done without URL fallback */}
              {stage === 'done' && !toolUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-doom-green/40 bg-doom-green/5 p-5 mb-4"
                >
                  <p className="text-sm font-semibold text-doom-green mb-1">Tool generated!</p>
                  <Link
                    href="/dashboard"
                    className="text-sm text-doom-accent hover:text-doom-accent-light transition-colors"
                  >
                    Go to Dashboard →
                  </Link>
                </motion.div>
              )}

              {/* Generate button */}
              {!generating && stage !== 'done' && (
                <button
                  onClick={handleGenerate}
                  className="w-full rounded-xl py-3 text-sm font-semibold bg-doom-accent text-white hover:bg-doom-accent-light transition-all"
                >
                  {genError ? 'Retry Generation' : 'Generate Tool with AI'}
                </button>
              )}

              {generating && (
                <button
                  onClick={() => {
                    abortRef.current?.abort();
                    setGenerating(false);
                  }}
                  className="w-full rounded-xl py-3 text-sm font-semibold bg-doom-gray text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              step > 0 && !generating
                ? 'text-gray-400 hover:text-white'
                : 'text-transparent cursor-default'
            }`}
            disabled={step === 0 || generating}
          >
            Back
          </button>

          {step < 2 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className={`rounded-xl px-6 py-2 text-sm font-semibold transition-all ${
                canAdvance()
                  ? 'bg-doom-accent text-white hover:bg-doom-accent-light'
                  : 'bg-doom-gray text-gray-600 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
