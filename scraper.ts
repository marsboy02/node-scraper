import { PageInterface } from "./dto/page";
import {
    listUrl,
    consumerInterval,
    producerCount,
    consumerTTL,
    webhookUrl,
    crawlType,
} from "./config/constants";
import { triggerWebHook } from "./util/webhook";
import { Produce, ReadQueuedUrls } from "./util/crawl";


function main(): void {
    Produce(listUrl, producerCount);

    const interval = setInterval(async () => {
        const pageData: PageInterface = await ReadQueuedUrls();
        if (pageData == null) {
            console.log("["+ crawlType + "] queue is empty");
        } else {
            triggerWebHook(webhookUrl, pageData);
        }
    }, consumerInterval);

    setTimeout((): void => {
        console.log("[" + crawlType +"] container consume done!")
        clearInterval(interval);
        process.exit(0);
    }, consumerTTL);
}

main();