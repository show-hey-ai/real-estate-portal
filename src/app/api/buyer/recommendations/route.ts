import { buyerViewer, buyerFailure } from '@/lib/buyer-matching-http'
import { buyerDashboard, refreshBuyer } from '@/lib/buyer-matching-server'
import { ChatError, chatResponse } from '@/lib/private-chat-server'
import { allowFunnelRequest } from '@/lib/buyer-funnel-request'
export const runtime='nodejs'
export const maxDuration=30
export async function GET(request:Request){try{
  if(!allowFunnelRequest(request.headers))throw new ChatError(429,'RATE_LIMIT')
  const user=await buyerViewer()
  const refresh=await refreshBuyer(user.id)
  return chatResponse({...await buyerDashboard(user.id),incomplete:refresh.incomplete,automationActive:!('paused' in refresh)})
}catch(e){return buyerFailure(e)}}
