import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config(); 

// Insure with connect
if (!process.env.REDIS_URL) {
  throw new Error("Redis Connection failed! REDIS_URL is missing.");
}

//  Connect with Redis
export const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Connected to Redis Cloud");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});
