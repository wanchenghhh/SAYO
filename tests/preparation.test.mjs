import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import {createWorker} from '../server/worker.js';
import {runAI, resolveConfig, validateInput} from '../server/ai.js';

const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
function client() {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {value:'', addEventListener(event, handler) { this[event] = handler; }});
    return elements.get(selector);
  };
  const context = vm.createContext({
    document:{querySelector:element, getElementById:id=>element('#'+id), querySelectorAll:()=>[]},
    sessionStorage:{getItem:()=>null}, structuredClone,
  });
  vm.runInContext(source.slice(0, source.lastIndexOf("state=fresh('conflict');")), context);
  vm.runInContext(`
    render=()=>{};
    go=step=>{state.step=step;};
    performAI=async(message,fn)=>{await fn();return true;};
    let calls=0, lastPayload;
    aiApi=async action=>{calls++;lastPayload=aiPayload(action);return action==='extract'?
      {fields:{existing:'A项目明天交',added:'B方案明天交',constraint:'无法同时按时完成',goal:'确认优先级',original:'',known:'整理客户情况'},questions:[{key:'delivery',text:'客户情况要做成表格还是报告？',selected:true}]}:
      {parts:['开场','事实','请求']};};
    state=fresh('conflict');bind();
  `, context);
  return {element, run:code=>vm.runInContext(code, context)};
}

test('AI fields prefill; edited fields survive back/continue without another extraction', async()=>{
  const c=client();
  c.element('#story').value='A项目明天交，领导又加了明天交的B方案，怕来不及。';
  await c.element('#start').click();
  assert.equal(c.run('state.step'),1);
  assert.equal(c.run('state.existing'),'A项目明天交');
  assert.match(c.run('prepare()'),/AI 已预填，可修改/);
  for (const [key,value] of Object.entries({existing:'A项目周五交',added:'B方案明天交',constraint:'时间不够',goal:'先保证B方案',preference:'暂时不清楚'})) c.element('#'+key).value=value;
  c.run('savePrep();go(0);');
  await c.element('#start').click();
  assert.equal(c.run('calls'),1);
  assert.equal(c.run('state.existing'),'A项目周五交');
  await c.element('#prepare-next').click();
  assert.equal(c.run('lastPayload.fields.existing'),'A项目周五交');
  assert.equal(c.run('lastPayload.fields.goal'),'先保证B方案');
  c.run('go(0);');
  c.element('#story').value='修改了情况，领导说B方案下周再交，想确认新的安排。';
  await c.element('#start').click();
  assert.equal(c.run('calls'),3);
});

test('unclear scene retains optional questions and works with background but no quote', async()=>{
  const c=client();c.run("state=fresh('unclear');bind();");
  c.element('#story').value='领导让我整理客户情况，但我不知道要做成表格还是报告。';
  await c.element('#start').click();
  assert.equal(c.run('state.questions.length'),5);
  assert.equal(c.run('selectedQuestions().length'),1);
  c.run('state.questions.forEach(q=>{q.selected=false;});state.questions[0].selected=true;');
  c.element('#original').value='';
  c.element('#known').value='需要整理客户情况';
  c.element('#goal').value='确认成果形式';
  c.element('#preference').value='暂时不清楚';
  // These controls are absent in this focused DOM stub, so savePrep preserves question state.
  c.run('document.querySelector=selector=>selector.startsWith("[data-")?null:document.getElementById(selector.slice(1));');
  await c.element('#prepare-next').click();
  assert.equal(c.run('state.step'),2);
  assert.equal(c.run('lastPayload.fields.original'),'');
  assert.equal(c.run('lastPayload.fields.known'),'需要整理客户情况');
});

test('API forwards DeepSeek extraction and filters fabricated quotes', async()=>{
  let payload;
  const worker=createWorker({},async(url,options)=>{
    assert.equal(url,'https://api.deepseek.com/chat/completions');
    payload=JSON.parse(options.body);
    return Response.json({choices:[{message:{content:JSON.stringify({fields:{existing:'A项目',goal:'确认优先级',original:'编造的领导原话'},questions:[]})},finish_reason:'stop'}]});
  });
  const response=await worker.fetch(new Request('http://localhost/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'extract',scene:'conflict',story:'A项目和B方案都要明天交，不知道先做哪一个。'})}),{AI_API_KEY:'test-placeholder'});
  assert.equal(response.status,200);
  assert.equal(payload.model,'deepseek-flash');
  assert.equal(payload.thinking.type,'disabled');
  const {data}=await response.json();
  assert.equal(data.fields.existing,'A项目');
  assert.equal(data.fields.original,'');
});

test('malformed expression retries once with a correction instruction', async()=>{
  let calls=0;
  const input=validateInput({action:'expression',scene:'conflict'});
  const output=await runAI(input,resolveConfig({AI_API_KEY:'test-placeholder'}),async(url,options)=>{
    calls++;
    if(calls===2) assert.match(JSON.parse(options.body).messages[0].content,/上次输出未通过结构校验/);
    return Response.json({choices:[{message:{content:JSON.stringify({parts:calls===1?['只有一段']:['开场','事实','请求']})}}]});
  });
  assert.equal(calls,2);
  assert.equal(output.parts.length,3);
});

test('repeated malformed output stops after two attempts; auth errors do not retry', async()=>{
  const input=validateInput({action:'expression',scene:'conflict'});
  const config=resolveConfig({AI_API_KEY:'test-placeholder'});
  let calls=0;
  await assert.rejects(runAI(input,config,async()=>{
    calls++;
    return Response.json({choices:[{message:{content:'{}'}}]});
  }),{code:'INVALID_AI_OUTPUT'});
  assert.equal(calls,2);
  calls=0;
  await assert.rejects(runAI(input,config,async()=>{calls++;return new Response('',{status:401});}),{code:'UPSTREAM_ERROR'});
  assert.equal(calls,1);
});
