
/**
 * Given a config (similar to db-migrate's config), walks the config object
 * and resolves any external references (supports SSM currently)
 */
 class ConfigResolver {
    constructor(valueResolvers) {
        this.valueResolvers = valueResolvers || [];
    }
    registerValueResolver(valueResolver) {
        this.valueResolvers.push(valueResolver)
    }

    async resolveConfig(configObject) {
        let resolvedConfig = {...configObject};
        for (const resolver of this.valueResolvers) {
            resolvedConfig = await resolver.resolveConfig(resolvedConfig);
            console.log(resolvedConfig)
        }

        return resolvedConfig;
    }
 }

 module.exports = ConfigResolver;
