export interface PageInterface {
    title: string,
    writer: string,
    department: string,
    files: object,
    date: string,
    description: string,
    url: string,
    origin: string,
}

export class Page implements PageInterface {
    constructor(
        public title: string,
        public writer: string,
        public department: string,
        public files: object,
        public description: string,
        public date: string,
        public url: string,
        public origin: string,
        )
    {}
}