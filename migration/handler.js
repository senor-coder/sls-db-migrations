"use strict";

import clientS3Package from '@aws-sdk/client-s3';
const { S3Client } = clientS3Package;

import { S3DBMigrator } from "./s3Migrator.js"
import { BaseDBMigrationClient } from "./dbMigrationClient.js";



export async function s3MigrationHandler(event) {
  const { bucket, archivePath, command, options } = event;

  console.log('Received payload:', event)
  const s3Client = new S3Client();
  const baseDbMigrationClient = new BaseDBMigrationClient()
  const s3Migrator = new S3DBMigrator(s3Client, baseDbMigrationClient)

  await s3Migrator.executeCommand(bucket, archivePath, command, options)
};