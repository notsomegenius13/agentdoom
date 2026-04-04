'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: string;
}

interface LayoutConfig {
  type: string;
  maxWidth: string;
  padding: string;
}

interface PrimitiveConfig {
  type: string;
  id: string;
  props: Record<string, unknown>;
  position: number;
}

interface ToolConfig {
  title: string;
  description: string;
  primitives: PrimitiveConfig[];
  layout: LayoutConfig;
  theme: ThemeConfig;
}

interface ToolDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  creator: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  config: ToolConfig | null;
  previewHtml: string | null;
  remixedFrom: string | null;
  remixesCount: number;
}

type WizardTab = 'theme' | 'content' | 'features';

const COLOR_PRESETS = [
  { name: 'Purple', primary: '#7c3aed', bg: '#f5f3ff' },
  { name: 'Blue', primary: '#3b82f6', bg: '#eff6ff' },
  { name: 'Green', primary: '#10b981', bg: '#ecfdf5' },
  { name: 'Rose', primary: '#f43f5e', bg: '#fff1f2' },
  { name: 'Amber', primary: '#f59e0b', bg: '#fffbeb' },
  { name: 'Teal', primary: '#14b8a6', bg: '#f0fdfa' },
  { name: 'Indigo', primary: '#6366f1', bg: '#eef2ff' },
  { name: 'Slate', primary: '#475569', bg: '#f8fafc' },
];

const FONT_OPTIONS = [
  { label: 'System Default', value: 'system-ui, sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Monospace', value: "'JetBrains Mono', monospace" },
];

const RADIUS_OPTIONS = [
  { label: 'None', value: '0px' },
  { label: 'Small', value: '6px' },
  { label: 'Medium', value: '12px' },
  { label: 'Large', value: '16px' },
  { label: 'Round', value: '24px' },
];

