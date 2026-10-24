// Local acceptance server only. This file is never bundled or deployed.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createWorker} from '../server/worker.js';
const assets={};for(const[n,t]of Object.entries({'index.html':'text/html; charset=utf-8','style.css':'text/css','app.js':'text/javascript'}))assets['/'+n]={body:await readFile(new URL('../public/'+n,import.meta.url),'utf8'),type:t};
assets['/index.html'].body=assets['/index.html'].body.replace('每一次开口，都多一点底气。','本地验收服务 · 模型响应为测试夹具');
const fakeFetch=async(url,options)=>{
 if(options.headers.authorization==='Bearer qa-invalid-key')return new Response('{}',{status:401});
 const request=JSON.parse(options.body),p=JSON.parse(request.messages[1].content),unclear=p.scene==='unclear';
 const data={
  extract:{empathy:'先理清事实，再一起准备开口。',fields:unclear?{original:'你整理一下客户情况，尽快给我。',known:'要求整理客户情况',goal:'确认交付物、范围和时间'}:{existing:'A 项目明天下午交付',added:'B 方案明天完成',constraint:'合计还需2天，目前只剩1天',goal:'请领导确认优先级'},questions:unclear?[{key:'delivery',text:'需要表格还是分析报告？',selected:true},{key:'scope',text:'需要覆盖全部客户还是重点客户？',selected:true},{key:'time',text:'最晚哪天几点需要？',selected:true}]:[]},
  expression:{parts:[p.tone==='简洁'?'想请您确认一下安排。':'我想和您对齐一下工作安排。',unclear?'您说整理一下客户情况，我想确认一下理解。':'A项目和B方案明天都要交，时间不够。',unclear?p.questions.map(q=>q.text).join('\n'):'想请您确认优先级，另一项是否可以调整时间？'],tip:'事实由你核对，表达按自己的习惯调整。'},
  roleplay:{reply:unclear?'你先说说，最需要确认哪些要求？':'两项都急，你建议怎么安排？'},
  hint:{reply:unclear?'为了避免做偏，想确认交付物、范围和截止时间。':'时间只剩一天，想请您确认先做哪项，另一项是否可以调整？'},
  feedback:{summary:'你已经开始提出明确请求。',items:[{label:unclear?'确认问题':'时间影响',observation:'表达中有具体信息。',suggestion:'下一次把请求说得更具体。',messageIndex:p.transcript.findIndex(m=>m.role==='user')},{label:'明确请求',observation:'已经提出了希望确认的内容。',suggestion:'离开沟通前复述实际安排。',messageIndex:p.transcript.findIndex(m=>m.role==='user')}],improved:'我想和您确认一下具体安排，避免后续做偏。'},connect:{ok:true}
 }[p.action];
 return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)},finish_reason:'stop'}]}),{headers:{'content-type':'application/json'}});
};
const worker=createWorker(assets,fakeFetch);
http.createServer(async(req,res)=>{const chunks=[];for await(const c of req)chunks.push(c);const r=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:req.method==='POST'?Buffer.concat(chunks):undefined}),{AI_API_KEY:'acceptance-test-only'});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}).listen(8766,'127.0.0.1',()=>console.log('Acceptance fixture: http://127.0.0.1:8766'));
