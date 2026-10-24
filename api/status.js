import {createWorker} from '../server/worker.js';
const worker = createWorker();
export function GET(request) {
  return worker.fetch(request, process.env);
}
