module.exports = {
  // @todo change route to api and make sure protected from public
  type: 'admin', // other type available: content-api.
  routes: [
    {
      method: 'GET',
      path: '/purge_cdn',
      handler: 'cacheController.purge_cdn',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/purge_all',
      handler: 'cacheController.purge_all',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/short_cache',
      handler: 'cacheController.short_cache',
      config: {
        policies: [],
        auth: false,
      },
    },  
    {
      method: 'GET',
      path: '/',
      handler: 'cacheController.index',
      config: {
        policies: [],
        auth: false,
      },
    },  
  ]
};


