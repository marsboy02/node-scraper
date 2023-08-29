export interface PageDtoInterface {
    title: string,
    writer: string,
    department: string,
    date: string,
    files: string,
    description: string,
}

export class PageDto implements PageDtoInterface {
    constructor(
        public title: string,
        public writer: string,
        public department: string,
        public date: string,
        public files: string,
        public description: string,
        )
    {}
}