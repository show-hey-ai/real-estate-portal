'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Play, Pause, RefreshCw, ShieldCheck } from 'lucide-react'
import { defaultPolicy, type AutonomyPolicy } from '@/lib/autonomy/policy'

type RecordEntry = { id: string; title: string; recordType: string; verification: string; content: Record<string, unknown>; createdAt: string }
type RuntimeData = {
  policy: AutonomyPolicy & { lastHeartbeatAt: string | null; lastSourceHeartbeatAt: string | null }
  costs: { recordedActualYen: number; unresolvedReservedYen: number }
  jobs: { id: string; kind: string; status: string; attempts: number; lastError: string | null; updatedAt: string }[]
  records: RecordEntry[]
  runs: { id: string; outcome: string; reservedCostYen: number; actualCostYen: number | null; providerReceipt: string | null }[]
  connections: { scheduler: boolean; ai: boolean }
}
const labels: Record<string, string> = { observe: '成果の観測', health: '公開状態の検査', strategy: '仮説・戦略更新', publication_audit: '候補の品質検査', verify_publication: '公開結果の確認', rollback_publication: '公開の復旧', reins_intake: 'REINS資料取得', maisoku_import: '資料解析・翻訳', generate_article: '多言語記事生成', seo: 'SEO検査・測定', verify_article: '記事公開の確認', rollback_article: '記事の復旧', pending: '実行待ち', running: '実行中', succeeded: '完了', blocked: '条件待ち', failed: '失敗', needs_reconciliation: '結果の照合待ち' }
const time = (value: string | null) => value ? new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未確認'
const money = (value: number) => `¥${value.toLocaleString('ja-JP')}`

