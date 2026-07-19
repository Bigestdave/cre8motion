import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CloseIcon } from './icons'

const steps = ['Show', 'Style', 'Characters'] as const

interface WizardShellProps {
  step: 1 | 2 | 3
  children: ReactNode
  /** footer actions, right-aligned; left slot for Back */
  footerLeft?: ReactNode
  footerRight: ReactNode
}

function StepDot({ index, current }: { index: number; current: number }) {
  const n = index + 1
  if (n < current) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.2 7.3l2.6 2.6 5-5.4" stroke="#050505" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (n === current) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-accent-ink">
        {n}
      </span>
    )
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-[14px] text-ink-2">
      {n}
    </span>
  )
}

export function WizardShell({ step, children, footerLeft, footerRight }: WizardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <header className="flex h-[64px] shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link to="/shows" className="text-[19px] font-semibold tracking-tight">
            Cre<span className="text-accent">8</span>Motion
          </Link>
          <span className="h-5 w-px bg-line" />
          <Link to="/shows" className="flex items-center gap-3 text-[15px] text-ink-2 transition-colors hover:text-ink">
            <CloseIcon size={16} />
            Create show
          </Link>
        </div>
        <span className="text-[14.5px] text-ink-2">Step {step} of 3</span>
      </header>

      {/* Stepper */}
      <div className="flex justify-center pt-6">
        <div className="flex items-start">
          {steps.map((label, i) => (
            <div key={label} className="flex items-start">
              <div className="flex w-[110px] flex-col items-center gap-2">
                <StepDot index={i} current={step} />
                <span className={`text-[13.5px] ${i + 1 === step ? 'font-medium text-ink' : 'text-ink-3'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mt-4 h-[2px] w-[110px] rounded ${i + 1 < step ? 'bg-accent' : 'bg-line'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 pb-28">{children}</main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-line-soft bg-app/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-4">
          <div>{footerLeft}</div>
          <div>{footerRight}</div>
        </div>
      </footer>
    </div>
  )
}

export function WizardTitle({ title, subtitle, info }: { title: string; subtitle: string; info?: boolean }) {
  return (
    <div className="pt-9 pb-8 text-center">
      <h1 className="inline-flex items-center gap-3 text-[40px] font-semibold tracking-tight">
        {title}
        {info && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong text-[13px] font-normal text-ink-2">
            i
          </span>
        )}
      </h1>
      <p className="pt-3 text-[15px] text-ink-2">{subtitle}</p>
    </div>
  )
}

/** Labeled input / textarea / select shells for wizard + episode forms */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pb-6">
      <p className="pb-2 text-[14px] text-ink-2">{label}</p>
      {children}
    </div>
  )
}

export function TextInput({ value, placeholder, onChange }: { value?: string; placeholder?: string; onChange?: (val: string) => void }) {
  return (
    <input
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent-border"
    />
  )
}

export function TextArea({ value, placeholder, rows = 5, onChange }: { value?: string; placeholder?: string; rows?: number; onChange?: (val: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent-border"
    />
  )
}

export function SelectInput({ value, icon, options, onChange }: { value: string; icon?: ReactNode; options?: string[]; onChange?: (val: string) => void }) {
  if (options) {
    return (
      <div className="relative flex w-full items-center">
        {icon && <span className="absolute left-4">{icon}</span>}
        <select 
          value={value} 
          onChange={e => onChange?.(e.target.value)}
          className={`w-full appearance-none rounded-lg border border-line bg-transparent py-3 pr-10 text-[15px] transition-colors hover:border-line-strong focus:outline-none ${icon ? 'pl-11' : 'pl-4'}`}
        >
          {options.map(opt => <option key={opt} value={opt} className="bg-surface">{opt}</option>)}
        </select>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-4 text-ink-3">
          <path d="M4.5 7.5L10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  
  return (
    <button className="flex w-full items-center justify-between rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] transition-colors hover:border-line-strong">
      <span className="flex items-center gap-3">{icon}{value}</span>
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-ink-3">
        <path d="M4.5 7.5L10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
