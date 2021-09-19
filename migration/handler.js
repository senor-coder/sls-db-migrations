"use strict";
const { S3Client } = require('@aws-sdk/client-s3');

const { ServerlessDBMigrator } = require("./serverlessDbMigrator.js")
const { BaseDBMigrationClient } = require("./dbMigrationClient.js");

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

async function serverlessMigrationHandler(event) {
  const { bucket, archivePath, command, configOptions, commandOptions } = event;

  console.log(`Running command "${command}" with payload - bucket: ${bucket}, archivePath: ${archivePath}, `)
  const s3Client = new S3Client();
  const baseDbMigrationClient = new BaseDBMigrationClient()
  const slsDbMigrator = new ServerlessDBMigrator(s3Client, baseDbMigrationClient)

  try {
    await slsDbMigrator.executeCommand(bucket, archivePath, command, configOptions, commandOptions)
    return successResponse()
  } catch (e) {
    console.error(`Error running command "${command}" using bucket: ${bucket}, path: ${archivePath}`)
    console.log(e)
    return errorResponse(e)
  }

};

module.exports.serverlessMigrationHandler = serverlessMigrationHandler;