# sls-db-miragtions
Serverless wrapper for node.js db-migrations framework

## Contents
- [Quick Start](#quick-start)

## <a name="quick-start"></a>Quick Start

1. **Checkout the repository:**
```bash
    git checkout git@github.com:senor-coder/sls-db-miragtions.git
```

2. **Configure Serverless.yml file:**

This project uses Serverless framework. So to deploy this project, copy the serverless.template.yml as serverless.yml and configure the 
IAM Role, security groups and subnet IDs (Fill in the place holders).

3. **Deploy:**

To deploy the project
```bash
npm run deploy
```

## Zip Archive Structure

The ZIP file stored in S3 should have the migrations folder and the configuration JSON at the root level
Example:

```bash
$ zip -sf migrations.zip 
Archive contains:
  database.json
  migrations/
```

## Examples

A complete example can be found in the  [examples/basic](./examples/basic) directory.
