import AWS from 'aws-sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

AWS.config.update({
  region: config.s3.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

const s3 = new AWS.S3();

export class S3Service {
  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: config.s3.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      };

      await s3.putObject(params).promise();

      const url = `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`;

      logger.info('File uploaded to S3', { key, url });

      return url;
    } catch (error) {
      logger.error('Failed to upload file to S3', { error, key });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: config.s3.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      logger.info('Signed URL generated', { key, expiresIn });

      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { error, key });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: config.s3.bucketName,
        Key: key,
      };

      await s3.deleteObject(params).promise();

      logger.info('File deleted from S3', { key });
    } catch (error) {
      logger.error('Failed to delete file from S3', { error, key });
      throw error;
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: config.s3.bucketName,
        Prefix: prefix,
      };

      const response = await s3.listObjectsV2(params).promise();

      const keys = response.Contents?.map((obj) => obj.Key || '') || [];

      logger.info('Files listed from S3', { prefix, count: keys.length });

      return keys;
    } catch (error) {
      logger.error('Failed to list files from S3', { error, prefix });
      throw error;
    }
  }
}

export const s3Service = new S3Service();
