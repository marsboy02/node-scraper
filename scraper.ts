import { PageDtoInterface } from "./util/pageDto";
import {
    listUrl,
    consumerInterval,
    producerCount,
    consumerTTL,
    webhookUrl,
} from "./util/constants";
import { triggerWebHook } from "./util/webhook";
import { Produce, ReadQueuedUrls } from "./util/produce";


function main(): void {
    // produce
    Produce(listUrl, producerCount);

    // consume
    const interval = setInterval(async () => {
        const pageData: PageDtoInterface = await ReadQueuedUrls();
        if (pageData == null) {
            console.log("queue is empty");
        } else {
            triggerWebHook(webhookUrl, pageData);
        }
    }, consumerInterval);

    setTimeout((): void => {
        console.log("container consume done!")
        clearInterval(interval);
        process.exit(0);
    }, consumerTTL);
}

main();