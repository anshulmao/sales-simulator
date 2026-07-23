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
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleMute}
        disabled={disabled}
        aria-pressed={isMuted}
        className={`flex cursor-pointer items-center gap-2.5 rounded-full px-6 py-3 text-[15px] font-medium transition-all duration-500 ease-spring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${
          isMuted
            ? "border border-warning/50 bg-warning/[0.16] text-[#F5D9A6]"
            : "border border-line bg-[rgba(20,22,29,0.6)] text-ink hover:border-white/25"
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
            isMuted ? "bg-warning" : "bg-success"
          }`}
        />
        {isMuted ? "Muted — mic off" : "Mute"}
      </button>

      <button
        onClick={onEndCall}
        disabled={disabled}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-danger/50 bg-danger/[0.16] px-6 py-3 text-[15px] font-semibold text-[#FCA5A5] transition-all duration-500 ease-spring hover:bg-danger/[0.24] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.5.7 2 2 0 0 1 1.72 2v1.72a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3.51 2h1.72a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.5 2 2 0 0 1-.45 2.11L6.21 9.6" />
        </svg>
        End call
      </button>
    </div>
  );
}
