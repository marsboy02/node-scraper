export function TrimEscapeSequence(data: string): string {
    return data.replace(/\t/g, '').replace(/\n/g, '');
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