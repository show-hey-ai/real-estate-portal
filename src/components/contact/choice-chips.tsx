'use client'

interface ChoiceChipsProps {
  label: string
  options: readonly string[]
  chosen: readonly string[]
  onChange: (chosen: string[]) => void
  /** One answer only (budget); otherwise any number. */
  single?: boolean
}

/** Tap-to-choose answers, so visitors never have to type a message. */
export function ChoiceChips({ label, options, chosen, onChange, single = false }: ChoiceChipsProps) {
  const toggle = (option: string) => onChange(chosen.includes(option) ? chosen.filter((item) => item !== option) : single ? [option] : [...chosen, option])
  return <div role="group" aria-label={label}>
    <p className="text-xs font-semibold text-[#536274]">{label}</p>
    <div className="mt-1 flex flex-wrap gap-1.5">
      {options.map((option) => <button key={option} type="button" aria-pressed={chosen.includes(option)} onClick={() => toggle(option)}
        className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${chosen.includes(option) ? 'border-[#274d7d] bg-[#274d7d] text-white' : 'border-[#cfd9e3] bg-white text-[#1b293a] hover:bg-[#f3f6f9]'}`}>
        {option}
      </button>)}
    </div>
  </div>
}
