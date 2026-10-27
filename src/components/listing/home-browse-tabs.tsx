'use client'

import { useState, type ReactNode } from 'react'

type BrowseTab = 'area' | 'budget' | 'line'

const LABELS: Record<string, Record<BrowseTab, string>> = {
  ja: { area: 'エリア', budget: '予算', line: '路線' },
  en: { area: 'By area', budget: 'By budget', line: 'By train line' },
  'zh-TW': { area: '區域', budget: '預算', line: '路線' },
  'zh-CN': { area: '区域', budget: '预算', line: '路线' },
}

interface HomeBrowseTabsProps {
  locale: string
  area: ReactNode
  budget: ReactNode
  line: ReactNode
}

/**
 * Phones: the ward map, budget bands and train lines as three tabs, so the home page is not three long
 * sections in a row. Wide screens show all three as before. Every panel stays in the page for crawlers.
 */
export function HomeBrowseTabs({ locale, area, budget, line }: HomeBrowseTabsProps) {
  const [active, setActive] = useState<BrowseTab>('area')
  const labels = LABELS[locale] ?? LABELS.en
  const panel = (tab: BrowseTab) => (active === tab ? '' : 'max-lg:hidden')
  return <div data-testid="home-browse-tabs">
    <div role="tablist" aria-label={`${labels.area} / ${labels.budget} / ${labels.line}`} className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-[#eef2f6] p-1 lg:hidden">
      {(Object.keys(labels) as BrowseTab[]).map((tab) => <button key={tab} type="button" role="tab" id={`home-browse-tab-${tab}`} aria-selected={active === tab} aria-controls={`home-browse-${tab}`} onClick={() => setActive(tab)} className={`min-h-11 rounded-lg px-2 text-sm font-semibold transition ${active === tab ? 'bg-white text-[#274d7d] shadow-sm' : 'text-[#536274] hover:bg-white/60'}`}>{labels[tab]}</button>)}
    </div>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <div id="home-browse-area" role="tabpanel" aria-labelledby="home-browse-tab-area" className={panel('area')}>{area}</div>
      <div id="home-browse-budget" role="tabpanel" aria-labelledby="home-browse-tab-budget" className={panel('budget')}>{budget}</div>
      <div id="home-browse-line" role="tabpanel" aria-labelledby="home-browse-tab-line" className={`lg:col-span-2 ${panel('line')}`}>{line}</div>
    </div>
  </div>
}
