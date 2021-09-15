#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import pkg from '@aws-sdk/client-lambda';
const { LambdaClient, InvokeCommand, InvokeCommandInput } = pkg;


const constructMigrationPayload = (command, bucket, archivePath, configPath, env, countOrSpecification, scope) => {
    return {
        bucket, archivePath, command, options: {
            configPath, env, countOrSpecification, scope
        }
    }
}

const invokeLambda = async (lambdaNameOrArn, payload) => {
    const lambdaClient = LambdaClient();
    return lambdaClient.send(new InvokeCommand(
        {
            FunctionName: lambdaNameOrArn,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }))
}



// --- CLI ---

const addCommonOptions = (command) => {
    return command.requiredOption('--lambda <arn or name>', 'the arn or name of the lambda')
        .requiredOption('--bucket <bucket name>', 'the bucket where migrations are stored')
        .requiredOption('--archive-path <path/to/migrate.zip>', 'the file path inside the bucket to the migration archive')
        .option('--config-path <path/inside/zip.json>', 'the file path inside the migration archive')
}

const program = new Command();
program.version('0.0.1')

const up = program.command('up')
    .argument('[env]', 'the environment to use based on the config file in the specified archive')
    .argument('[countOrSpecification]', 'the count of migrations to apply or the migration name upto which the migration is to be done')
    
    addCommonOptions(up)

    .action((countOrSpecification, env, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda } = options;
        const payload = constructMigrationPayload("up", bucket, archivePath, configPath, env, countOrSpecification)

        invokeLambda(lambda, payload).then((result) => {
            console.log('Done')
        })
    }) 

const down = program.command('down')
    .argument('[env]', 'the environment to use based on the config file in the specified archive')
    .argument('[countOrSpecification]', 'the count of migrations to apply or the migration name upto which the migration is to be done')
    
    addCommonOptions(down)

    .action((countOrSpecification, env, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda } = options;
        const payload = constructMigrationPayload("down", bucket, archivePath, configPath, env, countOrSpecification)

        invokeLambda(lambda, payload).then((result) => {
            console.log('Done')
        })
    }) 

    
program.parse(process.argv)