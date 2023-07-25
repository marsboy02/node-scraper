import axios from "axios";
import * as cheerio from "cheerio"
const redis = require('redis');

const url = "https://www.uos.ac.kr/korNotice/list.do?list_id=FA1";
const count = 10;

const client = redis.createClient();
client.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

axios.get(url)
.then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    for (let i = 1; i < count; i++) {
        const element = '#contents > ul > li:nth-child('+ i +') > div > div > div.ti > a'
        const title = $(element).attr('href');

        const regex = /javascript:fnView\('(\d+)', '(\d+)'\);/;
        const result = title.match(regex);
        const key = result[1];
        const value = result[2];
        client.set(key,
            value,
            (err, reply) => {
                if (err) {
                    console.error('Error saving data to Redis:', err);
                } else {
                    console.log(`Data saved to Redis with key: ${i}`);
                }
            })
    }
}).catch(error => {
console.error('Error fetching data: ', error);
});