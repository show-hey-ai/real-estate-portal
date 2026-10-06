import { buyerViewer, buyerFailure } from '@/lib/buyer-matching-http'
import { rateBuyer, refreshBuyer, buyerProfile } from '@/lib/buyer-matching-server'
import { feedbackSchema } from '@/lib/buyer-matching-policy'
import { ChatError, chatMutation, chatResponse } from '@/lib/private-chat-server'
import { allowFunnelRequest } from '@/lib/buyer-funnel-request'
export const runtime='nodejs'
export const maxDuration=30
export async function POST(request:Request){try{
  if(!allowFunnelRequest(request.headers))throw new ChatError(429,'RATE_LIMIT')
  const user=await buyerViewer(),input=feedbackSchema.safeParse(await chatMutation(request))
  if(!input.success)throw new ChatError(400,'INVALID_INPUT')
  await rateBuyer(user.id,input.data)
  await refreshBuyer(user.id).catch(()=>null)
  return chatResponse({profile:await buyerProfile(user.id)})
}catch(e){return buyerFailure(e)}}
