#! /usr/bin/env node

import { Command } from 'commander/esm.mjs';
import pkg from '@aws-sdk/client-lambda';
const { LambdaClient, InvokeCommand, InvokeCommandInput } = pkg;
import fs from 'fs';

const constructMigrationPayload = (command, bucket, archivePath, config, env, countOrSpecification, scope) => {
    return {
        bucket, archivePath, command,
        configOptions: {
            config, env
        },
        commandOptions: { countOrSpecification }
    }

}

const invokeLambda = async (lambdaNameOrArn, payload) => {
    const lambdaClient = new LambdaClient();
    return lambdaClient.send(new InvokeCommand(
        {
            FunctionName: lambdaNameOrArn,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }))
}

const handleLambdaResponse = async (invokeCommandOutput) => {
    const payload = JSON.parse(Buffer.from(data.Payload));
    if (invokeCommandOutput.StatusCode < 300) {
        console.log('Successfully invoked lambda...');
    } else {
        console.log('Error executing lambda...');
    }
    if (!payload.success) {
        console.log('Error executing the command');
    }
    console.log('Latest Lambda logs:')
    const lambdaFunctionLog = Buffer.from(invokeCommandOutput.LogResult, 'base64')
    console.log(lambdaFunctionLog)
}

// --- CLI ---

const readLocalConfigFromPath = (path) => {

    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const addCommonOptions = (command) => {
    return command.requiredOption('-l --lambda <arn or name>', 'the arn or name of the lambda')
        .requiredOption('--bucket <bucket name>', 'the S3 bucket where migrations are stored')
        .requiredOption('--archive-path <path/to/migrate.zip>', 'the file path inside the bucket to the migration archive')
        .option('--config-path <path/to/database.json>', 'the file path inside the migration archive or in the local system')
        .option('--read-local-config', 'if specified, then the config is read from config-path in the local path.' +
            'This takes precedence over the zipped database.json')
}

const program = new Command();
program.version('0.0.1')

const up = program.command('up')
    .argument('<env>', 'the environment to use based on the config file in the specified archive')
    .argument('[countOrSpecification]', 'the count of migrations to apply or the migration name upto which the migration is to be done')

addCommonOptions(up)

    .action((env, countOrSpecification, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda, readLocalConfig } = options;
        let resolvedConfig = configPath;

        if (readLocalConfig) {
            const configObject = readLocalConfigFromPath(configPath)
            if (!configObject || !configObject[env]) {
                console.error(`Environment ${env} not found in  ${configPath}`)
            }
            resolvedConfig = configObject

        }
        const payload = constructMigrationPayload("up", bucket, archivePath, resolvedConfig, env, countOrSpecification)

        invokeLambda(lambda, payload).then((invokeCommandOutput) => {
            handleLambdaResponse(invokeCommandOutput)
            console.log('Done')
        })
    })

const down = program.command('down')
    .argument('<env>', 'the environment to use based on the config file in the specified archive')
    .argument('[countOrSpecification]', 'the count of migrations to apply or the migration name upto which the migration is to be done')

addCommonOptions(down)

    .action((env, countOrSpecification, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda, readLocalConfig } = options;
        
        let resolvedConfig = configPath;
        if (readLocalConfig) {
            const configObject = readLocalConfigFromPath(configPath)
            if (!configObject || !configObject[env]) {
                console.error(`Environment ${env} not found in  ${configPath}`)
            }
            resolvedConfig = configObject
        }
        const payload = constructMigrationPayload("down", bucket, archivePath, resolvedConfig, env, countOrSpecification)
        invokeLambda(lambda, payload).then((invokeCommandOutput) => {
            handleLambdaResponse(invokeCommandOutput)

            console.log('Done')
        })
    })



program.parse(process.argv)