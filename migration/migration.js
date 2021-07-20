
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import DBMigrate from "db-migrate";
import StreamZip  from "node-stream-zip";
import fs from "fs";
import os from "os";
import path from "path";

export class DBMigrationClient{
    constructor(){
        this.s3_client=new S3Client();
        this.commandMap = {
            up: this.executeUp,
            down: this.executeDown,
            reset: this.executeReset
        }
    }

    async downloadArchive(bucket, archivePath, targetDir){
        const result = await this.s3_client.send(new GetObjectCommand({Bucket: bucket, Key: archivePath}));
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

    async extractArchive(inputFile, destination){
        const zip = new StreamZip.async({ file: inputFile });
        await zip.extract(null, destination);
        return zip.close();
    }

    async createDB(migrationDir){
        var datatbaseConfig = JSON.parse(fs.readFileSync(path.join(migrationDir,'database.json'), 'utf8'));
        var database = null;
        if("defaultEnv" in datatbaseConfig){
            database = datatbaseConfig[datatbaseConfig.defaultEnv].database;
            delete datatbaseConfig[datatbaseConfig.defaultEnv].database;
        }else{
            database = datatbaseConfig.database
            delete datatbaseConfig.database
        }
        const dbConfigFile = path.join(migrationDir, 'dbdatabase.json');
        fs.writeFileSync(dbConfigFile, JSON.stringify(datatbaseConfig));
        console.log(`Creating database if not exists: ${database}`)
        const db_migration_client = DBMigrate.getInstance(true, {cwd: migrationDir, config: dbConfigFile})
        return db_migration_client.createDatabase(database);
    }

    async executeUp(migrationDir, options){
        const db_migration_client = DBMigrate.getInstance(true, {cwd: migrationDir})
        return db_migration_client.up();
    }

    async executeReset(migrationDir, options){
        const db_migration_client = DBMigrate.getInstance(true, {cwd: migrationDir})
        return db_migration_client.reset();
    }

    async executeDown(migrationDir, options){
        const db_migration_client = DBMigrate.getInstance(true, {cwd: migrationDir})
        return db_migration_client.down();
    }

    async executeCommand(bucket, archivePath, command, options){
        const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));
        console.log(`Download file from S3 (Bucket: ${bucket}, archivePath: ${archivePath})`);
        const downloadedFile = await this.downloadArchive(bucket, archivePath,targetDir);
        console.log(`Downloaded File to: ${downloadedFile}`);
        console.log(`Extracting zip File to: ${targetDir}`);
        await new Promise((resolve) => {setTimeout(resolve, 2000);})
        await this.extractArchive(downloadedFile, targetDir);
        console.log(`Zip file extracted.`);
        await this.createDB(targetDir);
        console.log(`Executing Command ${command}`);
        return this.commandMap[command](targetDir, options)
    }

}