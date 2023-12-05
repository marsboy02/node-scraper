import * as cheerio from "cheerio";
import {Page, PageInterface} from "../dto/page";
import {crawlType} from "../config/constants";
import {AxiosResponse} from "axios";

export function TrimEscapeSequence(data: string): string {
    return data.replace(/\t/g, '').replace(/\n/g, '');
}

export function getCheerioApiFromResponse(response: AxiosResponse<any, any>): cheerio.CheerioAPI {
    const html = response.data;
    return cheerio.load(html);
}

export function extractFilesFromHTML($): Object {
    const filesObject = {};
    const fileElements = $('#contents > div > div.view-bx > div.vw-tibx > ul > li');
    fileElements.each((index, element) => {
        const key = $(element).find('a:nth-child(2)').text();
        const value = $(element).find('a:nth-child(2)').attr('href');
        if (key && value) {
            filesObject[TrimEscapeSequence(key)] = "https://uos.ac.kr" + value;
        }
    });

    return filesObject;
}

export function extractedPageWithIndex(fullUrl: string, $: cheerio.CheerioAPI): PageInterface {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const writer = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(1)').text();
    const department = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(2)').text();
    const date = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(3)').text();
    const files = extractFilesFromHTML($)
    const description = $('#contents > div > div.view-bx > div.vw-con').html();
    return new Page(title, writer, department, files, TrimEscapeSequence(description), TrimEscapeSequence(date).substring(0,10), fullUrl, crawlType)
}