import Link from "next/link";
import { Blob } from "@/components/ui/Blob";

const FEATURES = [
  { label: "Live voice roleplay", stroke: "#22D3EE", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2" },
  { label: "Scored feedback", stroke: "#93C5FD", icon: "M3 3v18h18 M7 15l4-5 3 3 5-7" },
  { label: "Track progress", stroke: "#B9A6FF", icon: "M12 20v-6 M6 20v-4 M18 20V8" },
];

export default function Onboarding() {
  return (
    <main className="mesh-bg-center flex min-h-screen flex-col items-center justify-center gap-10 p-12">
      <Blob size={200} glow={130} />

      <div className="flex max-w-[680px] flex-col items-center gap-[18px]">
        <span className="text-[13px] font-semibold tracking-[0.14em] text-[#93C5FD]">SALESCOACH</span>
        <h1 className="text-center text-[52px] font-semibold leading-[58px] tracking-[-0.03em] text-ink">
          Practise the call before it matters.
        </h1>
        <p className="text-center text-[18px] leading-7 text-muted">
          Have a real spoken roleplay with an AI buyer, then get a scored breakdown of exactly what
          to sharpen — voice, discovery, objections, and closing.
        </p>
      </div>

      <div className="flex gap-3.5">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5 rounded-full border border-line bg-[rgba(20,22,29,0.5)] px-[18px] py-3">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={f.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
            <span className="text-[14px] font-medium text-[#D7DAE3]">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <Link
          href="/setup"
          className="flex items-center justify-center gap-2.5 rounded-[14px] px-10 py-[17px] text-[16px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 10px 40px rgba(37,99,235,0.5)" }}
        >
          Get started
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
        </Link>
        <span className="text-[14px] font-medium text-muted">Takes about 2 minutes to set up</span>
      </div>
    </main>
  );
}
