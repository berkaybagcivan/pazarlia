const steps = ["Sepet", "Teslimat", "Ödeme"];

export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm font-semibold">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        const bubble =
          state === "current"
            ? "bg-coral text-white"
            : state === "done"
              ? "bg-ink text-white"
              : "bg-line text-muted";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${bubble}`}
            >
              {state === "done" ? "✓" : n}
            </span>
            <span className={state === "todo" ? "text-muted" : ""}>{label}</span>
            {n < steps.length && (
              <span aria-hidden className="mx-1 h-px w-6 bg-line sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}