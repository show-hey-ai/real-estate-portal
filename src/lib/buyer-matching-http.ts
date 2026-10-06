import 'server-only'
import { chatViewer, chatFailure, ChatError } from './private-chat-server'
import { BuyerError } from './buyer-matching-server'
export const buyerViewer=chatViewer
export function buyerFailure(error:unknown){return chatFailure(error instanceof BuyerError?new ChatError(error.status,error.code):error)}
