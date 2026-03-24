export default function FormField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-status-critical)] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-[var(--color-status-critical)]">{error}</p>
      )}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={[
        'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)]',
        'bg-[var(--color-surface)] text-[var(--color-text)] text-sm',
        'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
        'placeholder:text-[var(--color-text-muted)] transition',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={[
        'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)]',
        'bg-[var(--color-surface)] text-[var(--color-text)] text-sm',
        'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
        'transition',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      rows={3}
      className={[
        'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)]',
        'bg-[var(--color-surface)] text-[var(--color-text)] text-sm',
        'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
        'placeholder:text-[var(--color-text-muted)] transition resize-none',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
