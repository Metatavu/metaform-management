/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const AbstractRoutes = require(`${__dirname}/abstract-routes`);
  const database = require(`${__dirname}/../database`);
  const mailer = require(`${__dirname}/../services/mailer`);

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

      app.get("/formDraft", this.catchAsync(this.getDraft.bind(this)));
      app.post("/formDraft", this.catchAsync(this.createDraft.bind(this)));
      app.post("/formDraft/{id}/email", this.catchAsync(this.sendDraftToEmail.bind(this)));
    }

    /**
     * Creates new draft
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     */
    async createDraft (req, res) {
      try {
        const reply = req.body;
        const response = await database.createFormDraft(reply, uuid());
        res.status(200).send(response);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
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

      try {
        let html = `<p>Käytä alla olevaa linkkiä jatkaaksesi lomakkeen täyttämistä.</p>`;
        html += `<a href="${req.body.draftUrl}">${req.body.draftUrl}</a>`;
        html += `<p>Tämä on automaattinen viesti, älä vastaa.</p>`;
        
        mailer.sendMail(req.body.email, 'Linkki tallennettuun lomakkeeseen', html, (err) => {
          if (err) {
            return res.status(400).send(err);
          } 

          return res.status(200).send();
        });
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    }

    /**
     * Get draft
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     */
    async getDraft (req, res) {
      try {
        const id = req.query.draftId;
        const response = await database.findFormDraft(id);

        if (!response) {
          return res.status(404).send("Not found");
        }

        res.status(200).send(response);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    }

  }

  module.exports = DraftRoutes;

})();

