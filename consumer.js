"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ioredis_1 = require("ioredis");
var dotenv = require("dotenv");
var axios_1 = require("axios");
var cheerio = require("cheerio");
// environment
dotenv.config();
var pageUrl = process.env.PAGE_URL + process.env.CRAWL_TYPE;
var consumerInterval = +process.env.CONSUMER_INTERVAL;
var visitedQueueThreshold = +process.env.VISITED_QUEUE_THRESHOLD;
var crawlType = process.env.CRAWL_TYPE;
var redis = new ioredis_1.default({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
});
// #1 Read Urls in Crawl Queue
function ReadQueuedUrls() {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, redis.lpop('crawl_queue_' + crawlType)];
                case 1:
                    index = _a.sent();
                    console.log(index);
                    return [4 /*yield*/, QueueContainsUrls(index)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// #2 Visited Queue Already Contains Url?
function QueueContainsUrls(index) {
    return __awaiter(this, void 0, void 0, function () {
        var isMember;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, redis.lpos('visited_queue_' + crawlType, index)];
                case 1:
                    isMember = _a.sent();
                    if (!(isMember == null && index)) return [3 /*break*/, 3];
                    return [4 /*yield*/, CrawlPageAndQueueUrls(index)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// #3 Crawl Page and Queue Urls in Visited Queue
function CrawlPageAndQueueUrls(index) {
    return __awaiter(this, void 0, void 0, function () {
        var fullUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fullUrl = pageUrl + '&seq=' + index;
                    return [4 /*yield*/, axios_1.default.get(fullUrl)
                            .then(function (response) {
                            var html = response.data;
                            var $ = cheerio.load(html);
                            extractedPageWithIndex($);
                        }).catch(function (error) {
                            console.error('Error fetching data: ', error);
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, CompleteCrawl(index)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// #4 Complete Crawl and Webhook
function CompleteCrawl(index) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, VisitedUrlsExceedsThreshold()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, redis.rpush('visited_queue_' + crawlType, index)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// #5 Visited Urls Exceeds Threshold?
function VisitedUrlsExceedsThreshold() {
    return __awaiter(this, void 0, void 0, function () {
        var visitedQueueLength;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, redis.llen('visited_queue_' + crawlType)];
                case 1:
                    visitedQueueLength = _a.sent();
                    if (!(visitedQueueLength > visitedQueueThreshold)) return [3 /*break*/, 3];
                    return [4 /*yield*/, redis.lpop('visited_queue_' + crawlType)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var interval = setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
    var message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ReadQueuedUrls()];
            case 1:
                _a.sent();
                message = "\uCEE8\uC288\uBA38 \uC77C \uD558\uB294 \uC911: ".concat(new Date().toISOString());
                return [2 /*return*/];
        }
    });
}); }, consumerInterval);
function extractedPageWithIndex($) {
    var title = $('#contents > div > div.view-bx > div.vw-tibx > h4').text();
    var detail = $('#contents > div > div.view-bx > div.vw-tibx > div > div > span').text();
    console.log('title: ', title);
    console.log('detail: ', detail);
}
