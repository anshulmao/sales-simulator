"use client";

type Props = {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  disabled?: boolean;
};

export function CallControls({
  isMuted,
  onToggleMute,
  onEndCall,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleMute}
        disabled={disabled}
        aria-pressed={isMuted}
        className={`flex items-center gap-2 rounded-full px-6 py-3 font-medium transition disabled:opacity-40 ${
          isMuted
            ? "bg-amber-500 text-black ring-2 ring-amber-300"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isMuted ? "bg-black" : "bg-emerald-400"
          }`}
        />
        {isMuted ? "Muted — mic off" : "Mute"}
      </button>

      <button
        onClick={onEndCall}
        disabled={disabled}
        className="rounded-full bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-500 disabled:opacity-40"
      >
        End Call
      </button>
    </div>
  );
}
