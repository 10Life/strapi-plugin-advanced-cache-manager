# strapi-plugin-advanced-cache-manager
An advanced cache management plugin for Strapi.

Strapi v4 GraphQL plugin does not come with a cache feature out of the box. A third-party plugin, apollo-server-plugin-response-cache, is used to enable caching, but it does not have a cache invalidation logic. There is another forked project that has a cache invalidation logic, but it only works when GraphQL mutations are executed. This is not suitable for users who create or update data inside Strapi or by direct SQL queries.

This plugin allows Strapi users to invalidate the cache according to the cache time defined in the plugin options. Besides, it also provides a way for users to clear AWS CDN cache.

# How to use
Put this at the top of `/config/plugins.js`:
```
const { RedisCache } = require('apollo-server-cache-redis');
const apolloServerPluginResponseCache = require('apollo-server-plugin-response-cache').default;
const ApolloServerPluginCacheControl = require('apollo-server-core').ApolloServerPluginCacheControl;
```

To enable GraphQL caching, put the following code in your GraphQL config in `/config/plugins.js`:

```
  graphql: {
    enabled: true,
    config: {
        apolloServer: {
            // use redis for storing cache
            cache: (() => {
              if (env('REDIS_HOST')) {
                const redisCache = new RedisCache({
                    host: env('REDIS_HOST'),
                    password: env('REDIS_PASSWORD')
                });
                redisCache.cacheType = 'RedisCache';
                return redisCache;
              }
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

To enable this plugin, put the following code in `/config/plugin.js`:

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

Prepare the environment variables as follows:
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
You can customize the cache scope and maxAge according to your needs. By default, entities will be cached by STRAPI_GRAPHQL_DEFAULT_MAX_AGE. The cache_control_matrix option can override the cache settings for specific entities by STRAPI_GRAPHQL_MAX_AGE. This plugin provides an admin page to clear the cache according to the cache maxAge. You can choose to clear the short cache (STRAPI_GRAPHQL_DEFAULT_MAX_AGE) or clear all the cache in Redis.

The admin page also provides the CDN cache clearing function. It will clear all the CDN cache.

# Road map
- A scheduled cache clearing feature
- A cache clearing pattern input for CDN cache

# Contributing
This section covers the way how to configure your environment if you want to contribute to this package.

Setting up the environment
In order to start making changes in the plugin you first need to install Strapi infrastructure on top of the plugin repository.

```
npx create-strapi-app --quickstart strapi
cd strapi
```

By default Strapi does not create plugins folder so we need to create it.
```
mkdir -p src/plugins
```

Now we should clone this repository so we can work on it.
```
git clone https://github.com/10Life/strapi-plugin-advanced-cache-manager.git
```

Install dependencies:
```
npm install
```

Now we need to register plugin so strapi can use it. In order to do that we need to create (if not already created) `./config/plugins.js` file and add entry to it. (Follow How to use section)
```
module.exports = ({ env }) => ({
  "advanced-cache-manager": {
    enabled: true,
    // add this line
    resolve: "./src/plugins/strapi-plugin-advanced-cache-manager
    // rest of the configuration
  },
});
```

Rebuild the project and start the server:
```
npm run build
npm run develop
```

