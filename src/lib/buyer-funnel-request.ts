import { createHash } from 'node:crypto'

const buckets=new Map<string,{start:number;count:number}>()
export function allowFunnelRequest(headers:Headers,now=Date.now()) {
  const address=(headers.get('x-vercel-forwarded-for')||headers.get('x-forwarded-for')||'local').split(',')[0].trim()
  const key=createHash('sha256').update(address).digest('hex')
  const b=buckets.get(key)
  if(b && now-b.start<60000){b.count++;return b.count<=120}
  if(buckets.size>=5000){for(const [id,old] of buckets)if(now-old.start>=60000)buckets.delete(id);if(buckets.size>=5000)return false}
  buckets.set(key,{start:now,count:1});return true
}
export async function boundedFunnelBody(request:Request):Promise<string|null> {
  if(Number(request.headers.get('content-length'))>1024)return null
  if(!request.body)return ''
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return null}chunks.push(value)}return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))}
  catch{return null}finally{reader.releaseLock()}
}
