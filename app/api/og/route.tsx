import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        fontFamily: 'sans-serif',
        padding: 60,
        position: 'relative',
      }}
    >
      {/* Accent gradient bar at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 40,
        }}
      >
        <div style={{ color: '#7c3aed', fontSize: 48, fontWeight: 800 }}>Agent</div>
        <div style={{ color: '#ffffff', fontSize: 48, fontWeight: 800 }}>Doom</div>
      </div>

      {/* Tagline */}
      <div
        style={{
          color: '#ffffff',
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: '90%',
          marginBottom: 24,
          display: 'flex',
        }}
      >
        Build Software with Words
      </div>

      <div
        style={{
          color: '#9ca3af',
          fontSize: 28,
          lineHeight: 1.5,
          maxWidth: '80%',
          display: 'flex',
        }}
      >
        Describe any tool. Watch AI build it in seconds. Deploy instantly.
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, display: 'flex' }} />

      {/* Bottom */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#6b7280',
          fontSize: 22,
        }}
      >
        <span>agentdoom.ai</span>
        <span>AI-Built Software for Everyone</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
