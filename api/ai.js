import {createWorker} from '../server/worker.js';
const worker = createWorker();
export function POST(request) {
  return worker.fetch(request, process.env);
}
