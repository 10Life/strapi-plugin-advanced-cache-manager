'use strict';
const AWS = require('aws-sdk');
const plugin_model = 'plugin::advanced-cache-manager.record';
const cdn_items = ['/*'];
let response = '';
const getConfig = () => {
  const cacheConfig = strapi.config.get('plugin.advanced-cache-manager');
  return cacheConfig;
}
const createInvalidation = async(distId) => {
  const cloudfront = new AWS.CloudFront(getConfig().aws_config);
  return await cloudfront
  .createInvalidation({
    DistributionId: distId,
    InvalidationBatch: {
      CallerReference: new Date().getTime().toString(),
      Paths: {
        Quantity: 1,
        Items: cdn_items,
      },
    },
  })
  .promise();
}
const checkInvalidation = async(distId, invalidationId) => {
  const cloudfront = new AWS.CloudFront(getConfig().aws_config);
  return await cloudfront
  .getInvalidation({
    DistributionId: distId,
    Id: invalidationId
  })
  .promise();
}
const listDistributions = async() => {
  const cloudfront = new AWS.CloudFront(getConfig().aws_config);
  let distributions = [];
  let data;
  let marker;
  do {
    data = await cloudfront.listDistributions({ Marker: marker }).promise();
    distributions = distributions.concat(data.DistributionList.Items);
    marker = data.DistributionList.NextMarker;
  } while (data.DistributionList.IsTruncated);
  return distributions;
}
const getLastInvalidation = async() => {
  try {
    let lastInvalidation = await strapi.query(plugin_model).findOne(
      {
        select: ['invalidationId'],
        where: {
          items: cdn_items.toString() 
        },
        orderBy: { createdAt: 'DESC' }
      }
    );
    return lastInvalidation?.invalidationId;
  } catch (error) {
    strapi.log.info('enquireInvalidation', error);
  }
  return "";
}
const updateInvalidation = async(invalidationId, status) => {
  try {
    return await strapi.query(plugin_model).update(
      {
        where: {
          $and: [
            {
              items: cdn_items.toString(),
            },
            {
              invalidationId: invalidationId
            }
          ]
        },
        data: { status: status }
      }
    );
  } catch (error) {
    strapi.log.info('enquireInvalidation', error);
  }  
}
const purgeRedisCache = (cache) => {
  const config = getConfig();
  cache.client.keys('*', (err, keys) => {
    keys.forEach((key, pos) => { 
      cache.client.get(key, (err, result) =>{
        if(result){
          try {
            let json_obj = JSON.parse(result);
            const obj_max_age = json_obj?.cachePolicy.maxAge;
            if(String(obj_max_age) === String(config.max_age)){
              cache.client.del(key, function(err, succeeded) {
              });
            }                                       
          } catch (error) {
            strapi.log.info('graphql purgeRedisCache:', error.message);
          }
        }
      });
    });
  });
}
const purgeInMemoryLRUCache = (cache) => {
  let keys = cache.keys();
  const config = getConfig();
  keys.forEach(key => {
    let value = cache.get(key);
    value.then((result) => {
      if(result){
        try {
          let json_obj = JSON.parse(result);
          const obj_max_age = json_obj?.cachePolicy.maxAge;
          if(String(obj_max_age) === String(config.max_age)){
            cache.delete(key);
          }
        } catch (error) {
          strapi.log.info('graphql purgeInMemoryLRUCache:', error.message);
        }
      }
    });
  });
}
const getGraphqlCache = () => {
  return strapi.config.get('plugin.graphql').apolloServer.cache;
}
const purgeCacheRecord = async(payload) => {
  try {
    await strapi.query(plugin_model).create(
      { data: payload }
    );  
  } catch (error) {
    strapi.log.info('purgeCacheRecord', error);
  }
}
module.exports = ({ strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Strapi Purge Cache for GraphQL!';
  },
  async purge_cdn(){
    const cname = process.env.AWS_NUXT_HOST_NAME;
    let all = null;
    let distributions = [];
    try {
      all = await listDistributions();
      distributions = all.filter((dist) => dist.Aliases.Items.includes(cname));
    } catch (error) {
      strapi.log.info('unable to list cdn distributions', error.message);
    }
    if (distributions.length === 0) {
      strapi.log.info(`Distribution matching cname "${cname}" was not found.`);
    }
    for (const dist of distributions) {
      // enquiry from database for the last entry of the same items
      const lastInvalidationId = await getLastInvalidation();
      // check invalidationID
      let InvalidationResult = null;
      if(lastInvalidationId){
        try {
          InvalidationResult = await checkInvalidation(dist.Id, lastInvalidationId);            
        } catch (error) {
          strapi.log.info('Check Invalidation Error', error.message);            
        }
      }
      if(((!lastInvalidationId) || (InvalidationResult?.Invalidation?.Status !== 'InProgress'))||(!InvalidationResult)){
        // if it is finished, update old entry & start new invalidation  
        if(lastInvalidationId && InvalidationResult){
          updateInvalidation(lastInvalidationId, InvalidationResult?.Invalidation?.Status);
        } else {
          // already invalid for some reason
          updateInvalidation(lastInvalidationId, "NoSuchInvalidation");
        }
        try {
          let Invalidation = await createInvalidation(dist.Id);
          try {
            purgeCacheRecord({'cacheType': 'purge_cdn' , 'items': cdn_items.toString(), 'invalidationId': Invalidation?.Invalidation?.Id, 'status': Invalidation?.Invalidation?.Status});            
          } catch (error) {
            strapi.log.info('Purge Cache Error', error.message);
          }  
        } catch (error) {
          strapi.log.info('Create Invalidation Error', error.message);
        }
      } else {
        strapi.log.info('last invalidation is in progress, skip.');
      }
    }
  },
  async purge_all(){
    response = '';
    try {
      const graphqlCache = getGraphqlCache();
      if (graphqlCache.cacheType === 'RedisCache') {
        response = 'OK';
        graphqlCache.client.flushdb((err, succeeded) => {});
      } else if (graphqlCache.cacheType === 'InMemoryLRUCache') {
        response = 'OK';
        graphqlCache.clear();
      } else {
        response = 'CACHE TYPE NOT SUPPORT';
        strapi.log.info("Cache type not support, Please make sure cacheType has been injected to cache object in graphql config");
      }
    } catch (error) {
      response = error.message;
      strapi.log.info('Error', error);
    }
    try {
      purgeCacheRecord({'cacheType': 'purge_all' ,'items': 'expire all items', 'invalidationId': '', 'status': response});      
    } catch (error) {
      strapi.log.info('Error', error);
    }
    return response;
  },
  async short_cache(){
    response = '';
    try {
      const graphqlCache = getGraphqlCache();
      if (graphqlCache.cacheType === 'RedisCache') {
        purgeRedisCache(graphqlCache);
      } else if (graphqlCache.cacheType === 'InMemoryLRUCache') {
        purgeInMemoryLRUCache(graphqlCache);
      } else {
        strapi.log.info("Cache type not support, Please make sure cacheType has been injected to cache object in graphql config");
        response = 'CACHE TYPE NOT SUPPORT';
      }
      response = 'OK';
    } catch (error) {
      response = error.message;
      strapi.log.info('Error', error);
    }
    try {
      const items = getConfig().cache_control_matrix;
      const max_age = getConfig().max_age;
      purgeCacheRecord({'cacheType': 'short_cache' , 'items': items.filter(item => item.maxAge == max_age).join(','), 'invalidationId': '', 'status': response});      
    } catch (error) {
      strapi.log.info('Error', error);
    }
    return response;
  }
});
