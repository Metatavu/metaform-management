(() => {
  "use strict";

  const request = require("request");
  const config = require('nconf');

  /**
   * Anonymous authentication strategy
   */
  class AnonymousAuth {

    /**
     * Constructor for the anonymous authentication strategy
     */
    constructor() {
      this.accessToken = null;
      this.requireFreshToken = true;
      this.expiresSlack = 30;
    }

    /**
     * Returns access token
     * 
     * @param {String} realm Keycloak realm
     * @return {Promise} promise for access token
     */
    async getAccessToken(realm) {
      if (!this.accessToken || this.requireFreshToken) {
        const token = await this.getServiceAccountToken(realm);
        if (token.access_token) {
          this.accessToken = token.access_token;
          this.requireFreshToken = false;
          const refreshTimeout = (token.expires_in - this.expiresSlack) * 1000;

          setTimeout(() => {
            this.requireFreshToken = true;
          }, refreshTimeout);
        } else {
          console.error("Failed to get anonymous access token", token);
        }
      }

      return this.accessToken;
    }

    /**
     * Gets service account token from keycloak
     * 
     * @param {String} realm Keycloak realm
     * @return {Promise} promise for token
     */
    getServiceAccountToken(realm) {
      const clientId = config.get("keycloak:resource");
      const clientSecret = config.get("keycloak:credentials:secret");
      const url = `${config.get("keycloak:auth-server-url")}/realms/${realm}/protocol/openid-connect/token`;
      const passwordEncoded = new Buffer(`${clientId}:${clientSecret}`).toString("base64");
      const authorization = `Basic ${passwordEncoded}`;

      return new Promise((resolve, reject) => {
        request.post({ 
          url: url, 
          headers : {
            Authorization : authorization
          },
          form: {
            grant_type: "client_credentials"
          }
        }, (err, httpResponse, body) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(body)); 
          }
        });
      });
    }

  }

  module.exports = new AnonymousAuth();

})();