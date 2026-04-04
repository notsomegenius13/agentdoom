import Link from 'next/link';

const links = [
  { href: '/feed', label: 'Feed', desc: 'Browse AI-built tools' },
  { href: '/launch', label: 'Create', desc: 'Build something new' },
];

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-8xl font-extrabold tracking-tighter text-doom-accent opacity-80">
        404
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-gray-400 mb-10 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-lg mb-10">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-white/10 bg-doom-dark p-4 text-left transition-all hover:border-doom-accent/50 hover:bg-doom-gray"
          >
            <span className="block text-sm font-semibold text-white group-hover:text-doom-accent-light">
              {link.label}
            </span>
            <span className="block text-xs text-gray-500 mt-1">{link.desc}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-doom-accent-light transition-colors"
      >
        Go to homepage
      </Link>
    </main>
  );
}
