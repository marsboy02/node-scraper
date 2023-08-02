import { Worker, isMainThread, parentPort } from 'worker_threads';

const producer = new Worker('./producer.js');
const consumer = new Worker('./consumer.js');

const threads = new Set();
threads.add(producer);
threads.add(consumer);

for (let worker of threads) {
    worker.on('message', (value) => {
        console.log('워커로부터 ', value);
    })

    worker.on('exit', (value) => {
        threads.delete(worker);
        if (threads.size === 0) {
            console.log('워커 끝~');
        }
    })
}

