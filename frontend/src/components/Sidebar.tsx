import { NavLink, useSearchParams } from 'react-router-dom'
import { CheckCircle, WarnTriangle } from './icons'
import { sidebarSteps, type StepName } from '../data/shots'

type StepState = 'done' | 'active' | 'warning' | 'todo'

const routes: Record<StepName, string> = {
  Brief: '/brief',
  Plan: '/plan',
  References: '/references',
  Storyboards: '/storyboards',
  Keyframes: '/keyframes',
  Animation: '/animation',
  Audio: '/audio',
  Assembly: '/assembly',
  'Final review': '/final-review',
}

interface SidebarProps {
  /** Current step; steps before it render as done, after as todo. */
  active: StepName
  /** Optional overrides, e.g. { Keyframes: 'warning' } */
  overrides?: Partial<Record<StepName, StepState>>
  /** Optional count badges, e.g. { Keyframes: '6/8' } */
  badges?: Partial<Record<StepName, string>>
}

function stateFor(step: StepName, active: StepName, overrides?: SidebarProps['overrides']): StepState {
  if (overrides?.[step]) return overrides[step]!
  const i = sidebarSteps.indexOf(step)
  const a = sidebarSteps.indexOf(active)
  if (i < a) return 'done'
  if (i === a) return 'active'
  return 'todo'
}

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case 'done': return <span className="text-accent"><CheckCircle size={16} /></span>
    case 'active': return <span className="h-[14px] w-[14px] rounded-full bg-accent" />
    case 'warning': return <WarnTriangle size={16} />
    default: return <span className="box-border h-[14px] w-[14px] rounded-full border border-ink-5" />
  }
}

export function Sidebar({ active, overrides, badges }: SidebarProps) {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('productionId')
  const queryStr = productionId ? `?productionId=${productionId}` : ''

  return (
    <aside className="flex w-[205px] shrink-0 flex-col border-r border-line-soft bg-app px-6 pt-6">
      <p className="pb-5 text-[12px] font-normal tracking-[1.2px] text-ink-4">PRODUCTION</p>
      <nav className="flex flex-col gap-5">
        {sidebarSteps.map((step) => {
          const state = stateFor(step, active, overrides)
          const isCurrent = state === 'active' || state === 'warning'
          return (
            <NavLink
              key={step}
              to={`${routes[step]}${queryStr}`}
              className={`relative flex items-center gap-3 text-[16px] leading-6 transition-colors ${
                isCurrent ? 'font-normal text-ink' : state === 'done' ? 'text-ink-2 hover:text-ink' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {isCurrent && <span className="absolute -left-6 top-0 h-6 w-[3px] bg-accent" />}
              <StepIcon state={state} />
              {step}
              {badges?.[step] && <span className="pl-1 text-[13.5px] font-normal text-ink-3">{badges[step]}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

