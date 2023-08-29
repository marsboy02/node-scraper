import * as dotenv from "dotenv";

dotenv.config();

export const {
    listUrl,
    pageUrl,
    consumerInterval,
    visitedQueueThreshold,
    producerCount,
    crawlType,
    redisHost,
    redisPort,
} = {
    listUrl: process.env.LIST_URL + process.env.CRAWL_TYPE,
    pageUrl: process.env.PAGE_URL + process.env.CRAWL_TYPE,
    consumerInterval: +process.env.CONSUMER_INTERVAL,
    visitedQueueThreshold: +process.env.VISITED_QUEUE_THRESHOLD,
    producerCount: +process.env.PRODUCER_COUNT,
    crawlType: process.env.CRAWL_TYPE,
    redisHost: process.env.REDIS_HOST,
    redisPort: +process.env.REDIS_PORT,
};
