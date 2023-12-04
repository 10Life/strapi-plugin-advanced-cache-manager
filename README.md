# strapi-plugin-advanced-cache-manager
A Cache Management for Strapi.

Strapi v4 Graphql plugin do not come with a cache out of the box. A third party plugin, apollo-server-plugin-response-cache is used to provide cache feature, however, no invalidate cache logic available. There is another fork project that come with invalidate logic however, only the execution of graphql mutation can invalide cache that do not suitable for user who create/update inside strapi or by direct sql.

This plugin let strapi user invalidate the cache according to the cache time defined. Besids, it also provide a way for user to clear AWS CDN cache.

# How to use
Put this at the top of /config/plugins.js
```
const InMemoryLRUCache = require('@apollo/utils.keyvaluecache').InMemoryLRUCache;
const { RedisCache } = require('apollo-server-cache-redis');
const apolloServerPluginResponseCache = require('apollo-server-plugin-response-cache').default;
const ApolloServerPluginCacheControl = require('apollo-server-core').ApolloServerPluginCacheControl;
```

To enable graqphql cache, put the below code in your graphql config in /config/plugins.js

```
  graphql: {
    enabled: true,
    config: {
        apolloServer: {
            // use redis for storing cache
            cache: (() => {
                const redisCache = new RedisCache({
                    host: env('REDIS_HOST'),
                    password: env('REDIS_PASSWORD')
                });
                redisCache.cacheType = 'RedisCache';
                return redisCache;
            })(),
            plugins: [
              // cache behavior lower age override higher age
              ApolloServerPluginCacheControl({ defaultMaxAge: env('STRAPI_GRAPHQL_DEFAULT_MAX_AGE') }),
              // customize your cache behavior according to your use case
              apolloServerPluginResponseCache({
                shouldReadFromCache: async(requestContext) => {
                  return true;
                },
                shouldWriteToCache: async(requestContext) => {
                  return true;
                },
                extraCacheKeyData: async(requestContext) => {
                  return true;
                },
                sessionId: async (requestContext) => {
                  return null;
                },
              }),                
            ]
        },
    },
  },

```

To enable this plugin put the below code in /config/plugin.js

```
  'advanced-cache-manager': {
    enabled: true,
    config: {
      max_age: env('STRAPI_GRAPHQL_MAX_AGE'),
      cache_control_matrix: [
        { query: 'usersPermissionsUser', maxAge: 0, scope: "PRIVATE" },
        { query: 'examplePosts', maxAge: env('STRAPI_GRAPHQL_MAX_AGE'), scope: "PUBLIC" },
      ],
      aws_config: {
        accessKeyId: env('STRAPI_AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('STRAPI_AWS_ACCESS_SECRET'),
        region: env('STRAPI_AWS_REGION'),
      }
    }
  },
```

Prepare env variable as follow
```
REDIS_HOST
REDIS_PASSWORD
STRAPI_GRAPHQL_DEFAULT_MAX_AGE
STRAPI_GRAPHQL_MAX_AGE
STRAPI_AWS_ACCESS_KEY_ID
STRAPI_AWS_ACCESS_SECRET
STRAPI_AWS_REGION
```

# Cache administration
You can customize the cache scope and maxAge according to your need. By default, entity will be cached by STRAPI_GRAPHQL_DEFAULT_MAX_AGE, the above can override the entity by STRAPI_GRAPHQL_MAX_AGE. This plugin provide admin page to clear cache that according to the cache maxAge, the short cache, STRAPI_GRAPHQL_DEFAULT_MAX_AGE or clear all cache in redis.

Admin page also provided the CDN cache clear function, it will clear all CDN cache.

# Road map
A schedule cache clearing feature 
Provide a Cache clearing pattern input for CDN cache