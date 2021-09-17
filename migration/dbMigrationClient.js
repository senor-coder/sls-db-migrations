
import DBMigrate from "db-migrate";
import fs from "fs";
import path from "path";



/**
 * A wrapper around the db-migrate library
 */
export class BaseDBMigrationClient {
    constructor() {
        this.commandMap = {
            up: this.executeUp,
            down: this.executeDown,
            reset: this.executeReset
        }
    }

    async createDB(migrationsDir, { configPath, env } = {}) {
        let dbmigrateOptions = { throwUncatched: true };
        dbmigrateOptions['cwd'] = migrationsDir;

        configPath = configPath ? configPath : 'database.json'
        const resolvedConfigPath = path.join(migrationsDir, configPath);
        dbmigrateOptions['config'] = resolvedConfigPath;
        if (env) {
            dbmigrateOptions['env'] = env
        }

        let datatbaseConfig = JSON.parse(fs.readFileSync(resolvedConfigPath, 'utf8'));
        let databaseName = null;

        let chosenEnv = env ? env : datatbaseConfig.defaultEnv;
        if (!chosenEnv) {
            throw Error('No environment specified. Send a env key in the options')
        }
        databaseName = datatbaseConfig[chosenEnv].database;

        console.log(`Creating database if not exists: ${databaseName}`)
        const dbMigrateInstance = DBMigrate.getInstance(true, dbmigrateOptions)
        return dbMigrateInstance.createDatabase(databaseName);
    }

    async executeUp(migrationsDir, { configPath, env, countOrSpecification, scope }) {
        let dbmigrateOptions = { throwUncatched: true };
        dbmigrateOptions['cwd'] = migrationsDir;

        if (configPath) {
            const resolvedConfigPath = path.join(migrationDir, configPath);
            dbmigrateOptions['config'] = resolvedConfigPath;
        }
        if (env) {
            dbmigrateOptions['env'] = env
        }

        const dbMigrateInstance = DBMigrate.getInstance(true, dbmigrateOptions)
        return dbMigrateInstance.up(countOrSpecification, scope);
    }

    async executeReset(migrationsDir, { configPath, env, scope }) {
        let dbmigrateOptions = { throwUncatched: true };
        dbmigrateOptions['cwd'] = migrationsDir;

        if (configPath) {
            const resolvedConfigPath = path.join(migrationDir, configPath);
            dbmigrateOptions['config'] = resolvedConfigPath;
        }
        if (env) {
            dbmigrateOptions['env'] = env
        }
        const dbMigrateInstance = DBMigrate.getInstance(true, dbmigrateOptions)
        return dbMigrateInstance.reset(scope);
    }
    async executeDown(migrationsDir, { configPath, env, countOrSpecification, scope }) {
        let dbmigrateOptions = { throwUncatched: true };
        dbmigrateOptions['cwd'] = migrationsDir;

        if (configPath) {
            const resolvedConfigPath = path.join(migrationDir, configPath);
            dbmigrateOptions['config'] = resolvedConfigPath;
        }
        if (env) {
            dbmigrateOptions['env'] = env
        }

        const dbMigrateInstance = DBMigrate.getInstance(true, dbmigrateOptions)
        return dbMigrateInstance.down(countOrSpecification, scope);
    }

}
