# strapi-plugin-advanced-cache-manager
A Cache Management for Strapi.

Strapi v4 Graphql plugin do not come with a cache out of the box. A third party plugin, apollo-server-plugin-response-cache is used to provide cache feature, however, no invalidate cache logic available. There is another fork project that come with invalidate logic however, only the execution of graphql mutation can invalide cache that do not suitable for our use case, user will only create/update inside strapi or by direct sql.

Therefore, we override graphql cache with 3 type of cache age that defined in plugin options

This plugin let strapi user invalidate the cache according to the cache time defined.