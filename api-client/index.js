(() => {
  'use strict';

  const config = require('nconf');
  const MetaformApiClient = require('metaform-api-client');
  
  /**
   * Api client for Metaform API
   */
  class ApiClient {

    /**
     * Constructor
     * 
     * @param {String} accessToken access token 
     */
    constructor(accessToken) {
      this.apiUrl = config.get('api:url');
      this.accessToken = accessToken;
    }

    /**
     * Returns initialized MetaformsApi instance
     * 
     * @returns {Object} initialized MetaformsApi instance
     */
    getMetaformsApi() {
      return new MetaformApiClient.MetaformsApi(this.createClient());
    }

    /**
     * Returns initialized RepliesApi instance
     * 
     * @returns {Object} initialized RepliesApi instance
     */
    getRepliesApi() {
      return new MetaformApiClient.RepliesApi(this.createClient());
    }

    /**
     * Creates initialized API client
     * 
     * @returns {Object} initialized API client instance
     */
    createClient() {
      const client = new MetaformApiClient.ApiClient();
      client.basePath = this.apiUrl;
      client.authentications.bearer = Object.assign({}, client.authentications.bearer, {
        apiKeyPrefix: 'Bearer',
        apiKey: this.accessToken
      });

      return client;
    }
    
  }

  module.exports = ApiClient;

})();