import axios from "axios";
import * as cheerio from "cheerio"

const url = "https://www.uos.ac.kr/korNotice/list.do?list_id=FA1";
const count = 10;

axios.get(url)
.then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    for (let i = 1; i < count; i++) {
        const element = '#contents > ul > li:nth-child('+ i +') > div > div > div.ti > a'
        const title = $(element).text();
        console.log('title:', title);
    }
}).catch(error => {
console.error('Error fetching data: ', error);
});