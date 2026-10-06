'use client'
import { useEffect,useState } from 'react'
import { type FunnelState,type ArmMetrics,type FunnelVariant } from '@/lib/buyer-funnel-policy'
type Data={state:FunnelState;active:boolean;metrics:Record<FunnelVariant,ArmMetrics>;campaigns:{campaign:string;metrics:Record<FunnelVariant,ArmMetrics>}[];decisions:{title:string;content:unknown}[]}
const names={original:'従来の表現',criteria:'エリア・予算を重視',question:'相談しやすさを重視'}
export function BuyerFunnelConsole() {
  const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function load(){try{const r=await fetch('/api/admin/autonomy/funnel');const v=await r.json();if(!r.ok)throw new Error(v.error);setData(v);setError('')}catch(e){setError(e instanceof Error?e.message:'取得できません')}}
  useEffect(()=>{void load()},[])
  async function configure(change:{enabled?:boolean;manual?:FunnelVariant|null}) {
    if(!data)return;setBusy(true)
    try{const r=await fetch('/api/admin/autonomy/funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:data.state.revision,...change})});if(!r.ok)throw new Error('設定を保存できません。再読込してください。');await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <section className="mx-auto my-8 max-w-7xl rounded-xl border bg-white p-6" data-testid="buyer-funnel-console">
    <h2 className="text-xl font-bold">買主集客の自律改善</h2>
    <p className="mt-2 text-sm text-muted-foreground">表示 → クリック → 登録完了 → 実際の問い合わせを比較します。WhatsAppを開いただけでは問い合わせに数えません。</p>
    {error&&<p className="mt-3 text-red-700" role="alert">{error}</p>}
    {data&&<><p className="my-4 font-semibold">{!data.active?'停止中':data.state.manual?'手動設定を保持':data.state.closedAt?'結果の確定待ち':data.state.challenger?'比較データを収集中':'比較完了・採用した表現を使用'}</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['表現','表示人数','クリック','登録操作','登録完了','問い合わせ'].map(x=><th key={x} className="border-b p-2">{x}</th>)}</tr></thead><tbody>{Object.entries(data.metrics).map(([v,m])=><tr key={v}><td className="p-2">{names[v as FunnelVariant]}{v===data.state.incumbent?'（現在の採用案）':''}</td>{[m.visitors,m.clicks,m.submissions,m.registrations,m.consultations].map((n,i)=><td key={i} className="p-2">{n}</td>)}</tr>)}</tbody></table></div>
      <p className="my-4 text-sm text-muted-foreground">各案200人以上・最低14日間の比較後、24時間の問い合わせ期間を待ちます。差が明確な場合だけ自動採用。データ不足の場合は継続します。追加AI費用：0円。</p>
      <div className="flex flex-wrap items-center gap-3"><button className="rounded border px-4 py-2" disabled={busy} onClick={()=>configure({enabled:!data.state.enabled})}>{data.state.enabled?'自律改善を停止':'自律改善を再開'}</button><label>表示を固定： <select className="rounded border p-2" disabled={busy} value={data.state.manual||''} onChange={e=>configure({manual:e.target.value as FunnelVariant||null})}><option value="">自動比較・採用</option>{Object.entries(names).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><button className="rounded border px-4 py-2" onClick={()=>void load()}>再読込</button></div>
      <h3 className="mb-2 mt-6 font-semibold">投稿・流入元の比較</h3><p className="text-sm text-muted-foreground">投稿リンクの utm_campaign ごとに、実際の到達と問い合わせを集計。投稿の自動送信は含みません。</p>
      {data.campaigns.map(c=>{const ms=Object.values(c.metrics);return <p className="mt-2 text-sm" key={c.campaign}>{c.campaign}：表示 {ms.reduce((a,m)=>a+m.visitors,0)}人 ／ 問い合わせ {ms.reduce((a,m)=>a+m.consultations,0)}件</p>})}
      <h3 className="mb-2 mt-6 font-semibold">自動採用の履歴</h3>{data.decisions.length?data.decisions.map((d,i)=><p key={i} className="text-sm">{d.title}</p>):<p className="text-sm text-muted-foreground">まだ効果の判定・自動採用は行われていません。</p>}
    </>}
  </section>
}
