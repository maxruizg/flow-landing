export function Marquee() {
  const text =
    "SHIPS FROM MEXICO CITY \u00A0\u00A0\u2022\u00A0\u00A0 FLOW URBAN WEAR, 2026 \u00A0\u00A0\u2022\u00A0\u00A0 LESS THINKING MORE FLOW \u00A0\u00A0\u2022\u00A0\u00A0 NEW DROP: LTMF SS26 \u00A0\u00A0\u2022\u00A0\u00A0 ";

  return (
    <div className="bg-flow-black border-b border-flow-900 overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="text-xs uppercase tracking-[0.3em] text-flow-400 py-2.5 font-body"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
