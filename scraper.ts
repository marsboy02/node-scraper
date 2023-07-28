import axios from "axios";
import * as cheerio from "cheerio"
import Redis from 'ioredis';
// const redis = require('redis');
const redis = new Redis({})

const baseUrl = "https://www.uos.ac.kr/korNotice/list.do?list_id=FA1";
const count = 10;

async function ReadQueuedUrls() {
    const index = await redis.lpop('crawl_queue');
    await QueueContainsUrls(index);
}

async function QueueContainsUrls(index: string) {
    const isMember = await redis.lpos('visited_queue', index);
    if (!isMember && index) {
        await CrawlPageAndQueueUrls(index);
    }
}

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

async function CompleteCrawl(index: string) {
    console.log(index);
    await redis.rpush('visited_queue', index);
}

async function CrawlUrls(baseUrl) {
    axios.get(baseUrl)
        .then(async response => {
            const html = response.data;
            const $ = cheerio.load(html);
            for (let i = 1; i < count; i++) {
                const element = '#contents > ul > li:nth-child('+ i +') > div > div > div.ti > a'
                const title = $(element).attr('href');
                const regex = /javascript:fnView\('(\d+)', '(\d+)'\);/;
                const result = title.match(regex);
                const key = result[1];
                const value = result[2];
                await redis.rpush('crawl_queue', result[2]);
            }
        }).catch(error => {
        console.error('Error fetching data: ', error);
    });
}

async function main() {
    await CrawlUrls(baseUrl);
    await ReadQueuedUrls();
    await ReadQueuedUrls();
    await ReadQueuedUrls();
    await ReadQueuedUrls();
    await ReadQueuedUrls();
}

main();
