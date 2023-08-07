# url-scraper

- AWS의 serverless web crawling 예제를 참고하여 node & redis로 스크래퍼를 구현했습니다.
- 참고 : [scaling up a serverless web crawler and search engine](https://aws.amazon.com/ko/blogs/architecture/scaling-up-a-serverless-web-crawler-and-search-engine/)

## 환경
### 실행 
```bash
# minikube 실행
minikube start
```

```bash
# cronjob 실행
kubectl apply -f cronjob.yaml
```

### 실행 후 
```bash
# log watch 하는 법
stern scraper-cronjob
```

```bash
# pod 상태 확인하는 법
kubectl get pods
```

### 개발
```bash
# k8s 말고 도커로 노드 스크립트 확인하는 법 
docker-compose -f docker-compose.yml up
docker-compose -f docker-compose-2.yml up
```


```bash
# 도커 이미지 수정하는 법
docker-compose -f docker-compose.yml build
docker tag hyeongjun-scraper-node-app bae4614/rebuild-scraper:latest
docker push bae4614/rebuild-scraper:latest

docker-compose -f docker-compose-2.yml build
docker tag hyeongjun-scraper-node-app bae4614/rebuild-scraper-1:latest
docker push bae4614/rebuild-scraper-1:latest
```

