import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900">
        Book verified photographers, effortlessly
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        SnapBook connects you with professional, verified photographers for weddings,
        portraits, and events.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/photographers"
          className="rounded-lg bg-brand-500 px-6 py-3 font-medium text-white"
        >
          Browse photographers
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700"
        >
          Join as a photographer
        </Link>
      </div>
    </div>
  );
}
