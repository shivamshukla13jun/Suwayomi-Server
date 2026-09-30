import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1017] text-white p-4">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="mt-2 text-sm text-gray-400">
        The requested manga or server resource could not be found.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
      >
        Return to Library
      </Link>
    </div>
  );
}
