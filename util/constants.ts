import * as dotenv from "dotenv";

dotenv.config();

export const {
    listUrl,
    pageUrl,
    consumerInterval,
    consumerTTL,
    visitedQueueThreshold,
    producerCount,
    crawlType,
    redisHost,
    redisPort,
} = {
    listUrl: (process.env.LIST_URL + process.env.CRAWL_TYPE) || "https://www.uos.ac.kr/korNotice/list.do?list_id=" + process.env.CRAWL_TYPE,
    pageUrl: (process.env.PAGE_URL + process.env.CRAWL_TYPE) || "https://www.uos.ac.kr/korNotice/view.do?list_id=" + process.env.CRAWL_TYPE,
    consumerInterval: +process.env.CONSUMER_INTERVAL || 100,
    consumerTTL: +process.env.CONSUMER_TTL || 10000,
    visitedQueueThreshold: +process.env.VISITED_QUEUE_THRESHOLD || 200,
    producerCount: +process.env.PRODUCER_COUNT || 25,
    crawlType: process.env.CRAWL_TYPE,
    redisHost: process.env.REDIS_HOST,
    redisPort: +process.env.REDIS_PORT,
};
