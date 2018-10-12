(() => {
  'use strict';
  
  const config = require("nconf");
  const util = require('util');
  const FormUtils = require(__dirname + '/../../form/utils');
  const ApiClient = require(`${__dirname}/../../api-client`);
  const anonymousAuth = require(`${__dirname}/../../anonymous-auth`);
  const database = require(`${__dirname}/../../database`);
  const uuid = require('uuid/v4');
  const mailer = require(`${__dirname}/../../services/mailer`);

  exports.updateReply = async (req, res) => {
    try {
      const id = req.params.id;
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
      const apiClient = new ApiClient(req.metaform.token.token);
      const metaformsApi = apiClient.getMetaformsApi();
      const repliesApi = apiClient.getRepliesApi();

      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }

      const reply = await repliesApi.findReply(realm, formId, id);
      if (!reply) {
        res.status(404).send("Not found");
        return;
      }

      const fields = FormUtils.getContextFields(metaform, "MANAGEMENT");

      // Sanitize body?
      
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        if (field.flags && field.flags.managementEditable) {
          reply.data[field.name] = req.body[field.name];
        }
      }

      await repliesApi.updateReply(realm, formId, id, reply);
      res.status(200).send();

      // TODO: Notifications.notify(Form.notifications, reply);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
  exports.postReply = async (req, res) => {
    try {
      const formConfig = res.locals.formConfig;
      const realm = formConfig.realm;
      const formId =formConfig.id;
      const keycloak = Object.assign(config.get("keycloak") || {}, formConfig.keycloak || {});
      const accessToken = await anonymousAuth.getAccessToken(keycloak);
      const apiClient = new ApiClient(accessToken);
      const metaformsApi = apiClient.getMetaformsApi();
      const repliesApi = apiClient.getRepliesApi();

      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }
      
      const errors = FormUtils.validateRequest(req, metaform);
      if (errors) {
        console.error(errors);
        res.status(400).send(errors);
        return;
      }

      const payload = {
        data: FormUtils.getFormData(req, metaform)
      };

      const reply = await repliesApi.createReply(realm, formId, payload);
      if (reply) {
        res.send(reply);
      } else {
        res.status(500).send("Failed to save reply");
      }

    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  /**
   * Creates new draft
   */
  exports.createDraft = async (req, res) => {
    try {
      const reply = req.body;
      const dbConnection = new database();
      await dbConnection.initialize();

      const response = await dbConnection.createFormDraft(reply, uuid());
      res.status(200).send(response);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  /**
   * Send draft to email
   */
  exports.sendDraftToEmail = async (req, res) => {
    if (!req.body.email || !req.body.draftUrl) {
      return res.status(500).send("Did not receive email address or URL to draft");
    }

    try {
      let html = `<p>Käytä alla olevaa linkkiä jatkaaksesi lomakkeen täyttämistä.</p>`;
      html += `<a href="${req.body.draftUrl}">${req.body.draftUrl}</a>`;
      html += `<p>Tämä on automaattinen viesti, älä vastaa.</p>`;
      
      mailer.sendMail(req.body.email, 'Linkki tallennettuun lomakkeeseen', html, (err, body) => {
        if (err) {
          return res.status(400).send(err);
        } 

        return res.status(200).send();
      });
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  /**
   * Get draft
   */
  exports.getDraft = async (req, res) => {
    try {
      const id = req.query.draftId;
      const dbConnection = new database();
      await dbConnection.initialize();

      const response = await dbConnection.findFormDraft(id);

      if (response) {
        res.status(200).send(response);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
})();