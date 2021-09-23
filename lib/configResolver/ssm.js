const ConfigKeyReferenceError = require('./errors.js');
const { GetParametersCommand, SSMClient } = require('@aws-sdk/client-ssm');


class SSMParameterValueResolver {
    static SSM_KEY = 'SSM'
    
    /**
     * Constructs an instance of this resolver
     * @param {SSMClient} ssmClient the SSMClient that will be used for resolving the values
     */
    constructor(ssmClient) {
        this.ssmClient = ssmClient;
    }

    shouldResolveFromSSM(o) {
        // {SSM: 'parameter-key'}
        if(o === undefined || o === null || !typeof(o) === 'object') return false;
        const keys = Object.keys(o)
        if (keys.length === 1 && keys[0] === SSMParameterValueResolver.SSM_KEY)
            return o.SSM
        return false
    }


    async lookupAndResolveParams(parameters) {
        const command = new GetParametersCommand({ Names: parameters, WithDecryption: true });

        const parameterResults = await this.ssmClient.send(command);

        parameterResults.InvalidParameters.forEach((param) => {
            const message = `Invalid SSM parameter: ${param}`;
            throw new ConfigKeyReferenceError(message)
        });

        const result = {};
        parameterResults.Parameters.forEach((paramResult) => {
            result[paramResult.Name] = paramResult.Value;
        })

        return result
    }
    shouldTraverseFurtherDown(value) {
        return typeof(value) === 'object' && typeof(value) !== undefined  && value !== null;
    }
    setParams(o, resolvedValues) {
        let resolvedObject = {};
        const objectKeys = Object.keys(o);
        objectKeys.forEach(key => {
            let value = o[key];
            const name = this.shouldResolveFromSSM(o[key])
            if (name) {
                value = resolvedValues[name] || null
            } else if (this.shouldTraverseFurtherDown(o[key])) {
                value = this.setParams(o[key], resolvedValues);
            }
            resolvedObject[key] = value
        });
        return resolvedObject;

    }
    traverseAndGetSSMKeys(o) {
        const objectKeys = Object.keys(o);
        const paramsToResolve = [];
        objectKeys.forEach(key => {
            const name = this.shouldResolveFromSSM(o[key])
            if (name) {
                paramsToResolve.push(name)
            } else if (this.shouldTraverseFurtherDown(o[key])) {
                paramsToResolve.push(...this.traverseAndGetSSMKeys(o[key]));
            }
        });
        return paramsToResolve;
    }
    async resolveConfig(configObject) {
        let keysToLookup = this.traverseAndGetSSMKeys(configObject);
        if(keysToLookup && keysToLookup.length > 0) {
            let lookedupValues = await this.lookupAndResolveParams(keysToLookup);
            let resolvedConfigObject = this.setParams(configObject, lookedupValues);
            return resolvedConfigObject    
        }
        return configObject;
    }
}
module.exports = { SSMParameterValueResolver }
