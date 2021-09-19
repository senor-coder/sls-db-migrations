
const DBMigrate = require("db-migrate");
const fs = require("fs");
const path = require("path");



/**
 * A wrapper around the db-migrate library
 * See https://db-migrate.readthedocs.io/en/latest/API/programable/
 */
class BaseDBMigrationClient {
    constructor() {
        
    }

    commandMapper(command, workingDirectory, configOptions, commandOptions) {
        switch (command) {
            case "up":
                return this.executeUp(workingDirectory, configOptions, commandOptions);
            case "down":
                return this.executeDown(workingDirectory, configOptions, commandOptions);
            case "reset":
                return this.executeReset(workingDirectory, configOptions, commandOptions);

            default:
                throw Error(`Unknown command ${command}`)
        }
    }

    /**
     * Returns a DBMigrate instance with the given paramaters
     * @param {string} workingDirectory the working directory for the db-migrate
     * @param {string|Object} config the configuration containing the db connection details. Equivalent to database.json configuration
     * 
     * @param {string} env the environment inside the configuration to use
     * @returns a DBMigrate instance with the given options
     */
    getDbMigrateInstance(workingDirectory, config, env) {
        const resolvedConfig = this.resolveConfig(workingDirectory, config);
        const dbmigrateOptions = {
            cwd: workingDirectory,
            config: resolvedConfig,
            env,
            throwUncatched: true // If false, then the program exits on error
        }
        return DBMigrate.getInstance(true, dbmigrateOptions)
    }

    /**
     * A helper function for resolving the config object or path.
     * @param {string} workingDirectory the working directory where the db-migrate files are stored
     * @param {string|Object} config the path inside the workingDirect or the config as an object
     * @returns the entire path or the config object
     */
    resolveConfig(workingDirectory, config) {
        if (typeof (config) == 'object') {
            return config
        }
        else if (typeof (config) == 'string') {
            // If it is a string, then it is considered as a path inside the working directory
            // We can return a path, which db-migrate will handle
            return path.join(workingDirectory, config)
        }

    }

    // The following code contains the functions is equivalent to the 
    // commands provided by db-migrate CLI.
    // The functions follow a common argument pattern of (workingDirectory, dbMigrateOptions, optionsForCommand)

    async createDB(migrationsDir, { config, env } = {}) {
        const resolvedConfig = this.resolveConfig(migrationsDir, config);
        let datatbaseConfig = {};

        if (typeof (resolvedConfig) == 'string') {
            datatbaseConfig = JSON.parse(fs.readFileSync(resolvedConfig, 'utf8'));
        } else {
            datatbaseConfig = config
        }
        let databaseName = null;

        let chosenEnv = env ? env : datatbaseConfig.defaultEnv;
        if (!chosenEnv) {
            throw Error('No environment specified. Send a env key in the options or specify defaultEnv in the config')
        }
        if (!datatbaseConfig[chosenEnv] || !datatbaseConfig[chosenEnv].database) {
            throw Error(`The environment ${env} not found in the config`)

        }
        databaseName = datatbaseConfig[chosenEnv].database;

        // This is an issue with db-migrate where it tries to connect to the database
        // specified in the config even before creating the database.
        // So as a workaround, we remove that property from the config and set it after the database is created
        // 
        // See issue: https://github.com/db-migrate/node-db-migrate/issues/468
        // Also see: https://github.com/db-migrate/node-db-migrate/pull/644/
        //      (It seems to be fixed upstream, but is pending release)
        delete datatbaseConfig[chosenEnv].database

        console.log(`Creating database if not exists: ${databaseName}`)

        const dbMigrateInstance = this.getDbMigrateInstance(migrationsDir, datatbaseConfig, env)
        const result = await dbMigrateInstance.createDatabase(databaseName);
        
        // Set back the database property that we removed from the config
        datatbaseConfig[chosenEnv].database = databaseName
        return result
    }

    async executeUp(migrationsDir, { config, env }, { countOrSpecification, scope }) {
        const dbMigrateInstance = this.getDbMigrateInstance(migrationsDir, config, env)
        return dbMigrateInstance.up(countOrSpecification, scope);
    }

    async executeReset(migrationsDir, { config, env }, { scope }) {
        const dbMigrateInstance = this.getDbMigrateInstance(migrationsDir, config, env)
        return dbMigrateInstance.reset(scope);
    }
    async executeDown(migrationsDir, { config, env }, { countOrSpecification, scope }) {
        const dbMigrateInstance = this.getDbMigrateInstance(migrationsDir, config, env)
        return dbMigrateInstance.down(countOrSpecification, scope);
    }
}

module.exports.BaseDBMigrationClient = BaseDBMigrationClient;
