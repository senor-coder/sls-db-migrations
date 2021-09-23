#! /usr/bin/env node

const { Command, CommanderError } = require('commander')
const { LambdaClient, InvokeCommand, InvokeCommandInput } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const ConfigResolver = require('../lib/configResolver');
const { EnvironmentValueResolver } = require('../lib/configResolver/environment');
const { SSMParameterValueResolver } = require('../lib/configResolver/ssm');
const { SSMClient } = require('@aws-sdk/client-ssm');


const LAMBDA_FAILURE_EXIT_CODE = 2;


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
    const payload = JSON.parse(Buffer.from(invokeCommandOutput.Payload));
    if (invokeCommandOutput.StatusCode > 300) {
        console.log('Error executing lambda...');
    }

    if (invokeCommandOutput.LogResult) {
        console.log('Latest Lambda logs:')
        const lambdaFunctionLog = Buffer.from(invokeCommandOutput.LogResult, 'base64')
        console.log(lambdaFunctionLog)
    }
    if (!payload.success) {
        console.log(`Error executing the command: ${payload.message}`);
        console.log(payload.stack)
        throw new Error('An errored occurred when executing the command. Check the output above or the lambda logs for info.')
    } else {
        console.log('Successfully executed the command');
    }
}

// --- CLI ---


const readLocalConfigFromPath = async (path) => {

    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    const environmentValueResolver = new EnvironmentValueResolver();

    const ssmClient = new SSMClient();
    const ssmParameterValueResolver = new SSMParameterValueResolver(ssmClient);
    const configResolver = new ConfigResolver([environmentValueResolver, ssmParameterValueResolver]);

    const resolvedConfig = await configResolver.resolveConfig(config);
    return resolvedConfig
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

    .action(async (env, countOrSpecification, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda, readLocalConfig } = options;
        let resolvedConfig = configPath;

        if (readLocalConfig) {
            const configObject = await readLocalConfigFromPath(configPath)
            if (!configObject || !configObject[env]) {
                console.error(`Environment ${env} not found in  ${configPath}`)
            }
            resolvedConfig = configObject

        }
        const payload = constructMigrationPayload("up", bucket, archivePath, resolvedConfig, env, countOrSpecification)

        try {
            const invokeCommandOutput = await invokeLambda(lambda, payload)
            await handleLambdaResponse(invokeCommandOutput)
            console.log('Done.')
        } catch (e) {
            console.log(e)
            process.exitCode = LAMBDA_FAILURE_EXIT_CODE
            process.exit(LAMBDA_FAILURE_EXIT_CODE)
        }
    })

const down = program.command('down')
    .argument('<env>', 'the environment to use based on the config file in the specified archive')
    .argument('[countOrSpecification]', 'the count of migrations to apply or the migration name upto which the migration is to be done')

addCommonOptions(down)

    .action(async (env, countOrSpecification, options, command) => {
        console.log({ options })
        const { bucket, archivePath, configPath, lambda, readLocalConfig } = options;


        let resolvedConfig = configPath;
        if (readLocalConfig) {
            const configObject = await readLocalConfigFromPath(configPath)
            if (!configObject || !configObject[env]) {
                console.error(`Environment ${env} not found in  ${configPath}`)
            }
            resolvedConfig = configObject
        }
        const payload = constructMigrationPayload("down", bucket, archivePath, resolvedConfig, env, countOrSpecification)
        try {
            const invokeCommandOutput = await invokeLambda(lambda, payload)
            await handleLambdaResponse(invokeCommandOutput)
            console.log('Done.')
        } catch (error) {
            console.log(error)
            process.exitCode = LAMBDA_FAILURE_EXIT_CODE
            process.exit(LAMBDA_FAILURE_EXIT_CODE)
        }
    })


program.parseAsync(process.argv);