(() => {
  'use strict';

  const config = require("nconf");
  const MetaformApiClient = require("metaform-api-client");
  
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
     * @returns {MetaformApiClient.MetaformsApi} initialized MetaformsApi instance
     */
    getMetaformsApi() {
      return new MetaformApiClient.MetaformsApi(this.createClient());
    }

    /**
     * Returns initialized RepliesApi instance
     * 
     * @returns {MetaformApiClient.RepliesApi} initialized RepliesApi instance
     */
    getRepliesApi() {
      return new MetaformApiClient.RepliesApi(this.createClient());
    }

    /**
     * Returns initialized AttachmentsApi instance
     * 
     * @returns {MetaformApiClient.AttachmentsApi} initialized AttachmentsApi instance
     */
    getAttachmentsApi() {
      return new MetaformApiClient.AttachmentsApi(this.createClient());
    }

    /**
     * Returns initialized ExportThemesApi instance
     * 
     * @returns {MetaformApiClient.ExportThemesApi} initialized ExportThemesApi instance
     */
    getExportThemesApi() {
      return new MetaformApiClient.ExportThemesApi(this.createClient());
    }

    /**
     * Returns initialized ExportThemeFilesApi instance
     * 
     * @returns {MetaformApiClient.ExportThemeFilesApi} initialized ExportThemeFilesApi instance
     */
    getExportThemeFilesApi() {
      return new MetaformApiClient.ExportThemeFilesApi(this.createClient());
    }

    /**
     * Returns initialized EmailNotificationsApi instance
     * 
     * @returns {MetaformApiClient.EmailNotificationsApi} initialized ExportThemeFilesApi instance
     */
    getEmailNotificationsApi() {
      return new MetaformApiClient.EmailNotificationsApi(this.createClient());
    }

    /**
     * Creates initialized API client
     * 
     * @returns {MetaformApiClient.ApiClient} initialized API client instance
     */
    createClient() {
      const client = new MetaformApiClient.ApiClient();
      client.basePath = this.apiUrl;
      client.timeout = 60000 * 5;
      client.authentications.bearer = Object.assign({}, client.authentications.bearer, {
        apiKeyPrefix: 'Bearer',
        apiKey: this.accessToken
      });

      return client;
    }
    
  }

  module.exports = ApiClient;

})();