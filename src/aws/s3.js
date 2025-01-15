import { s3Client } from "./init.js";
import { Upload } from '@aws-sdk/lib-storage';

export const uploadToSpace = async function uploadToSpace(bucketName, key, content) {
  try {
    console.log("Uploading to DigitalOcean Spaces:", bucketName, key);
    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: content,
      }
    };

    if (key.includes('.mp4')) {
      uploadParams.params.ContentType = 'video/mp4';
    }

    const uploader = new Upload(uploadParams);
    const data = await uploader.done();
    return data.Location;

  } catch (error) {
    console.error("Error uploading to DigitalOcean Spaces:", error);
    throw error;
  }
};