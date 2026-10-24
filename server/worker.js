import { AppError, validateInput, resolveConfig, runAI } from './ai.js';
const security={'x-content-type-options':'nosniff','referrer-policy':'same-origin','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...security,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});}
export function createWorker(assets={},fetcher=(...args)=>globalThis.fetch(...args)){return {async fetch(request,env={}){
 const url=new URL(request.url);
 if(url.pathname==='/api/status'&&request.method==='GET'){
  let baseUrl = env.AI_BASE_URL || 'https://lax.toklens.ai/v1';
  let model = env.AI_MODEL || 'tokennnn/gpt-6-astra';
  try { const parsed = new URL(baseUrl); baseUrl = parsed.hostname; } catch { baseUrl = 'configured service'; }
  return json({configured:!!env.AI_API_KEY?.trim(),storage:'browser',version:'1.3.0',provider:baseUrl === 'lax.toklens.ai' ? (env.AI_PROVIDER_NAME || '比赛方 MAGPIE') : baseUrl === 'api.deepseek.com' ? 'DeepSeek' : baseUrl,model,expiresAt:env.AI_EXPIRES_AT || null});
 }
 if(url.pathname==='/api/ai'){
  if(request.method!=='POST')return json({error:'仅支持 POST 请求。'},405);
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'不允许跨站请求。'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'请使用 JSON 请求。'},415);
  if(Number(request.headers.get('content-length'))>100000)return json({error:'输入过长，请缩短后重试。'},413);
  try{const raw=await request.text();if(raw.length>100000)throw new AppError('输入过长，请缩短后重试。',413);let body;try{body=JSON.parse(raw);}catch{throw new AppError('请求格式错误。');}
   const input=validateInput(body);const config=resolveConfig(env,input.clientConfig);
   const result=await runAI(input,config,fetcher);return json({data:result});
  }catch(e){if(e instanceof AppError)return json({error:e.message,code:e.code},e.status);return json({error:'服务暂时异常，请稍后重试。',code:'SERVER_ERROR'},500);}
 }
 if(url.pathname.startsWith('/api/'))return json({error:'接口不存在。'},404);
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const asset=assets[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('Not found',{status:404,headers:security});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{...security,'content-type':asset.type,'cache-control':'no-cache'}});
}};}
