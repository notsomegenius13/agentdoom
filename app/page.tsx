'use client';

import { useState, useEffect, useRef } from 'react';

// ─── COUNTDOWN ─────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── AMBIENT GRID ──────────────────────────────────────────────────
function AmbientGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 80;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dist = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2),
          );
          const wave = Math.sin(dist * 0.005 - time) * 0.5 + 0.5;
          const alpha = wave * 0.04;

          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── WAITLIST FORM ─────────────────────────────────────────────────
function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join. Try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center" style={{ animation: 'fade-in-up 0.5s ease-out both' }}>
        <div className="text-sm font-mono text-white/60 tracking-wide">
          You&apos;re on the list.
        </div>
        <div className="text-xs text-white/25 mt-2 font-mono">
          Check your inbox for a confirmation.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          required
          className="w-full px-4 py-3 bg-transparent border border-white/[0.08] text-white/80 placeholder:text-white/15 font-mono text-sm focus:outline-none focus:border-white/20 transition-all tracking-wider text-center"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 font-mono text-sm tracking-[0.2em] uppercase text-white/70 border border-white/[0.08] hover:border-white/20 hover:text-white/90 transition-all duration-500 disabled:opacity-30 cursor-pointer"
        >
          {submitting ? '...' : 'Request Access'}
        </button>
      </div>
      {error && <div className="text-xs text-red-400/60 mt-3 text-center font-mono">{error}</div>}
    </form>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function TeaserPage() {
  const launchDate = new Date('2026-04-07T12:00:00-05:00');
  const countdown = useCountdown(launchDate);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#050505]">
      <AmbientGrid />

      {/* Scan line */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-16 py-24">
        {/* Logo mark */}
        <div style={{ animation: 'fade-in 1.5s ease-out both' }}>
          <div className="w-12 h-12 border border-white/[0.08] flex items-center justify-center">
            <div className="w-3 h-3 bg-white/20" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center" style={{ animation: 'fade-in 2s ease-out 0.3s both' }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-light tracking-[0.15em] text-white/90 uppercase leading-none">
            AgentDoom
          </h1>
        </div>

        {/* Cryptic tagline */}
        <div className="text-center" style={{ animation: 'fade-in 2s ease-out 0.8s both' }}>
          <p className="font-mono text-xs text-white/25 tracking-[0.3em] uppercase">
            Something is being built
          </p>
        </div>

        {/* Countdown */}
        <div style={{ animation: 'fade-in 2s ease-out 1.2s both' }}>
          <div className="flex items-center gap-6 font-mono">
            {[
              { val: countdown.days, label: 'd' },
              { val: countdown.hours, label: 'h' },
              { val: countdown.minutes, label: 'm' },
              { val: countdown.seconds, label: 's' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-light text-white/60 tabular-nums tracking-wider">
                  {String(item.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-white/15 mt-1 tracking-[0.2em]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"
          style={{ animation: 'fade-in 2s ease-out 1.5s both' }}
        />

        {/* Waitlist */}
        <div style={{ animation: 'fade-in 2s ease-out 1.8s both' }}>
          <WaitlistForm />
        </div>

        {/* Date */}
        <div style={{ animation: 'fade-in 2s ease-out 2.2s both' }}>
          <a
            href="/admin/login"
            className="font-mono text-[10px] text-white/10 tracking-[0.4em] uppercase hover:text-white/20 transition-colors cursor-pointer"
          >
            04.07.2026
          </a>
        </div>
      </div>
    </main>
  );
}