export function AutonomyConsole() {
  const [data, setData] = useState<RuntimeData | null>(null)
  const [policy, setPolicy] = useState<AutonomyPolicy>(defaultPolicy)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dirty, setDirty] = useState(false)
  const refresh = useCallback(async (updateForm = false) => {
    try {
      const response = await fetch('/api/admin/autonomy', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '実行状態を取得できませんでした。')
      setData(payload)
      if (updateForm) {
        const { enabled, objective, intervalMinutes, monthlyBudgetYen, aiCallReserveYen, allowAiStrategy, allowPublication, allowArchive, allowReinsIntake, allowArticles, allowSeo, reinsIntervalHours, reinsBatchReserveYen, maxAttempts } = payload.policy
        setPolicy({ enabled, objective, intervalMinutes, monthlyBudgetYen, aiCallReserveYen, allowAiStrategy, allowPublication, allowArchive, allowReinsIntake, allowArticles, allowSeo, reinsIntervalHours, reinsBatchReserveYen, maxAttempts })
      }
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '接続を確認してください。') }
  }, [])
  useEffect(() => {
    void refresh(true)
    const timer = setInterval(() => { void refresh() }, 30_000)
    return () => clearInterval(timer)
  }, [refresh])

  function edit(next: Partial<AutonomyPolicy>) { setPolicy((current) => ({ ...current, ...next })); setDirty(true) }
  async function command(body: unknown, message: string) {
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/admin/autonomy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '操作を完了できませんでした。')
      const configuration = (body as { action: string }).action === 'configure'
      await refresh(configuration)
      if (configuration) setDirty(false)
      setNotice(message)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '操作に失敗しました。') }
    finally { setBusy(false) }
  }
  const observation = data?.records.find((record) => record.recordType === 'observation')
  const heartbeat = data?.policy.lastHeartbeatAt
  const freshHeartbeat = heartbeat && Date.now() - new Date(heartbeat).getTime() < Math.max(45, (data?.policy.intervalMinutes || 60) * 2) * 60_000
  const active = data?.policy.enabled
  const fieldClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
  const buttonClass = 'inline-flex items-center gap-2 rounded-md bg-[#1f3b32] px-4 py-2 text-sm font-medium text-white disabled:opacity-40'

  return <div className="space-y-7" data-testid="autonomy-console">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Ziyou / Autonomous operations</p><h1 className="text-3xl font-semibold text-[#10231e]">ポータルの自律運営</h1><p className="mt-3 max-w-2xl text-sm text-slate-600">目的と運用条件を設定すると、観測・検査・実行・学習が巡回します。人は結果を確認し、必要なときに条件を変更できます。</p></div>
      <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={!data || busy || dirty} onClick={() => void command({ action: 'configure', policy: { ...policy, enabled: !active } }, active ? '巡回を停止しました。' : '巡回を有効にしました。')} type="button">{active ? <Pause size={16} /> : <Play size={16} />}{active ? '停止' : '開始'}</button><button className={buttonClass} disabled={!data || busy || !active || dirty} onClick={() => void command({ action: 'tick' }, '巡回結果を更新しました。')} type="button"><RefreshCw size={16} />今すぐ巡回</button></div>
    </div>
    {error && <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
    {notice && <div role="status" className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
    <div className="grid gap-4 md:grid-cols-4">
      {[
        ['運転状態', !data ? '接続待ち' : !active ? '停止中' : freshHeartbeat ? '巡回を確認' : '起動確認待ち'],
        ['最終起動', time(heartbeat || null)],
        ['記録された実費', data ? money(data.costs.recordedActualYen) : '未取得'],
        ['照合前の費用予約', data ? money(data.costs.unresolvedReservedYen) : '未取得'],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-3 break-words text-lg font-semibold text-[#10231e]">{value}</p></div>)}
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={20} />目的・権限・上限</h2><form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); void command({ action: 'configure', policy }, '運用条件を保存しました。') }}>
      <label className="block text-sm font-medium">目的<textarea className={`${fieldClass} mt-2`} value={policy.objective} minLength={10} maxLength={500} rows={2} onChange={(event) => edit({ objective: event.target.value })} /></label>
      <div className="grid gap-4 md:grid-cols-4">{[
        ['intervalMinutes', '巡回間隔（分）', 15, 1440], ['monthlyBudgetYen', '月のAI予算（円）', 0, 1_000_000], ['aiCallReserveYen', '戦略AIの費用予約（円）', 1, 10_000], ['maxAttempts', '再試行の上限', 1, 5], ['reinsIntervalHours', 'REINS取得間隔（時間）', 1, 168], ['reinsBatchReserveYen', '資料1件の費用予約（円）', 100, 10_000],
      ].map(([key, label, min, max]) => <label key={String(key)} className="block text-sm">{label}<input className={`${fieldClass} mt-2`} type="number" min={Number(min)} max={Number(max)} step={1} required value={Number(policy[key as keyof AutonomyPolicy])} onChange={(event) => edit({ [key]: Number(event.target.value) })} /></label>)}</div>
      <div className="flex flex-wrap gap-5">{[['allowReinsIntake', 'REINSの定期取得・自動解析'], ['allowAiStrategy', 'AIによる戦略更新'], ['allowPublication', '検査合格候補の自動公開'], ['allowArchive', '期限切れ・広告不可の自動非公開'], ['allowArticles', '多言語記事の自動生成・公開'], ['allowSeo', '技術SEOの検査・測定']].map(([key, label]) => <label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={Boolean(policy[key as keyof AutonomyPolicy])} onChange={(event) => edit({ [key]: event.target.checked })} />{label}</label>)}</div>
      <p className="text-xs leading-6 text-slate-500">費用予約は実費と分けて管理し、当月の上限から控除します。結果不明の処理は照合まで翌月も予約を保持します。記事は公開物件を根拠に4言語で生成します。クリック・問い合わせ・成約ラベルから売上を推定しません。</p>
      <p className="text-xs text-slate-500">REINSワーカー最終起動：{time(data?.policy.lastSourceHeartbeatAt || null)}。REINS取得には常時稼働する専用ワーカーが必要です。</p>
      <div className="flex flex-wrap items-center gap-4"><button className={buttonClass} disabled={!data || busy} type="submit">運用条件を保存</button><p className="text-xs text-slate-500">定期起動用の接続：{data?.connections.scheduler ? '設定あり' : '設定待ち'} / AI：{data?.connections.ai ? '設定あり' : '設定待ち'}</p></div>
    </form></section>
    <section><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Activity size={20} />実績の観測</h2><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[['published', '公開物件'], ['visitors', '訪問者 / 7日'], ['contactClicks', '相談ボタン / 7日'], ['inquiries', '問合せ / 7日'], ['qualified', '対応中・接触済 / 7日'], ['confirmedRevenueYen', '確認済み売上']].map(([key, label]) => <div key={key} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{observation && observation.content[key] != null ? String(observation.content[key]) : '未観測'}</p></div>)}</div><p className="mt-3 text-xs text-slate-500">最新観測：{time(observation?.createdAt || null)}。集計は既存ポータルの記録に基づきます。</p></section>
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-6"><h2 className="mb-4 text-lg font-semibold">実行・復旧の状態</h2><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr>{['担当', '状態', '試行', '更新', '理由'].map((label) => <th key={label} className="pb-3 pr-4 font-medium">{label}</th>)}</tr></thead><tbody>{data?.jobs.map((job) => <tr key={job.id} className="border-b border-slate-100"><td className="py-3 pr-4 whitespace-nowrap">{labels[job.kind] || job.kind}</td><td className="py-3 pr-4 whitespace-nowrap">{labels[job.status] || job.status}</td><td className="py-3 pr-4">{job.attempts}</td><td className="py-3 pr-4 whitespace-nowrap text-xs">{time(job.updatedAt)}</td><td className="py-3 text-xs text-slate-500">{job.lastError || '—'}</td></tr>)}</tbody></table>{!data?.jobs.length && <p className="py-5 text-sm text-slate-500">実行記録はまだありません。</p>}</section>
    <section><h2 className="mb-4 text-lg font-semibold">根拠・仮説・学習の記録</h2><div className="grid gap-4 lg:grid-cols-2">{data?.records.filter((record) => record.recordType !== 'observation').slice(0, 10).map((record) => <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="mb-2 text-xs text-slate-500">{record.recordType} / {record.verification === 'verified' ? '根拠を確認' : '未検証'} / {time(record.createdAt)}</p><h3 className="font-medium">{record.title}</h3><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">{JSON.stringify(record.content, null, 2)}</pre></article>)}</div>{!data?.records.length && <p className="text-sm text-slate-500">観測や検査が終わると、根拠付きの記録が追加されます。</p>}</section>
    {!!data?.runs.some((run) => run.actualCostYen === null) && <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">費用の照合</h2><p className="mt-2 text-sm text-slate-500">提供元の請求記録と照合した実費を記録します。結果不明の処理を再実行する操作ではありません。</p>{data.runs.filter((run) => run.actualCostYen === null && run.outcome !== 'running').map((run) => <form className="mt-4 flex flex-wrap items-end gap-3" key={run.id} onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); void command({ action: 'settle_cost', runId: run.id, actualCostYen: Number(values.get('cost')), billingReference: String(values.get('reference')) }, '実費の照合記録を保存しました。') }}><p className="w-full text-xs text-slate-500">{run.providerReceipt || run.id} / 予約 {money(run.reservedCostYen)}</p><label className="text-sm">実費（円）<input className={fieldClass} name="cost" type="number" min={0} max={1_000_000} step={1} required /></label><label className="text-sm">請求記録の参照<input className={fieldClass} name="reference" minLength={3} maxLength={200} required /></label><button className={buttonClass} type="submit" disabled={busy}>照合を記録</button></form>)}</section>}
  </div>
}
