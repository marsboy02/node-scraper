import axios from "axios/index";
import { crawlType, pageUrl, visitedQueueThreshold } from "../config/constants";
import { PageInterface } from "../dto/page";
import { extractedPageWithIndex, getCheerioApiFromResponse } from "./cheerio";
import { getRedis } from "../config/redis";


const redis = getRedis();

export function Produce(listUrl: string, producerCount: number): void  {
    axios.get(listUrl)
        .then(async response => {
            const $ = getCheerioApiFromResponse(response)
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
export async function ReadQueuedUrls(): Promise<PageInterface> {
    const index: string = await redis.lpop('crawl_queue_' + crawlType);
    if (index == null) {
        return null
    }
    return await QueueContainsUrls(index);
}

// #2 Visited Queue Already Contains Url?
async function QueueContainsUrls(index): Promise<PageInterface>{
    const isMember: number = await redis.lpos('visited_queue_' + crawlType, index);
    if (isMember == null && index) { return await CrawlPageAndQueueUrls(index); }
}

// #3 Crawl Page and Queue Urls in Visited Queue
async function CrawlPageAndQueueUrls(index): Promise<PageInterface> {
    const fullUrl: string = pageUrl + '&seq=' + index;
    const pageDto: PageInterface = await axios.get(fullUrl)
        .then(response => {
            const $ = getCheerioApiFromResponse(response)
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