export default function RemixPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const router = useRouter();
  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);
  const [forked, setForked] = useState(false);
  const [activeTab, setActiveTab] = useState<WizardTab>('theme');

  // Customization state derived from config
  const [config, setConfig] = useState<ToolConfig | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchTool = async () => {
      const res = await fetch(`/api/tools/${toolId}`);
      if (res.ok) {
        const data: ToolDetail = await res.json();
        setTool(data);
        if (data.config) {
          setConfig(data.config);
        }
        if (data.previewHtml) {
          setPreviewHtml(data.previewHtml);
        }
      }
      setLoading(false);
    };
    fetchTool();
  }, [toolId]);

  // Live preview: debounce config changes and re-assemble HTML
  const updatePreview = useCallback(async (cfg: ToolConfig) => {
    try {
      const res = await fetch('/api/tools/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (res.ok) {
        const { html } = await res.json();
        setPreviewHtml(html);
      }
    } catch {
      // preview update failed silently
    }
  }, []);

  const applyConfigChange = useCallback(
    (updater: (prev: ToolConfig) => ToolConfig) => {
      setConfig((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        // Debounce preview updates
        if (previewDebounce.current) clearTimeout(previewDebounce.current);
        previewDebounce.current = setTimeout(() => updatePreview(next), 400);
        return next;
      });
    },
    [updatePreview],
  );

  const handleFork = useCallback(async () => {
    if (!tool || !config || forking) return;
    setForking(true);

    try {
      const res = await fetch('/api/tools/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceToolId: tool.id,
          config,
          attribution: {
            originalCreator: tool.creator.username,
            originalTitle: tool.title,
          },
        }),
      });

      if (res.ok) {
        const { slug } = await res.json();
        setForked(true);
        setTimeout(() => router.push(`/t/${slug}`), 1500);
      }
    } catch {
      // fork failed
    } finally {
      setForking(false);
    }
  }, [tool, config, forking, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!tool || !config) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Tool not found</p>
        <Link href="/feed" className="text-doom-accent hover:underline text-sm">
          Back to Marketplace
        </Link>
      </main>
    );
  }

  const tabs: { id: WizardTab; label: string; icon: string }[] = [
    { id: 'theme', label: 'Appearance', icon: '🎨' },
    { id: 'content', label: 'Text', icon: '✏️' },
    { id: 'features', label: 'Advanced', icon: '⚙️' },
  ];

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/t/${tool.slug}`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to Tool
            </Link>
            <button
              onClick={handleFork}
              disabled={forking || forked}
              className="rounded-lg bg-doom-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {forking ? 'Forking...' : forked ? 'Forked!' : 'Deploy Fork'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {forked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto max-w-7xl px-4 mt-4"
          >
            <div className="rounded-xl bg-doom-green/10 border border-doom-green/30 px-4 py-3 text-doom-green text-sm">
              Forked successfully! Redirecting to your new tool...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Fork Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Fork & Remix</h1>
          <p className="mt-1 text-sm text-gray-400">
            Forking <span className="text-white font-medium">{tool.title}</span> by{' '}
            <span className="text-white">{tool.creator.displayName || tool.creator.username}</span>
            {tool.remixesCount > 0 && (
              <span className="ml-2 text-gray-600">
                ({tool.remixesCount} fork{tool.remixesCount !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </motion.div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Wizard Panel — 2 cols */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-doom-dark p-1 border border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-doom-accent text-white'
                      : 'text-gray-400 hover:text-white hover:bg-doom-gray'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4 rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden">
              <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="wait">
                  {activeTab === 'theme' && (
                    <ThemePanel config={config} onChange={applyConfigChange} key="theme" />
                  )}
                  {activeTab === 'content' && (
                    <ContentPanel config={config} onChange={applyConfigChange} key="content" />
                  )}
                  {activeTab === 'features' && (
                    <FeaturesPanel config={config} onChange={applyConfigChange} key="features" />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Attribution */}
            <div className="mt-4 rounded-xl bg-doom-gray/50 border border-gray-800 px-4 py-3">
              <p className="text-xs text-gray-500">
                <span className="text-gray-400 font-medium">Attribution:</span> This fork will
                credit{' '}
                <span className="text-white">
                  {tool.creator.displayName || tool.creator.username}
                </span>{' '}
                as the original creator.
              </p>
            </div>
          </motion.div>

          {/* Live Preview — 3 cols */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-2xl border border-gray-800 overflow-hidden sticky top-20">
              {/* Browser Chrome */}
              <div className="bg-doom-gray px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-500 ml-2">Live Preview</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-doom-green animate-pulse" />
                  <span className="text-[10px] text-doom-green">Live</span>
                </div>
              </div>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full bg-white"
                  style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
                  sandbox="allow-scripts"
                  title="Fork Preview"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-doom-dark text-gray-600">
                  No preview available
                </div>
              )}
            </div>

            {/* Mobile Fork Button */}
            <div className="mt-4 lg:hidden">
              <button
                onClick={handleFork}
                disabled={forking || forked}
                className="w-full rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {forking ? 'Forking...' : forked ? 'Forked!' : 'Deploy Fork'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────
   Theme Panel
   ──────────────────────────────────────────── */
function ThemePanel({
  config,
  onChange,
}: {
  config: ToolConfig;
  onChange: (updater: (c: ToolConfig) => ToolConfig) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5"
    >
      {/* Color Presets */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Color Preset</label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange((c) => ({
                  ...c,
                  theme: { ...c.theme, primaryColor: preset.primary, backgroundColor: preset.bg },
                }))
              }
              className={`group rounded-lg p-2 border transition-all text-center ${
                config.theme.primaryColor === preset.primary
                  ? 'border-doom-accent bg-doom-accent/10'
                  : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="h-6 w-full rounded-md mb-1" style={{ background: preset.primary }} />
              <span className="text-[10px] text-gray-400">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Primary Color</label>
          <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-doom-gray px-3 py-2">
            <input
              type="color"
              value={config.theme.primaryColor}
              onChange={(e) =>
                onChange((c) => ({ ...c, theme: { ...c.theme, primaryColor: e.target.value } }))
              }
              className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={config.theme.primaryColor}
              onChange={(e) =>
                onChange((c) => ({ ...c, theme: { ...c.theme, primaryColor: e.target.value } }))
              }
              className="bg-transparent text-xs text-gray-300 w-full focus:outline-none font-mono"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Background</label>
          <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-doom-gray px-3 py-2">
            <input
              type="color"
              value={config.theme.backgroundColor}
              onChange={(e) =>
                onChange((c) => ({
                  ...c,
                  theme: { ...c.theme, backgroundColor: e.target.value },
                }))
              }
              className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={config.theme.backgroundColor}
              onChange={(e) =>
                onChange((c) => ({
                  ...c,
                  theme: { ...c.theme, backgroundColor: e.target.value },
                }))
              }
              className="bg-transparent text-xs text-gray-300 w-full focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Font</label>
        <select
          value={config.theme.fontFamily}
          onChange={(e) =>
            onChange((c) => ({ ...c, theme: { ...c.theme, fontFamily: e.target.value } }))
          }
          className="w-full rounded-lg border border-gray-800 bg-doom-gray px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-doom-accent"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Border Radius */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Corner Radius</label>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() =>
                onChange((c) => ({ ...c, theme: { ...c.theme, borderRadius: r.value } }))
              }
              className={`flex-1 rounded-lg py-2 text-[10px] font-medium border transition-all ${
                config.theme.borderRadius === r.value
                  ? 'border-doom-accent text-doom-accent bg-doom-accent/10'
                  : 'border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   Content Panel
   ──────────────────────────────────────────── */
function ContentPanel({
  config,
  onChange,
}: {
  config: ToolConfig;
  onChange: (updater: (c: ToolConfig) => ToolConfig) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange((c) => ({ ...c, title: e.target.value }))}
          className="w-full rounded-lg border border-gray-800 bg-doom-gray px-3 py-2 text-sm text-white focus:outline-none focus:border-doom-accent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
        <textarea
          value={config.description}
          onChange={(e) => onChange((c) => ({ ...c, description: e.target.value }))}
          rows={2}
          className="w-full rounded-lg border border-gray-800 bg-doom-gray px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-doom-accent"
        />
      </div>

      {/* Per-primitive content editing */}
      {config.primitives.map((prim, idx) => (
        <div key={prim.id} className="rounded-xl border border-gray-800 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 capitalize">
              {prim.type} — {(prim.props.title as string) || `Component ${idx + 1}`}
            </span>
            <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full bg-doom-gray">
              {prim.type}
            </span>
          </div>

          {/* Primitive title */}
          {typeof prim.props.title === 'string' && (
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                Component Title
              </label>
              <input
                type="text"
                value={prim.props.title}
                onChange={(e) =>
                  onChange((c) => ({
                    ...c,
                    primitives: c.primitives.map((p, i) =>
                      i === idx ? { ...p, props: { ...p.props, title: e.target.value } } : p,
                    ),
                  }))
                }
                className="w-full rounded-lg border border-gray-800 bg-doom-black/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-doom-accent"
              />
            </div>
          )}

          {/* Submit/button label */}
          {typeof prim.props.submitLabel === 'string' && (
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                Button Text
              </label>
              <input
                type="text"
                value={prim.props.submitLabel}
                onChange={(e) =>
                  onChange((c) => ({
                    ...c,
                    primitives: c.primitives.map((p, i) =>
                      i === idx ? { ...p, props: { ...p.props, submitLabel: e.target.value } } : p,
                    ),
                  }))
                }
                className="w-full rounded-lg border border-gray-800 bg-doom-black/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-doom-accent"
              />
            </div>
          )}

          {/* Result label for calculators */}
          {typeof prim.props.resultLabel === 'string' && (
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                Result Label
              </label>
              <input
                type="text"
                value={prim.props.resultLabel}
                onChange={(e) =>
                  onChange((c) => ({
                    ...c,
                    primitives: c.primitives.map((p, i) =>
                      i === idx ? { ...p, props: { ...p.props, resultLabel: e.target.value } } : p,
                    ),
                  }))
                }
                className="w-full rounded-lg border border-gray-800 bg-doom-black/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-doom-accent"
              />
            </div>
          )}

          {/* Result prefix/suffix for calculators */}
          {(typeof prim.props.resultPrefix === 'string' ||
            typeof prim.props.resultSuffix === 'string') && (
            <div className="grid grid-cols-2 gap-2">
              {typeof prim.props.resultPrefix === 'string' && (
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                    Result Prefix
                  </label>
                  <input
                    type="text"
                    value={prim.props.resultPrefix}
                    onChange={(e) =>
                      onChange((c) => ({
                        ...c,
                        primitives: c.primitives.map((p, i) =>
                          i === idx
                            ? { ...p, props: { ...p.props, resultPrefix: e.target.value } }
                            : p,
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-800 bg-doom-black/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-doom-accent"
                  />
                </div>
              )}
              {typeof prim.props.resultSuffix === 'string' && (
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                    Result Suffix
                  </label>
                  <input
                    type="text"
                    value={prim.props.resultSuffix}
                    onChange={(e) =>
                      onChange((c) => ({
                        ...c,
                        primitives: c.primitives.map((p, i) =>
                          i === idx
                            ? { ...p, props: { ...p.props, resultSuffix: e.target.value } }
                            : p,
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-800 bg-doom-black/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-doom-accent"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   Features Panel
   ──────────────────────────────────────────── */
function FeaturesPanel({
  config,
  onChange,
}: {
  config: ToolConfig;
  onChange: (updater: (c: ToolConfig) => ToolConfig) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Layout */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Layout</label>
        <div className="grid grid-cols-3 gap-2">
          {(['single-column', 'two-column', 'stacked'] as const).map((layoutType) => (
            <button
              key={layoutType}
              onClick={() =>
                onChange((c) => ({
                  ...c,
                  layout: { ...c.layout, type: layoutType },
                }))
              }
              className={`rounded-lg py-2 text-[10px] font-medium border transition-all ${
                config.layout.type === layoutType
                  ? 'border-doom-accent text-doom-accent bg-doom-accent/10'
                  : 'border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              {layoutType === 'single-column'
                ? 'Single'
                : layoutType === 'two-column'
                  ? 'Two Column'
                  : 'Stacked'}
            </button>
          ))}
        </div>
      </div>

      {/* Per-primitive feature toggles */}
      {config.primitives.map((prim, idx) => (
        <div key={prim.id} className="rounded-xl border border-gray-800 p-3 space-y-3">
          <span className="text-xs font-semibold text-gray-300 capitalize block">
            {prim.type} Features
          </span>

          {/* Boolean toggles for any boolean props */}
          {Object.entries(prim.props)
            .filter(([, val]) => typeof val === 'boolean')
            .map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <button
                  onClick={() =>
                    onChange((c) => ({
                      ...c,
                      primitives: c.primitives.map((p, i) =>
                        i === idx ? { ...p, props: { ...p.props, [key]: !val } } : p,
                      ),
                    }))
                  }
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    val ? 'bg-doom-accent' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      val ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}

          {/* Select props (like period, mode, chartType) */}
          {Object.entries(prim.props)
            .filter(
              ([key, val]) =>
                typeof val === 'string' && ['period', 'mode', 'chartType'].includes(key),
            )
            .map(([key, val]) => {
              const options: Record<string, string[]> = {
                period: ['daily', 'weekly', 'monthly'],
                mode: ['countdown', 'pomodoro', 'stopwatch'],
                chartType: ['bar', 'pie', 'line'],
              };
              return (
                <div key={key}>
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex gap-1">
                    {(options[key] || []).map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          onChange((c) => ({
                            ...c,
                            primitives: c.primitives.map((p, i) =>
                              i === idx ? { ...p, props: { ...p.props, [key]: opt } } : p,
                            ),
                          }))
                        }
                        className={`flex-1 rounded-md py-1 text-[10px] font-medium border transition-all capitalize ${
                          val === opt
                            ? 'border-doom-accent text-doom-accent bg-doom-accent/10'
                            : 'border-gray-800 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Primitive reorder controls */}
          <div className="flex gap-1 pt-1">
            <button
              disabled={idx === 0}
              onClick={() =>
                onChange((c) => {
                  const prims = [...c.primitives];
                  [prims[idx - 1], prims[idx]] = [prims[idx], prims[idx - 1]];
                  return {
                    ...c,
                    primitives: prims.map((p, i) => ({ ...p, position: i })),
                  };
                })
              }
              className="text-[10px] text-gray-600 border border-gray-800 rounded px-2 py-0.5 hover:text-gray-400 disabled:opacity-30"
            >
              Move Up
            </button>
            <button
              disabled={idx === config.primitives.length - 1}
              onClick={() =>
                onChange((c) => {
                  const prims = [...c.primitives];
                  [prims[idx], prims[idx + 1]] = [prims[idx + 1], prims[idx]];
                  return {
                    ...c,
                    primitives: prims.map((p, i) => ({ ...p, position: i })),
                  };
                })
              }
              className="text-[10px] text-gray-600 border border-gray-800 rounded px-2 py-0.5 hover:text-gray-400 disabled:opacity-30"
            >
              Move Down
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
