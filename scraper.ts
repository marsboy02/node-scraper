import axios from "axios";
import Redis from 'ioredis';
import * as cheerio from "cheerio"
import * as dotenv from 'dotenv';


// environment
dotenv.config();
const listUrl: string = process.env.LIST_URL;
const pageUrl: string = process.env.PAGE_URL;
const producerCount: number = +process.env.PRODUCER_COUNT;
const consumerCount: number  = +process.env.CONSUMER_COUNT;
const visitedQueueThreshold: number  = +process.env.VISITED_QUEUE_THRESHOLD
const redis: Redis = new Redis({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
})


/**
 * take index in list page
 */
function extractIndexWithHtml(i: number, $): string {
    const element: string = '#contents > ul > li:nth-child(' + i + ') > div > div > div.ti > a'
    const title = $(element).attr('href');
    const regex: RegExp = /javascript:fnView\('(\d+)', '(\d+)'\);/;
    const result = title.match(regex);
    return result[2];
}

/**
 * take detail in each page
 */
function extractedPageWithIndex($): void {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const detail = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span').text();
    console.log('title: ', title);
    console.log('detail: ', detail);
}


/**
 * Producer
 * Crawl Urls into Crawl Queue
 */
function Producer(listUrl): void {
    axios.get(listUrl)
        .then(async response => {
            const html = response.data;
            const $: cheerio.CheerioAPI = cheerio.load(html);
            for (let i = 1; i < producerCount; i++) {
                const index: string = extractIndexWithHtml(i, $);
                await redis.rpush('crawl_queue', index);
            }
        }).catch(error => {
        console.error('Error in #0 CrawlUrls', error);
    });
}


/**
 * Consumer
 * Read Queued Urls
 */
async function Consumer(): Promise<void> {
    for (let i = 0; i < consumerCount; i++) { await ReadQueuedUrls() }
}


// #1 Read Urls in Crawl Queue
async function ReadQueuedUrls(): Promise<void> {
    const index: string = await redis.lpop('crawl_queue');
    await QueueContainsUrls(index);
}

// #2 Visited Queue Already Contains Url?
async function QueueContainsUrls(index: string): Promise<void> {
    const isMember = await redis.lpos('visited_queue', index);
    if (isMember == null && index) { await CrawlPageAndQueueUrls(index); }
}

// #3 Crawl Page and Queue Urls in Visited Queue
async function CrawlPageAndQueueUrls(index: string): Promise<void> {
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
async function CompleteCrawl(index: string): Promise<void> {
    await VisitedUrlsExceedsThreshold();
    await redis.rpush('visited_queue', index);
}

// #5 Visited Urls Exceeds Threshold?
async function VisitedUrlsExceedsThreshold(): Promise<void> {
    const visitedQueueLength: number = await redis.llen('visited_queue');
    if (visitedQueueLength > visitedQueueThreshold) { await redis.lpop('visited_queue') }
}

function main(): void {
    Producer(listUrl);
    setTimeout(() => Consumer(), 1250);
}

main();
