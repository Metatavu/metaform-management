/*jshint esversion: 6 */
/* global __dirname, __filename */

(() => {
  "use strict";
  
  const Promise = require("bluebird");

  /**
   * Abstract base class for all route classes
   */
  class AbstractRoutes {
    
    /**
     * Constructor for abstract routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      this.app = app;
      this.keycloakMultirealm = keycloakMultirealm;
    }

    /**
     * Middleware for authenticating request with roles
     * 
     * @param {Array} allowedRoles list of roles
     * @param {Object} keycloak Keycloak instance
     */
    authenticate(allowedRoles) {
      return this.keycloakMultirealm.protect((token, req) => {
        for (let i = 0; i < allowedRoles.length; i++) {
          if (token.hasRole(allowedRoles[i])) {
            req.metaform = {
              token: token
            };

            return true;
          }
        }

        return false;
      });
    }

    /**
     * Catch unhandled promise errors
     * 
     * @param {function} handler handler function
     * @return {Function} decorated handler function
     */
    catchAsync(handler) {
      return (req, res) => {
        return Promise.resolve(handler(req, res)).catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
      };
    }
    
  }

  module.exports = AbstractRoutes;

})();

