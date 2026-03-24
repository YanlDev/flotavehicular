export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  done    ? 'bg-[var(--color-primary)] text-white' : '',
                  active  ? 'bg-[var(--color-accent)] text-white' : '',
                  !done && !active ? 'bg-[var(--color-border)] text-[var(--color-text-muted)]' : '',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={[
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-[var(--color-accent)]' : done ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                  done ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
