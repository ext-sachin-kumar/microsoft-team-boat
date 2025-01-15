import dotenv from 'dotenv';
dotenv.config();

// s3Client.js
import { S3 } from "@aws-sdk/client-s3";

console.log(process.env.SPACES_ACCESS_KEY)

export const s3Client = new S3({
  endpoint: process.env.SPACE_ENDPOINT,
  region: "ams3",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY
  },
});

