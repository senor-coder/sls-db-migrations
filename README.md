# sls-db-miragtions
Serverless wrapper for node.js db-migrations framework

## Contents
- [Quick Start](#quick-start)


## What is this?

`sls-db-migrations` is a wrapper around the [node-db-migrate](https://github.com/db-migrate/node-db-migrate) framework designed to
work when deployed in a serverless function.

This repo contains the code for the AWS Lambda and a CLI tool to invoke this Lambda.
The migrations are stored as a ZIP file in AWS S3 and the Lambda uses these to run the database migration commands

## <a name="quick-start"></a>Quick Start

### Deploying the AWS Lambda

1. **Checkout the repository:**
```bash
    git checkout git@github.com:senor-coder/sls-db-miragtions.git
```

2. **Configure Serverless.yml file:**

This project uses [Serverless framework](serverless.com/). So to deploy this project, copy the serverless.template.yml as serverless.yml and configure the 
IAM Role, security groups and subnet IDs (Fill in the place holders).

3. **Deploy:**

To deploy the project

```bash
npm run deploy
```

### Using the CLI tool

```bash
sls-dbmigrate up --lambda <name or ARN>
   --bucket db-migrations
   --archive-path auth/migrations.zip 
   --config-path database.json --read-local-config prod
```
Runs the migration of the files stored in the S3 bucket `db-migrations` in the path `auth/migrations.zip` using the environment `prod` 
using the config `database.json` from the local directory. `read-local-config` flag specifies to use the config from local system rather than the one 
packaged in the ZIP file 

## Zip Archive Structure

The ZIP file stored in S3 should have a folder named `migrations` at the root level and optionally, the configuration JSON can be included.

Example:

```bash
$ zip -sf migrations.zip 
Archive contains:
  database.json
  migrations/
```

## Examples

A complete example with a script that zips and uploads files to S3 and invokes the Lambda can be found in the  [examples/basic](./examples/basic) directory.
