'use strict';

// override those need a short cache max age
// customize cache scope, PUBLIC for a sharing cache, PRIVATE for each user session only
// query is not the query name, but query schema
const customResolversConfig = (config) => {
  const cache_control_matrix =  config.cache_control_matrix;
  const resolversConfig = {};
  for (let i = 0; i < cache_control_matrix.length; i++) {
      if (typeof cache_control_matrix[i] == "object") {
       let middlewares = {
          middlewares: [
            async (next, parent, args, context, info) => {
              if (info && info.cacheControl) {
                info.cacheControl.setCacheHint({ maxAge: cache_control_matrix[i].maxAge, scope: cache_control_matrix[i].scope });
              }
              return next(parent, args, context, info);
            }
          ]
        }
      let query = "Query." + cache_control_matrix[i].query;
      resolversConfig[query] = middlewares;
      }
    }
    return resolversConfig;
}

module.exports = ({ strapi }) => {
  // registeration phase
  const cacheConfig = strapi.config.get('plugin.advanced-cache-manager');
  const extensionService = strapi.plugin('graphql').service('extension');
  extensionService.use(() => ({
    resolvers: {},
    resolversConfig: customResolversConfig(cacheConfig)
  }));
};
