import * as XHLHttpRequest from "xhr2";

export function triggerWebHook(webhookURL: string, payload: any) {
    const xhr = new XHLHttpRequest();
    xhr.open("POST", webhookURL, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
                console.log("Webhook sent successfully.");
            } else {
                console.error("Failed to send webhook:", xhr.status, xhr.statusText);
            }
        }
    };

    xhr.send(JSON.stringify(payload));
}