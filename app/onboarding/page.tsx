import { Blob } from "@/components/ui/Blob";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  { label: "Live voice roleplay", stroke: "#22D3EE", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2" },
  { label: "Scored feedback", stroke: "#93C5FD", icon: "M3 3v18h18 M7 15l4-5 3 3 5-7" },
  { label: "Track progress", stroke: "#B9A6FF", icon: "M12 20v-6 M6 20v-4 M18 20V8" },
];

export default function Onboarding() {
  return (
    <main className="mesh-bg-center flex min-h-[100dvh] flex-col items-center justify-center gap-10 px-6 py-16 sm:px-12">
      <Reveal className="[transition-duration:1000ms]">
        <Blob size={200} glow={130} />
      </Reveal>

      <div className="flex max-w-[680px] flex-col items-center gap-[18px]">
        <Reveal delay={80}>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#93C5FD]">
            Salescoach
          </span>
        </Reveal>
        <Reveal delay={160}>
          <h1 className="text-center text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[52px] sm:leading-[58px]">
            Practise the call<br className="hidden sm:block" /> before it matters.
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="max-w-[560px] text-center text-[17px] leading-7 text-muted sm:text-[18px]">
            Have a real spoken roleplay with an AI buyer, then get a scored breakdown of exactly what
            to sharpen — voice, discovery, objections, and closing.
          </p>
        </Reveal>
      </div>

      <Reveal delay={320} className="flex flex-wrap items-center justify-center gap-3.5">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2.5 rounded-full border border-line bg-[rgba(20,22,29,0.5)] px-[18px] py-3 transition-colors duration-300 ease-spring hover:border-white/20"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={f.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
            <span className="text-[14px] font-medium text-[#D7DAE3]">{f.label}</span>
          </div>
        ))}
      </Reveal>

      <Reveal delay={420} className="flex flex-col items-center gap-4">
        <Cta
          href="/setup"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>}
        >
          Get started
        </Cta>
        <span className="text-[14px] font-medium text-muted">Takes about 2 minutes to set up</span>
      </Reveal>
    </main>
  );
}
