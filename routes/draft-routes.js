/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const AbstractRoutes = require(`${__dirname}/abstract-routes`);
  const database = require(`${__dirname}/../database`);
  const mailer = require(`${__dirname}/../services/mailer`);
  const uuid = require("uuid");

  /**
   * Draft routes
   */
  class DraftRoutes extends AbstractRoutes {
    
    /**
     * Constructor for category routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      super(app, keycloakMultirealm);

      app.get("/formDraft/:id", this.catchAsync(this.getDraft.bind(this)));
      app.post("/formDraft", this.catchAsync(this.createDraft.bind(this)));
      app.post("/formDraft/:id/email", this.catchAsync(this.sendDraftToEmail.bind(this)));
    }

    /**
     * Creates new draft
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     */
    async createDraft (req, res) {
      if (!req.body.formData) {
        return res.status(400).send("formData is required");
      }

      const draft = await database.createFormDraft(uuid(), JSON.stringify(req.body.formData));

      res.status(200).send(this.translateDraft(draft));
    }

    /**
     * Send draft to email
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     */
    async sendDraftToEmail (req, res) {
      if (!req.body.email || !req.body.draftUrl) {
        return res.status(400).send("Did not receive email address or URL to draft");
      }

      const id = req.params.id;
      const draft = await database.findFormDraftById(id);
      if (!draft) {
        return res.status(404).send("Not found");
      }
      
      let html = `<p>Käytä alla olevaa linkkiä jatkaaksesi lomakkeen täyttämistä.</p>`;
      html += `<a href="${req.body.draftUrl}">${req.body.draftUrl}</a>`;
      html += `<p>Tämä on automaattinen viesti, älä vastaa.</p>`;
      
      mailer.sendMail(req.body.email, 'Linkki tallennettuun lomakkeeseen', html, (err) => {
        if (err) {
          return res.status(400).send(err);
        } 

        return res.status(200).send();
      });
    }

    /**
     * Get draft
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     */
    async getDraft (req, res) {
      const id = req.params.id;
      const draft = await database.findFormDraftById(id);
      if (!draft) {
        return res.status(404).send("Not found");
      }

      res.status(200).send(this.translateDraft(draft));
    }

    /**
     * Translates database draft into REST draft
     * 
     * @param {Object} draft database draft
     * @returns {Object} REST draft 
     */
    translateDraft(draft) {
      if (!draft) {
        return null;
      }

      return {
        id: draft.id,
        formData: JSON.parse(draft.formData)
      };

    }

  }

  module.exports = DraftRoutes;

})();

