'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: '#ef4444',
            opacity: 0.8,
            marginBottom: '1.5rem',
          }}
        >
          Oops
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p
          style={{
            color: '#9ca3af',
            marginBottom: '2rem',
            maxWidth: '28rem',
            lineHeight: 1.5,
          }}
        >
          A critical error occurred. You can try again or return to the homepage.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              backgroundColor: '#111111',
              color: '#d1d5db',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
