# node-scraper

- AWS의 serverless web crawling 예제를 참고하여 node & redis로 스크래퍼를 구현했습니다. 스크랩 대상 url은 서울시립대학교의 공지사항입니다.
- **참고** : [scaling up a serverless web crawler and search engine](https://aws.amazon.com/ko/blogs/architecture/scaling-up-a-serverless-web-crawler-and-search-engine/)

## Detail

- 컨테이너 환경에서 동작할 수 있도록 docker & docker-compose 환경 지원
- k8s 환경에서 동작할 수 있도록 k8s & kustomize 환경 지원

## Environment

### redis

**이 어플리케이션은 redis를 사용합니다.**

```bash
$ redis-server
```

### 1.install dependency

```bash
$ yarn
```

### 2-1. using node

```bash
$ yarn start
```

### 2-1. using docker-compose

```bash
$ docker-compose up
```

### 2-2. using k8s

**build docker image**

```bash
# docker image build
$ docker build -t {username}/node-scraper .
```

```bash
# docker image push
$ docker push -t {username}/node-scraper
```

**k8s**

```bash
# using kustomize
$ kubectl kustomize . | kubectl apply -f - -n scraper
```

## License

- [MIT license](https://opensource.org/license/mit/)
