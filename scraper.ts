import axios from "axios";
import Redis from 'ioredis';
import * as cheerio from "cheerio"
import * as dotenv from 'dotenv';



// environment
dotenv.config();
const baseUrl = process.env.BASE_URL;
const producerCount = +process.env.PRODUCER_COUNT;
const consumerCount = +process.env.CONSUMER_COUNT;
const visitedQueueThreshold = +process.env.VISITED_QUEUE_THRESHOLD
const redis = new Redis({
    port: +process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
})

// #0 Crawl Urls
async function CrawlUrls(baseUrl) {
    axios.get(baseUrl)
        .then(async response => {
            const html = response.data;
            const $ = cheerio.load(html);
            for (let i = 1; i < producerCount; i++) {
                const element = '#contents > ul > li:nth-child('+ i +') > div > div > div.ti > a'
                const title = $(element).attr('href');
                const regex = /javascript:fnView\('(\d+)', '(\d+)'\);/;
                const result = title.match(regex);
                const index = result[2];
                await redis.rpush('crawl_queue', index);
            }
        }).catch(error => {
        console.error('Error in #0 CrawlUrls', error);
    });
}


// #1 Read Queued Urls
async function ReadQueuedUrls() {
    const index = await redis.lpop('crawl_queue');
    await QueueContainsUrls(index);
}

// #2 Queue Contains Urls?
async function QueueContainsUrls(index: string) {
    const isMember = await redis.lpos('visited_queue', index);
    if (isMember == null && index) {
        await CrawlPageAndQueueUrls(index);
    }
}

// #3 Crawl Page and Queue Urls
async function CrawlPageAndQueueUrls(index: string) {
    const fullUrl = 'https://www.uos.ac.kr/korNotice/view.do?list_id=FA1' + '&seq=' + index;
    await axios.get(fullUrl)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
            const detail = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span').text();
            console.log('title: ', title);
            console.log('detail: ', detail);
            // 웹훅 쏘는 지점
        }).catch(error => {
            console.error('Error fetching data: ', error);
    });
    await CompleteCrawl(index);
}

// #4 Complete Crawl and Webhook
async function CompleteCrawl(index: string) {
    await VisitedUrlsExceedsThreshold();
    await redis.rpush('visited_queue', index);
}

// #5 Visited Urls Exceeds Threshold?
async function VisitedUrlsExceedsThreshold() {
    const visitedQueueLength = await redis.llen('visited_queue');
    if (visitedQueueLength > visitedQueueThreshold) { await redis.lpop('visited_queue') }
}

async function Consumer() {
    for (let i = 0; i < consumerCount; i++) { await ReadQueuedUrls() }
}

function main() {
    CrawlUrls(baseUrl);
    setTimeout(() => Consumer(), 1250);
}

main();
