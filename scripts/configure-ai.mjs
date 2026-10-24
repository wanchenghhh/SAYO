import {readFile, writeFile, chmod} from 'node:fs/promises';
import readline from 'node:readline/promises';
import {Writable} from 'node:stream';

if (!process.stdin.isTTY) {
  console.error('请在本机终端中运行 npm run configure，或直接编辑 .env 文件。');
  process.exit(1);
}
const filename = new URL('../.env', import.meta.url);
const output = new Writable({write(_chunk, _encoding, done) { done(); }});
const prompt = readline.createInterface({input:process.stdin, output, terminal:true});
process.stdout.write('粘贴 API Key 后按回车（输入不显示，仅保存在本机 .env）：');
let key;
try { key = (await prompt.question('')).trim(); }
finally { prompt.close(); process.stdout.write('\n'); }
if (!key || /[\r\n\0]/.test(key)) {
  console.error('未保存，请输入有效的 API Key。');
  process.exit(1);
}
let source;
try { source = await readFile(filename, 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') throw error; source = await readFile(new URL('../.env.example', import.meta.url), 'utf8'); }
const line = 'AI_API_KEY=' + JSON.stringify(key);
source = /^AI_API_KEY=.*$/m.test(source) ? source.replace(/^AI_API_KEY=.*$/m, () => line) : source + '\n' + line + '\n';
await writeFile(filename, source, {mode:0o600});
await chmod(filename, 0o600);
console.log('密钥已保存。本地服务无需重启，刷新网页即可使用。');
