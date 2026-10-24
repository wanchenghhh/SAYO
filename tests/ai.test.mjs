import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInput,validateOutput,resolveConfig,runAI} from '../server/ai.js';
import {createWorker} from '../server/worker.js';
const base={action:'extract',scene:'unclear',story:'领导说整理一下客户情况，尽快给我。'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
test('rejects unsupported actions, scenes and unbounded conversation',()=>{
 assert.throws(()=>validateInput({...base,action:'delete'}));assert.throws(()=>validateInput({...base,scene:'other'}));assert.throws(()=>validateInput({...base,transcript:Array(61).fill({role:'user',text:'hi'})}));
});
test('an unknown leader quote is not fabricated by extraction',()=>{
 const data=validateOutput('extract',{fields:{original:'明天10点交报告',known:'整理客户情况'},questions:[]},validateInput(base));assert.equal(data.fields.original,'');assert.equal(data.fields.existing,'');
});
test('feedback evidence can only quote real user messages',()=>{
 const input=validateInput({...base,action:'feedback',transcript:[{role:'boss',text:'两项都急'},{role:'user',text:'请确认优先级'}]});
 const output=validateOutput('feedback',{summary:'继续练习',improved:'请确认安排',items:[{label:'请求',observation:'明确请求',suggestion:'继续保持',messageIndex:1,evidence:'虚构引文'},{label:'事实',observation:'可以补充',suggestion:'补充影响',messageIndex:0}]},input);
 assert.equal(output.items[0].evidence,'请确认优先级');assert.equal(output.items[1].evidence,null);
});
test('provider configuration never accepts browser supplied destinations or local addresses',()=>{
 assert.throws(()=>resolveConfig({}));assert.throws(()=>resolveConfig({AI_API_KEY:'fake',AI_BASE_URL:'http://127.0.0.1'}));assert.throws(()=>resolveConfig({AI_API_KEY:'fake',AI_BASE_URL:'https://localhost'}));
 assert.equal(resolveConfig({AI_API_KEY:'server-key'},'session-key').key,'session-key');
});
test('real adapter sends JSON request and maps invalid credentials without leaking secrets',async()=>{
 const input=validateInput(base);let request;
 await assert.rejects(runAI(input,{key:'sensitive-test-key',url:'https://api.deepseek.com/chat/completions',model:'test',deepseek:true},async(u,r)=>{request=JSON.parse(r.body);return json({error:'sensitive-test-key'},401);}),e=>!e.message.includes('sensitive-test-key'));
 assert.equal(request.response_format.type,'json_object');assert.equal(request.thinking.type,'disabled');
});
test('adapter rejects malformed, truncated and structurally incomplete output',async()=>{
 const input=validateInput({...base,action:'expression'}),config={key:'test',url:'https://example.test',model:'test'};
 for(const content of ['not json',JSON.stringify({parts:['one']})])await assert.rejects(runAI(input,config,async()=>json({choices:[{message:{content},finish_reason:'stop'}]})));
 await assert.rejects(runAI(input,config,async()=>json({choices:[{message:{content:'{}'},finish_reason:'length'}]})),/未生成完整/);
});
test('endpoints enforce methods, same origin, content type and configuration readiness',async()=>{
 const worker=createWorker();
 const send=(body,headers={})=>worker.fetch(new Request('https://site.test/api/ai',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)}));
 assert.equal((await worker.fetch(new Request('https://site.test/api/ai'))).status,405);
 assert.equal((await send(base,{origin:'https://evil.test'})).status,403);
 assert.equal((await send(base)).status,503);
 assert.equal((await send({...base,scene:'other'})).status,400);
 const status=await(await worker.fetch(new Request('https://site.test/api/status'),{AI_API_KEY:'secret'})).json();assert.equal(status.configured,true);assert.ok(!JSON.stringify(status).includes('secret'));
});
test('both scenes pass through all AI actions with the supplied context',async()=>{
 const outputs={extract:{fields:{existing:'A任务明天交',added:'B任务明天交',constraint:'需2天只剩1天',original:'',goal:'确认优先级'},questions:[]},expression:{parts:['对齐目的','说明事实','确认请求'],tip:'先核对事实'},roleplay:{reply:'你希望我确认什么？'},hint:{reply:'想请您确认优先级'},feedback:{summary:'请求清楚',improved:'想请您确认安排',items:[{label:'事实',observation:'有回应',suggestion:'补充事实',messageIndex:0},{label:'请求',observation:'有请求',suggestion:'补充范围',messageIndex:0}]},connect:{ok:true}};
 const seen=[];const worker=createWorker({},async(url,options)=>{const request=JSON.parse(options.body);const context=JSON.parse(request.messages[1].content);seen.push(context);return json({choices:[{message:{content:JSON.stringify(outputs[context.action])},finish_reason:'stop'}]});});
 for(const scene of ['conflict','unclear'])for(const action of Object.keys(outputs)){
  const response=await worker.fetch(new Request('https://site.test/api/ai',{method:'POST',headers:{'content-type':'application/json','x-session-api-key':'test-key'},body:JSON.stringify({...base,scene,action,transcript:[{role:'user',text:'我的回应'}]})}));assert.equal(response.status,200,scene+' '+action);assert.ok((await response.json()).data);
 }
 assert.equal(seen.length,12);
});
