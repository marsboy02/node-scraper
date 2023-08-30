# url-scraper

- AWS의 serverless web crawling 예제를 참고하여 node & redis로 스크래퍼를 구현했습니다.
- [참고] : [scaling up a serverless web crawler and search engine](https://aws.amazon.com/ko/blogs/architecture/scaling-up-a-serverless-web-crawler-and-search-engine/)

## Environment

**의존성 설치**
```bash
$ yarn
```

### docker-compose를 사용하는 경우

```bash
$ docker-compose up
```

### k8s를 사용하는 경우

**도커 이미지 빌드**

```bash
# docker image build
$ docker build -t {username}/node-scraper .
```

```bash
# docker image push
$ docker push -t {username}/node-scraper
```

**k8s 클러스터 세팅**

```bash
# redis deployment
$ kubectl create -f ./k8s/deployment.yaml

# redis service
$ kubectl create -f ./k8s/service.yaml

# cronjob
$ kubectl create -f ./k8s/cronjob.yaml
```

