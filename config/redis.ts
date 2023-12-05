import Redis from "ioredis";
import { redisHost, redisPort } from "./constants";

export function getRedis(): Redis {
    return new Redis({
        host: redisHost,
        port: redisPort,
    })
}