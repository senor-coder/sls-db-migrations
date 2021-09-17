"use strict";

import clientS3Package from '@aws-sdk/client-s3';
const { S3Client } = clientS3Package;

import { ServerlessDBMigrator } from "./serverlessDbMigrator.js"
import { BaseDBMigrationClient } from "./dbMigrationClient.js";

const successResponse = () => {
  return { success: true }
}

const errorResponse = (error) => {
  return {
    success: false,
    message: error.message,
    stack: error.stack,
  }
}

export async function serverlessMigrationHandler(event) {
  const { bucket, archivePath, command, options } = event;

  console.log('Received payload:', event)
  const s3Client = new S3Client();
  const baseDbMigrationClient = new BaseDBMigrationClient()
  const slsDbMigrator = new ServerlessDBMigrator(s3Client, baseDbMigrationClient)

  try{
    await slsDbMigrator.executeCommand(bucket, archivePath, command, options)
    return successResponse()
  } catch (e) {
    console.error(`Error running command "${command}" for from bucket: ${bucket}, path: ${archivePath}`)
    console.log(e)
    return errorResponse(e)
  }
  
};