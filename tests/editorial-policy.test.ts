import assert from 'node:assert/strict'
import test from 'node:test'
import { articleLocalesSchema,generateArticleContent,type ArticleSource } from '../src/lib/autonomy/article-content'
import { RESEARCH_ARTICLE_VERSION,editorialHash,researchArticleIsCurrent,compareEditorialMetrics } from '../src/lib/autonomy/editorial-policy'

const rows:ArticleSource[]=[10_000_000,20_000_000,30_000_000].map((p,i)=>({id:`source-${i}`,city:'目黒区',propertyType:'区分マンション',price:BigInt(p),buildingArea:40,builtYear:2000,updatedAt:new Date('2026-10-05T00:00:00Z')}))
const now=new Date('2026-10-05T00:00:00Z')
const refs=[{title:'Official source',url:'https://www.reins.or.jp/buying/'}]
const locales=generateArticleContent('目黒区',rows,now)
for(const value of Object.values(locales)){value.references=refs;value.hero={url:'/images/articles/japan-property-guide-3f0c81e9595b.webp',alt:'An editorial property comparison illustration',caption:'Compare asking prices and listed property facts.'}}
const article={slug:'japan-buying-process-guide',version:RESEARCH_ARTICLE_VERSION,sourceHash:'a'.repeat(64),sourceIds:[],locales}
const record={verification:'verified',content:{slug:article.slug,sourceHash:article.sourceHash,contentHash:editorialHash(locales),verifiedAt:'2026-10-04T00:00:00Z',validUntil:'2026-10-11T00:00:00Z',references:refs}}

test('reviewed sourced article works without inventory; changed content or source does not',()=>{
 assert.equal(researchArticleIsCurrent(article,record,now),true)
 assert.equal(researchArticleIsCurrent({...article,sourceHash:'b'.repeat(64)},record,now),false)
 assert.equal(researchArticleIsCurrent({...article,locales:{...locales,ja:{...locales.ja,title:'Edited by operator'}}},record,now),false)
 assert.equal(researchArticleIsCurrent({...article,sourceIds:['private-listing']},record,now),false)
 assert.equal(researchArticleIsCurrent({...article,version:'unknown'},record,now),false)
 assert.equal(researchArticleIsCurrent(article,undefined,now),false)
 assert.equal(researchArticleIsCurrent(article,{...record,verification:'unverified'},now),false)
 assert.equal(researchArticleIsCurrent(article,{...record,content:{...record.content,references:[{title:'Different source',url:'https://www.reins.or.jp/qa/'}]}},now),false)
 assert.equal(researchArticleIsCurrent({...article,locales:null},{...record,content:{...record.content,contentHash:editorialHash(null)}},now),false)
})
test('expired, future or overlong source reviews fail closed',()=>{
 assert.equal(researchArticleIsCurrent(article,record,new Date('2026-10-11T00:00:00Z')),false)
 for(const patch of [{verifiedAt:'2026-10-06T00:00:00Z'},{validUntil:'2026-10-12T00:00:00Z'},{validUntil:'2026-10-03T00:00:00Z'}])assert.equal(researchArticleIsCurrent(article,{...record,content:{...record.content,...patch}},now),false)
})
test('article references and images reject unreviewed destinations and path traversal',()=>{
 for(const url of ['https://www.reins.or.jp.evil.test/buying/','http://www.reins.or.jp/buying/','https://user:pw@www.reins.or.jp/buying/','https://example.com/'])assert.equal(articleLocalesSchema.safeParse({...locales,ja:{...locales.ja,references:[{title:'Bad',url}]}}).success,false)
 for(const url of ['/images/articles/../secret.png','https://example.com/photo.png','/images/properties/fake.png'])assert.equal(articleLocalesSchema.safeParse({...locales,ja:{...locales.ja,hero:{...locales.ja.hero,url}}}).success,false)
 assert.equal(articleLocalesSchema.safeParse(locales).success,true)
})
test('canonical fingerprints retain nested body and image changes',()=>{
 assert.equal(editorialHash({a:1,b:{a:2,b:3}}),editorialHash({b:{b:3,a:2},a:1}))
 assert.notEqual(editorialHash(locales),editorialHash({...locales,en:{...locales.en,hero:{...locales.en.hero,caption:'Changed caption.'}}}))
})
test('sparse metrics do not select a winner; meaningful negative feedback restores baseline',()=>{
 assert.equal(compareEditorialMetrics({views:1,onwardVisits:1},{views:10,onwardVisits:1}),'insufficient_data')
 assert.equal(compareEditorialMetrics({views:1000,onwardVisits:300},{views:1000,onwardVisits:50}),'restore_baseline')
 assert.equal(compareEditorialMetrics({views:1000,onwardVisits:50},{views:1000,onwardVisits:300}),'keep_candidate')
 assert.equal(compareEditorialMetrics({views:1000,onwardVisits:100},{views:1000,onwardVisits:105}),'inconclusive')
 assert.throws(()=>compareEditorialMetrics({views:100,onwardVisits:101},{views:100,onwardVisits:1}))
})
