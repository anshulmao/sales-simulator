import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">Sales Simulator</h1>
      <p className="max-w-md text-neutral-400">
        Live spoken roleplay with an AI buyer. This build covers the during-call
        experience only.
      </p>
      <Link
        href="/call"
        className="rounded-full bg-indigo-500 px-6 py-3 font-medium text-white transition hover:bg-indigo-400"
      >
        Start a call
      </Link>
    </main>
  );
}
