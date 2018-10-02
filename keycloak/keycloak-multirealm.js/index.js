(() => {
  "use strict";

  const async = require("async");
  const config = require("nconf");
  const Keycloak = require("keycloak-connect");
  
  /**
   * Multirealm support for Keycloak connect
   */
  class KeycloakMultirealm {

    /**
     * Constructor
     * 
     * @param {OBject} config config 
     */
    constructor(config) {
      this.config = config;
      this.cache = {};
    }
    
    /**
     * Obtain a middleware for Keycloak 
     * 
     * This method mimics original Keycloak middleware method
     * 
     * @param {Object} options options
     * @returns Keycloak middleware
     */
    middleware(options) {
      return (req, res, next) => {
        const instance = this.getInstance(req, res);
        const middlewares = instance.middleware.call(instance, options).map((middleware) => {
          return (middleNext) => {
            return middleware.call(instance, req, res, middleNext);
          };
        });

        async.series(middlewares, next);
      };
    }
    
    /**
     * Apply protection middleware to an application or specific URL.
     * 
     * This method mimics original Keycloak protect method
     * 
     * @param {String} spec The protection spec (optional)
     */
    protect(spec) {
      return (req, res, next) => {
        const instance = this.getInstance(req, res);
        const protectMethod = instance.protect.call(instance, spec);
        return protectMethod(req, res, next);
      };
    }

    /**
     * Returns Keycloak instance for a request
     * 
     * @param {Object} req HTTP request
     * @param {Object} res HTTP response
     * @return Keycloak instance for a request
     */
    getInstance(req, res) {
      const cacheKey = this.getCacheKey(req, res);
      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = new Keycloak(this.config, this.getKeycloakConfig(req, res));
      }

      return this.cache[cacheKey];
    }

    /**
     * Returns from config for a request
     * 
     * @param {Object} req HTTP request
     * @param {Object} res HTTP response
     * @return From config  for a request
     */
    resolveFormConfig(req, res) {
      const host = req.get("host");
      const portIndex = host.indexOf(":");
      const hostname = portIndex > -1 ? host.substring(0, portIndex) : host; 
      const formConfig = config.get(`forms:${hostname}`);
      return formConfig;
    }

    /**
     * Returns cache key for a request
     * 
     * @param {Object} req HTTP request
     * @param {Object} res HTTP response
     * @return cache key for a request
     */
    getCacheKey(req, res) {
      if (res.locals.formConfig) {
        const formConfig = res.locals.formConfig;
        return `${formConfig.realm}:${formConfig.keycloak.resource}`;
      }

      return null;
    }

    /**
     * Returns keycloak config for a request
     * 
     * @param {Object} req HTTP request
     * @param {Object} res HTTP response
     * @return keycloak config for a request
     */
    getKeycloakConfig(req, res) {
      const host = req.get("host");
      const portIndex = host.indexOf(":");
      const hostname = portIndex > -1 ? host.substring(0, portIndex) : host; 
      const formConfig = config.get(`forms:${hostname}`);
      return Object.assign(config.get("keycloak") || {}, formConfig.keycloak || {});
    }
  }

  module.exports = KeycloakMultirealm;

})();