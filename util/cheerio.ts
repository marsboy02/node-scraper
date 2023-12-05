import * as cheerio from "cheerio";
import { Page, PageInterface } from "../dto/page";
import { crawlType } from "../config/constants";
import { AxiosResponse } from "axios";
import { TrimEscapeSequence } from "./utility";

/**
 * Axios를 통해 얻은 AxiosResponse<any, any>를 통해서 cheerioAPI 타입을 반환합니다.
 * @return cheerio를 통한 크롤링에 필요한 cheerioAPI를 반환합니다.
 */
export function getCheerioApiFromResponse(response: AxiosResponse<any, any>): cheerio.CheerioAPI {
    const html = response.data;
    return cheerio.load(html);
}

/**
 * Cheerio를 통해서 웹페이지의 파일을 크롤링하는 함수입니다.
 * @return 파일명 : 다운로드 URL의 형태로 객체를 반환합니다.
 */
export function extractFilesFromHTML($: cheerio.CheerioAPI): Object {
    const filesObject = {};
    const fileElements = $('#contents > div > div.view-bx > div.vw-tibx > ul > li');
    fileElements.each((index, element) => {
        const key: string = $(element).find('a:nth-child(2)').text();
        const value: string = $(element).find('a:nth-child(2)').attr('href');
        if (key && value) {
            filesObject[TrimEscapeSequence(key)] = "https://uos.ac.kr" + value;
        }
    });

    return filesObject;
}

/**
 * Cheerio를 통해서 웹페이지의 정보를 크롤링하는 함수입니다.
 */
export function extractPageWithIndex(fullUrl: string, $: cheerio.CheerioAPI): PageInterface {
    const title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    const writer = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(1)').text();
    const department = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(2)').text();
    const date = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span:nth-child(3)').text();
    const files = extractFilesFromHTML($)
    const description = $('#contents > div > div.view-bx > div.vw-con').html();
    return new Page(title, writer, department, files, TrimEscapeSequence(description), TrimEscapeSequence(date).substring(0,10), fullUrl, crawlType)
}