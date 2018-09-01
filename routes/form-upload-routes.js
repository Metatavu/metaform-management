/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const request = require("request");
  const config = require("nconf");
  const AbstractRoutes = require(`${__dirname}/abstract-routes`);

  /**
   * Admin form routes
   */
  class FormUploadRoutes extends AbstractRoutes {
    
    /**
     * Constructor for category routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      super(app, keycloakMultirealm);

      app.get("/upload/:id", this.authenticate(["manager", "admin"]), this.catchAsync(this.getUpload.bind(this)));
      app.post("/upload/", this.catchAsync(this.postUpload.bind(this)));
    }

    /**
     * Handles upload get request
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    getUpload (req, res) {
      const attachmentId = req.params.id;
      const realm = res.locals.formConfig.realm;
      const apiUri = config.get("api:url");
      const token = req.metaform.token.token;
      const requestOptions = {
        url: `${apiUri}/realms/${realm}/attachments/${attachmentId}/data`,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      };

      request(requestOptions).pipe(res);
    }

    /**
     * Handles upload post request
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    postUpload (req, res) {
      const apiUri = config.get("api:url");
      const uploadUrl = apiUri.replace(/v1$/,'fileUpload');
      const serverRequest = req.pipe(request(uploadUrl));

      serverRequest.on("response", (serverResponse) => {
        serverResponse.on("data", (data) => {
          const jsonResponse = JSON.parse(data.toString("utf8"));
          res.send([{
            originalname: jsonResponse.fileName,
            filename: jsonResponse.fileName,
            _id: jsonResponse.fileRef
          }]);  
        });
      });

      serverRequest.on("error", (err) => {
        console.error(err);
        res.status(500).send(err);
      });
      
    }

  }

  module.exports = FormUploadRoutes;

})();

