"use strict";

import { DBMigrationClient } from "./migration.js"


export async function migration_handler(event){
  const migration_client = new DBMigrationClient()
  await migration_client.executeCommand(event.bucket, event.archivePath, event.command, event.options)
};