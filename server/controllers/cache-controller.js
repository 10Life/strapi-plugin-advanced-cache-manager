'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('advanced-cache-manager')
      .service('cacheService')
      .getWelcomeMessage();
  },
  purge_all(ctx) {
    ctx.body = strapi.plugin('advanced-cache-manager')
    .service('cacheService')
    .purge_all();
  },
  short_cache(ctx) {
    ctx.body = strapi.plugin('advanced-cache-manager')
    .service('cacheService')
    .short_cache();
  },
  purge_cdn(ctx){
    ctx.body = strapi.plugin('advanced-cache-manager')
    .service('cacheService')
    .purge_cdn();
  } 
});
