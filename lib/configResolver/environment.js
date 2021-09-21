const ConfigKeyReferenceError = require('./errors.js');

/**
 * Resolves values from the environment variables
 * {"ENV":"host"} will replaced by the value of "host" from the environment 
 */
class EnvironmentValueResolver {
    static ENV_KEY = "ENV";

    keynameToResolve(o) {
        if(o === undefined || o === null || !typeof(o) === 'object') return null;

        const keys = Object.keys(o)
        if (keys.length === 1 && keys[0] === EnvironmentValueResolver.ENV_KEY)
            return o.ENV

        return null;
    }
    key() {
        return EnvironmentValueResolver.ENV_KEY;
    }
    resolveValue(key) {
        let value = process.env[key]
        if(process.env[key] === undefined) {
            value = null
        }
        return value
    }

    traverseAndSetEnvParams(configObject) {
        let resolvedObject = {};
        const objectKeys = Object.keys(configObject);

        objectKeys.forEach(key => {
            let value = configObject[key];
            const keyName = this.keynameToResolve(configObject[key])
            if (keyName && !this.resolveValue(keyName)) {
                throw new ConfigKeyReferenceError(`${keyName} has no value defined in the environment`)
            }

            if (keyName) {
                value = this.resolveValue(keyName)
            } else if (typeof (configObject[key]) === 'object') {
                value = this.traverseAndSetEnvParams(configObject[key]);
            }
            resolvedObject[key] = value
        });
        return resolvedObject;
    }
    async resolveConfig(configObject) {
        let resolvedObject = this.traverseAndSetEnvParams(configObject);
        return resolvedObject;

    }

}

module.exports = { EnvironmentValueResolver }