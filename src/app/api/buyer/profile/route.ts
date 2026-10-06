import { buyerViewer, buyerFailure } from '@/lib/buyer-matching-http'
import { z } from 'zod'
import { buyerProfile, saveBuyer, removeBuyer, refreshBuyer } from '@/lib/buyer-matching-server'
import { criteriaSchema } from '@/lib/buyer-matching-policy'
import { ChatError, chatMutation, chatResponse } from '@/lib/private-chat-server'
import { allowFunnelRequest } from '@/lib/buyer-funnel-request'
export const runtime='nodejs'
export const maxDuration=30
const saveSchema=z.object({profileId:z.uuid().nullable(),revision:z.number().int().min(0),criteria:criteriaSchema}).strict()
const removeSchema=z.object({profileId:z.uuid(),revision:z.number().int().min(1)}).strict()
export async function GET(request:Request){try{if(!allowFunnelRequest(request.headers))throw new ChatError(429,'RATE_LIMIT');const user=await buyerViewer();return chatResponse({profile:await buyerProfile(user.id)})}catch(e){return buyerFailure(e)}}
export async function POST(request:Request){try{
  if(!allowFunnelRequest(request.headers))throw new ChatError(429,'RATE_LIMIT')
  const user=await buyerViewer(),input=saveSchema.safeParse(await chatMutation(request))
  if(!input.success)throw new ChatError(400,'INVALID_INPUT')
  await saveBuyer(user.id,input.data.revision,input.data.criteria,input.data.profileId)
  // Save is durable even if an independent suggestion refresh needs retrying.
  const refresh=await refreshBuyer(user.id).catch(()=>({refreshed:false,incomplete:true}))
  return chatResponse({profile:await buyerProfile(user.id),refresh})
}catch(e){return buyerFailure(e)}}
export async function DELETE(request:Request){try{
  if(!allowFunnelRequest(request.headers))throw new ChatError(429,'RATE_LIMIT')
  const user=await buyerViewer(),input=removeSchema.safeParse(await chatMutation(request))
  if(!input.success)throw new ChatError(400,'INVALID_INPUT')
  await removeBuyer(user.id,input.data.revision,input.data.profileId);return chatResponse({removed:true})
}catch(e){return buyerFailure(e)}}
