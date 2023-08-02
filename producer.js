import { parentPort } from "worker_threads";
import axios from "axios";
import * as cheerio from "cheerio";
import Redis from "ioredis";
import * as dotenv from "dotenv";

// 워커 스레드에서 실행되는 코드
console.log('프로듀서 워커 시작');

// environment
dotenv.config();
const listUrl = process.env.LIST_URL;
const producerCount = +process.env.PRODUCER_COUNT;
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
})

Producer(listUrl);

function Producer(listUrl) {
    axios.get(listUrl)
        .then(async response => {
            const html = response.data;
            const $ = cheerio.load(html);
            for (let i = 1; i < producerCount; i++) {
                const index = extractIndexWithHtml(i, $);
                await redis.rpush('crawl_queue', index);
            }
        }).catch(error => {
        console.error('Error in #0 CrawlUrls', error);
    });
}

function extractIndexWithHtml(i, $) {
    const element = '#contents > ul > li:nth-child(' + i + ') > div > div > div.ti > a'
    const title = $(element).attr('href');
    const regex = /javascript:fnView\('(\d+)', '(\d+)'\);/;
    const result = title.match(regex);
    return result[2];
}

parentPort.on('message', (message) => {
    if (message === 'stop') {
        clearInterval(interval);
        console.log('프로듀서 워커 종료');
        process.exit(0);
    }
});
