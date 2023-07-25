import axios from "axios";
import * as cheerio from "cheerio"

const url = "https://www.uos.ac.kr/korNotice/list.do?list_id=FA1"
axios.get(url)
.then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('#contents > ul > li:nth-child(1) > div > div > div.ti > a').text();
    console.log('title:', title);
}).catch(error => {
console.error('Error fetching data: ', error);
});