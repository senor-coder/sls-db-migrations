# Basic Example

This is a simple example of how to use sls-db-migrations along 
with the node-db-migrate for performing schema migrations for your database.

This example assumes that you already have the Lambda deployed
and covers how the Lambda can be used.

## Folder structure

```bash
.
├── dbmigration
│   ├── database.json 
│   └── migrations
│       ├── 20210717101554-init.js
│       ├── package.json
│       └── sqls
│           ├── 20210717101554-init-down.sql
│           └── 20210717101554-init-up.sql
├── README.md
└── script.sh

```

## Quick overview

- The `dbmigration/migrations` folder has the migration files generated through the `node-db-migrate` CLI. 
- `script.sh` covers how to ZIP this example, upload to S3 and invoke the Lambda to perform the migrations

## Creating migrations

If you're not familiar with what database schema migrations are and the [node-db-migrate](https://github.com/db-migrate/node-db-migrate) framework, it is recommended that you read about them before continuing.

1. Install the `node-db-migrate` package
```
yarn add --save-dev db-migrate db-migrate-mysql 
```

2. Create a `database.json` with the basic configuration
```json
{
  "prod": {
    "driver": "mysql",
    "user": "admin",
    "password": "abcd",
    "host": "localhost",
    "database": "sandbox",
    "port": 3307,
    "multipleStatements": true
  },
  "sql-file": true
}
```

2. To create a migration, use `db-migrate create "init" --env prod`. This doesn't actually connect to the database, but just creates the necessary template files for writing migrations. 
The reference for the db-migrate command can be found [here](https://db-migrate.readthedocs.io/en/latest/Getting%20Started/commands/#create)

3. Edit the up and down SQL files under `migrations/sqls/`

## Running migrations

To use the Lambda for running these migrations, first zip the `migrations` directory and upload to S3.
Use the sls-dbmigrate CLI tool to invoke the Lambda

See `script.sh` for an example to do this.
