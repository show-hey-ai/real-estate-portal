'use client'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { funnelCopy, catalogFingerprint, type FunnelField } from '@/lib/buyer-funnel-copy'
import { variantSchema, type FunnelVariant } from '@/lib/buyer-funnel-policy'

type Assignment={variant:FunnelVariant;tracking:boolean;experiment?:string;assignment?:string;hash?:string}
const context=createContext<Assignment>({variant:'original',tracking:false})
function recordFunnel(event:'exposure'|'click'|'submit',surface:FunnelField,assignment:Assignment) {
  if(navigator.doNotTrack==='1' || !assignment.tracking || !assignment.assignment || !assignment.hash) return
  const value=new URLSearchParams(window.location.search).get('utm_campaign')||''
  const campaign=/^[a-zA-Z0-9_.:-]{1,100}$/.test(value)?value:''
  void fetch('/api/analytics/funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,surface,campaign,assignment:assignment.assignment,variant:assignment.variant,hash:assignment.hash}),keepalive:true}).catch(()=>{})
}
export function useBuyerFunnelRecord(){const assignment=useContext(context);return (event:'submit',surface:FunnelField)=>recordFunnel(event,surface,assignment)}
export function useBuyerFunnelHeaders():Record<string,string>{const a=useContext(context);return a.tracking&&a.assignment?{'x-ziyou-funnel-assignment':a.assignment}: {}}
export function BuyerFunnelProvider({children}:{children:ReactNode}) {
  const pathname=usePathname(), [assignment,setAssignment]=useState<Assignment>({variant:'original',tracking:false})
  useEffect(()=>{
    if(pathname.startsWith('/admin')||pathname.startsWith('/preview')||pathname.startsWith('/api')) return
    let active=true
    void fetch('/api/analytics/funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'assignment',enroll:['/','/match','/register'].includes(pathname)})}).then(r=>r.json()).then(data=>{
      if(active && data.catalog===catalogFingerprint && variantSchema.safeParse(data.variant).success) setAssignment({variant:data.variant,tracking:data.tracking===true,experiment:typeof data.experiment==='string'?data.experiment:undefined,assignment:data.assignment,hash:data.hash})
    }).catch(()=>{if(active) setAssignment({variant:'original',tracking:false})})
    return ()=>{active=false}
  },[pathname])
  return <context.Provider value={assignment}>{children}</context.Provider>
}
export function FunnelText({field,baseline}:{field:FunnelField;baseline:string}) {
  const assignment=useContext(context),locale=useLocale(),ref=useRef<HTMLSpanElement>(null)
  const protectedCopy=baseline!==funnelCopy(locale,'original')[field]
  const tracking=assignment.tracking&&!protectedCopy
  useEffect(()=>{
    if(!tracking || !ref.current) return
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)) {recordFunnel('exposure',field,assignment);observer.disconnect()}
    },{threshold:0.5})
    observer.observe(ref.current)
    const action=ref.current.closest('a,button')
    const clicked=()=>recordFunnel('click',field,assignment)
    action?.addEventListener('click',clicked)
    return ()=>{observer.disconnect();action?.removeEventListener('click',clicked)}
  },[tracking,assignment,field])
  return <span ref={ref} data-funnel-field={field}>{protectedCopy?baseline:funnelCopy(locale,assignment.variant)[field]}</span>
}
