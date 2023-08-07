import Redis from "ioredis";
import * as dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

// environment
dotenv.config();
const pageUrl = process.env.PAGE_URL + process.env.CRAWL_TYPE;
const consumerInterval = +process.env.CONSUMER_INTERVAL;
const visitedQueueThreshold  = +process.env.VISITED_QUEUE_THRESHOLD
const crawlType = process.env.CRAWL_TYPE
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
})

// #1 Read Urls in Crawl Queue
async function ReadQueuedUrls(){
    const index = await redis.lpop('crawl_queue_' + crawlType);
    console.log(index);
    await QueueContainsUrls(index);
}

// #2 Visited Queue Already Contains Url?
async function QueueContainsUrls(index){
    const isMember = await redis.lpos('visited_queue_' + crawlType, index);
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
    await redis.rpush('visited_queue_' + crawlType, index);
}

// #5 Visited Urls Exceeds Threshold?
async function VisitedUrlsExceedsThreshold() {
    const visitedQueueLength = await redis.llen('visited_queue_' + crawlType);
    if (visitedQueueLength > visitedQueueThreshold) { await redis.lpop('visited_queue_' + crawlType) }
}

const interval = setInterval(async () => {
    await ReadQueuedUrls()
    const message = `컨슈머 일 하는 중: ${new Date().toISOString()}`;
}, consumerInterval);

function extractedPageWithIndex($) {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const detail = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span').text();
    console.log('title: ', title);
    console.log('detail: ', detail);
}
