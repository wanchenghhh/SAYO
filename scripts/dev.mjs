import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parseEnv} from 'node:util';
import {createWorker} from '../server/worker.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1';
const server=http.createServer(async(req,res)=>{try{
 const assets={};for(const[name,type]of Object.entries({'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8'}))assets['/'+name]={body:await readFile(path.join(root,'public',name),'utf8'),type};
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>100000){res.writeHead(413);res.end('Input too large');return;}chunks.push(chunk);}
 const method=req.method||'GET';const request=new Request(`http://${req.headers.host}${req.url}`,{method,headers:req.headers,body:['GET','HEAD'].includes(method)?undefined:Buffer.concat(chunks)});
 // Read local configuration per request so a saved key takes effect without restarting.
 const localEnv=await readFile(path.join(root,'.env'),'utf8').then(parseEnv).catch(error=>{if(error.code==='ENOENT')return {};throw error;});
 const response=await createWorker(assets).fetch(request,{...process.env,...localEnv});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'text/plain; charset=utf-8'});res.end('服务暂时异常');}
});
server.listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
