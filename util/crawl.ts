import axios from "axios/index";
import { crawlType, pageUrl, visitedQueueThreshold } from "../config/constants";
import { PageInterface } from "../dto/page";
import { extractPageWithIndex, getCheerioApiFromResponse } from "./cheerio";
import { getRedis } from "../config/redis";
import Redis from "ioredis";

// redis
const redis: Redis = getRedis();


/**
 * 게시글 목록이 있는 URL을 인자로 전달받아 count 만큼 해당 게시글의 index를 추출하는 함수입니다. 추출된 값을 redis에 전달합니다.
 * @param listUrl
 * @param producerCount
 */
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
/**
 * produce를 통해 레디스 큐에 생성된 index를 기반으로 게시물의 상세 내용을 크롤링합니다.
 */
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
            return extractPageWithIndex(fullUrl, $);
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

