import axios from "axios";
import * as cheerio from "cheerio";
import Redis from "ioredis";
import { PageDto, PageDtoInterface } from "./util/dto";
import {
    listUrl,
    pageUrl,
    consumerInterval,
    visitedQueueThreshold,
    producerCount,
    crawlType,
    redisHost,
    redisPort,
    consumerTTL, webhookUrl,

} from "./util/constants";
import { extractFilesFromHTML, TrimEscapeSequence } from "./util/crawl";
import { triggerWebHook } from "./util/webhook";


const redis: Redis = new Redis({
    host: redisHost,
    port: redisPort,
})

function Produce(listUrl: string, producerCount: number): void  {
    axios.get(listUrl)
        .then(async response => {
            const html = response.data;
            const $ = cheerio.load(html);
            for (let i = 1; i < producerCount; i++) {
                const index: string = extractIndexWithHtml(i, $);
                await redis.rpush('crawl_queue_' + crawlType , index);
            }
        }).catch(error => {
        console.error('Error in #0 Produce', error);
    });
}

function extractIndexWithHtml(i, $): string {
    const element: string = '#contents > ul > li:nth-child(' + i + ') > div > div > div.ti > a'
    const title = $(element).attr('href');
    if (title) {
        const regex: RegExp = /javascript:fnView\('(\d+)', '(\d+)'\);/;
        const index = title.match(regex)[2];
        return index;
    }
}

// #1 Read Urls in Crawl Queue
async function ReadQueuedUrls(): Promise<PageDtoInterface> {
    const index: string = await redis.lpop('crawl_queue_' + crawlType);
    if (index == null) {
        return null
    }
    return await QueueContainsUrls(index);
}

// #2 Visited Queue Already Contains Url?
async function QueueContainsUrls(index): Promise<PageDtoInterface>{
    const isMember: number = await redis.lpos('visited_queue_' + crawlType, index);
    if (isMember == null && index) { return await CrawlPageAndQueueUrls(index); }
}

// #3 Crawl Page and Queue Urls in Visited Queue
async function CrawlPageAndQueueUrls(index): Promise<PageDtoInterface> {
    const fullUrl: string = pageUrl + '&seq=' + index;
    const pageDto: PageDtoInterface = await axios.get(fullUrl)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            return extractedPageWithIndex(fullUrl, $);
        })
    await CompleteCrawl(index);
    return pageDto
}

// #4 Complete Crawl and Webhook
async function CompleteCrawl(index): Promise<void> {
    await VisitedUrlsExceedsThreshold();
    await redis.rpush('visited_queue_' + crawlType, index);
}

// #5 Visited Urls Exceeds Threshold?
async function VisitedUrlsExceedsThreshold(): Promise<void> {
    const visitedQueueLength: number = await redis.llen('visited_queue_' + crawlType);
    if (visitedQueueLength > visitedQueueThreshold) {
        await redis.lpop('visited_queue_' + crawlType)
    }
}

function extractedPageWithIndex(fullUrl: string, $: cheerio.CheerioAPI): PageDtoInterface {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const writer = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(1)').text();
    const department = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(2)').text();
    const date = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(3)').text();
    const files = extractFilesFromHTML($)
    const description = $('#contents > div > div.view-bx > div.vw-con').html()
    return new PageDto(title, writer, department, files, TrimEscapeSequence(description), TrimEscapeSequence(date).substring(0,10), fullUrl)
}

function main(): void {
    // produce
    Produce(listUrl, producerCount);

    // consume
    const interval = setInterval(async () => {
        const pageData: PageDtoInterface = await ReadQueuedUrls();
        if (pageData == null) {
            console.log("queue is empty");
        } else {
            triggerWebHook(webhookUrl, pageData);
        }
    }, consumerInterval);

    setTimeout((): void => {
        console.log("container consume done!")
        clearInterval(interval);
        process.exit(0);
    }, consumerTTL);
}

main();