import type { ReactNode } from "react";
import { X } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-2xl font-bold text-ink"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`panel w-full ${width} max-h-[88vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge sticky top-0 bg-panel/95 backdrop-blur">
          <h2
            className="font-bold text-ink"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {title}
          </h2>
          <button className="btn btn-ghost !p-1.5" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block mb-4">
      <div className="label-tech mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-faint mt-1">{hint}</div>}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="panel p-10 text-center text-muted">
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="label-tech">{label}</div>
      <div
        className={`text-2xl font-bold mt-1 ${accent ? "text-cyan" : "text-ink"}`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </div>
    </div>
  );
}
