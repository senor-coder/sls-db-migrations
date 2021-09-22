# sls-db-migrations
Serverless wrapper for [node-db-migrate](https://github.com/db-migrate/node-db-migrate) framework

## Contents
- [Quick Start](#quick-start)


## What is this?

`sls-db-migrations` is a wrapper around the [node-db-migrate](https://github.com/db-migrate/node-db-migrate) framework, a database migrations framework, designed to work when deployed in a serverless function.  

This repo contains the code for the AWS Lambda and a CLI tool to invoke this Lambda.
The migrations are stored as a ZIP file in AWS S3 and the Lambda uses these to run the database migration commands

### ZIP Archive Structure

The ZIP file containing the migrations stored in S3 should have a folder named `migrations` at the root level and optionally, the configuration JSON can be included.

Example:

```bash
$ zip -sf migrations.zip 
Archive contains:
  database.json
  migrations/
```

## Quick Start

### Deploying the AWS Lambda

1. **Checkout the repository:**
```bash
    git checkout git@github.com:senor-coder/sls-db-migrations.git
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


## Configuration

The configuration reference for node-db-migrate package can be found [here](https://db-migrate.readthedocs.io/en/latest/Getting%20Started/configuration/)

The configuration is extended to resolve values stored in the AWS SSM Parameter store and environment variables instead of storing them in the config file.
The values are resolved by using the CLI when `read-local-config` option

Currently the values can referenced by environment variables or from SSM Paramter store.

In the following example,
 -  `user` and `password` will be resolved 
from the SSM Parameter store,
 - `host` and `database` will be 
resolved from the environment variables 
- `driver` will be remain unchanged.

```json
{
  "prod":{
    "driver": "mysql",
    "user": { "SSM": "/prod/db/migrationsuser"},
    "password": { "SSM": "/prod/db/migrationsuserpassword"},
    "database": { "ENV": "db"},
    "host": { "ENV": "host"},
  }
}
```


## Examples

A complete example with a script that zips and uploads files to S3 and invokes the Lambda can be found in the [examples/basic](./examples/basic) directory.

## Reference

### CLI
The `sls-dbmigrate` command is used to invoke the deployed AWS Lambda 
for running the migrations.
The CLI takes care of constructing and resolving any dynamic values in 
the configuration.

```
 sls-dbmigrate [options] [command]
```

- Supported commands
    - `up` - Runs the up migrations for the given environment. The count or specification upto which the migration is to be run can be specified.  
    Eg: `sls-dbmigrate up <env> [countOrSpecification] [options] `

    - `down` - Runs the down migrations for the given environment. The count or specification upto which the migration is to be run can be specified.  
    Eg: `sls-dbmigrate down <env> [countOrSpecification] [options] `

- Options  
  (The options written here are currently common for both the commands `up`  and `down`)
    - `-l --lambda <arn or name>` - the ARN or name of the Lambda function
    - `--bucket <bucket name>` - the S3 bucket where migrations are stored
    - `--archive-path <path/to/migrate.zip>` the file path inside the     bucket to the migration archive
    - `--config-path <path/to/database.json>` -  the file path inside the migration archive or in the local system.
    - `--read-local-config` -  Optional. if specified, then the config is read from specified `config-path` in the local system where CLI is used. This takes precedence over the zipped database.json.
    The configuration is also resolved for dynamic values locally


### Lambda payload

This is provided here for a reference.
It is recommended to use the CLI tool for invoking the Lambda.

```ts

{
  bucket: string, // the S3 bucket where the migrations zip is stored
  archivePath: string, // the path inside the bucket to the ZIP file
  command: "up" | "down" | "reset",
  configOptions: {
    config: string | {}, // The path inside the ZIP or configuration JSON
                        // object directly, default will be database.json
    env: string, // The environment to use in the configuration.
  }
  commandOptions: {} // the options specific to a command.
}

```
