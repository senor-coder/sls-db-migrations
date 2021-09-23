
const StreamZip = require("node-stream-zip");
const fs = require( "fs");
const os = require( "os");
const path = require( "path");
const { BaseDBMigrationClient } = require( "./dbMigrationClient.js");
const { S3Client, GetObjectCommand } = require( '@aws-sdk/client-s3');



/**
 * A class that takes care of executing migrations stored as an
 * archive(.zip) files in AWS S3
 */
class ServerlessDBMigrator {
    /**
     * 
     * @param {S3Client} s3Client 
     * @param {BaseDBMigrationClient} baseDbMigrationClient 
     */
    constructor(s3Client, baseDbMigrationClient) {
        this.s3Client = s3Client;
        this.baseDbMigrationClient = baseDbMigrationClient
    }

    async downloadArchive(bucket, archivePath, targetDir) {
        const result = await this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: archivePath }));
        const filename = archivePath.split("/").pop()
        const destinationFileName = `${targetDir}/${filename}`;
        const writable = fs.createWriteStream(destinationFileName);
        await new Promise((_resolve, _reject) => {
            let stream = result.Body;
            stream.pipe(writable)
            stream.on('close', _resolve);
            stream.on('end', _resolve);
            stream.on('error', _reject);
        });
        await writable.close();
        return destinationFileName;

    }

    async extractArchive(inputFile, destination) {
        const zip = new StreamZip.async({ file: inputFile });
        await zip.extract(null, destination);
        return zip.close();
    }

    async downloadAndExtractArchive(bucket, archivePath) {
        const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));
        console.log(`Download file from S3 (Bucket: ${bucket}, archivePath: ${archivePath})`);
        const downloadedFile = await this.downloadArchive(bucket, archivePath, targetDir);
        console.log(`Downloaded File to: ${downloadedFile}`);
        console.log(`Extracting zip File to: ${targetDir}`);
        await this.extractArchive(downloadedFile, targetDir);
        console.log(`Zip file extracted.`);
        return targetDir;
    }


    async executeCommand(bucket, archivePath, command, configOptions, commandOptions) {
        const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));

        console.log(`Download file from S3 (Bucket: ${bucket}, archivePath: ${archivePath})`);
        const downloadedFile = await this.downloadArchive(bucket, archivePath, targetDir);
        console.log(`Downloaded File to: ${downloadedFile}`);

        console.log(`Extracting zip File to: ${targetDir}`);
        try {
            await this.extractArchive(downloadedFile, targetDir);
        } catch (error) {
            // Reading ZIP files fails occasionally, with errors like "Bad Archive", "Archive read error" etc
            // This sleep "hack" seems to solve that
            console.log(`There was an error (${error}) in extracting the zip, retrying extract again`);
            await new Promise((resolve) => {setTimeout(resolve, 2000);})
            await this.extractArchive(downloadedFile, targetDir);
        }
        console.log(`Zip file extracted.`);

        await this.baseDbMigrationClient.createDB(targetDir, configOptions);

        console.log(`Executing Command ${command}`);
        return this.baseDbMigrationClient.commandMapper(command, targetDir, configOptions, commandOptions)
    }

}

module.exports.ServerlessDBMigrator = ServerlessDBMigrator;