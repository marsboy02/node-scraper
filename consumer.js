import { parentPort } from "worker_threads";
import Redis from "ioredis";
import * as dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

console.log('콘슈머 워커 시작');

// environment
dotenv.config();
const pageUrl = process.env.PAGE_URL;
const consumerInterval = +process.env.CONSUMER_INTERVAL;
const visitedQueueThreshold  = +process.env.VISITED_QUEUE_THRESHOLD
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
})

// #1 Read Urls in Crawl Queue
async function ReadQueuedUrls(){
    const index = await redis.lpop('crawl_queue');
    console.log(index);
    await QueueContainsUrls(index);
}

// #2 Visited Queue Already Contains Url?
async function QueueContainsUrls(index){
    const isMember = await redis.lpos('visited_queue', index);
    if (isMember == null && index) { await CrawlPageAndQueueUrls(index); }
}

// #3 Crawl Page and Queue Urls in Visited Queue
async function CrawlPageAndQueueUrls(index) {
    const fullUrl = pageUrl + '&seq=' + index;
    await axios.get(fullUrl)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            extractedPageWithIndex($);
        }).catch(error => {
            console.error('Error fetching data: ', error);
        });
    await CompleteCrawl(index);
}

// #4 Complete Crawl and Webhook
async function CompleteCrawl(index) {
    await VisitedUrlsExceedsThreshold();
    await redis.rpush('visited_queue', index);
}

// #5 Visited Urls Exceeds Threshold?
async function VisitedUrlsExceedsThreshold() {
    const visitedQueueLength = await redis.llen('visited_queue');
    if (visitedQueueLength > visitedQueueThreshold) { await redis.lpop('visited_queue') }
}

const interval = setInterval(async () => {
    await ReadQueuedUrls()
    const message = `컨슈머 일 하는 중: ${new Date().toISOString()}`;
    parentPort.postMessage(message); // 메시지를 메인 스레드로 보냄
}, consumerInterval);

function extractedPageWithIndex($) {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const detail = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span').text();
    console.log('title: ', title);
    console.log('detail: ', detail);
}

// 워커 스레드 종료 시 처리
parentPort.on('message', (message) => {
    if (message === 'stop') {
        clearInterval(interval);
        console.log('콘슈머 워커 종료');
        process.exit(0);
    }
});
