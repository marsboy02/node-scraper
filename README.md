# node-scraper

- AWS의 serverless web crawling 예제를 참고하여 node & redis로 스크래퍼를 구현했습니다. 스크랩 대상 url은 서울시립대학교의 공지사항입니다.
- **참고** : [scaling up a serverless web crawler and search engine](https://aws.amazon.com/ko/blogs/architecture/scaling-up-a-serverless-web-crawler-and-search-engine/)

## Detail

- 컨테이너 환경에서 동작할 수 있도록 docker & docker-compose 환경 지원
- k8s 환경에서 동작할 수 있도록 k8s & kustomize 환경 지원

## Environment

### local에서 node를 실행하는 경우

```bash
# redis 실행
$ redis-server

# node 의존성 설치
$ yarn install

$ yarn start
```

### docker를 사용하는 경우

```bash
$ docker-compose up
```

### K8s를 사용하는 경우

**build docker image**

```bash
# docker image build
$ docker build -t {username}/node-scraper .

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
