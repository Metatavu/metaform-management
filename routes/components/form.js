(() => {
  'use strict';
  
  const config = require("nconf");
  const util = require('util');
  const FormUtils = require(__dirname + '/../../form/utils');
  const ApiClient = require(`${__dirname}/../../api-client`);
  const anonymousAuth = require(`${__dirname}/../../anonymous-auth`);

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
          console.log(reply.data[field.name]);
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
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
      const accessToken = await anonymousAuth.getAccessToken(realm);
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

      // Sanitize body?
      
      const payload = {
        data: req.body
      };

      console.log(payload);

      const reply = await repliesApi.createReply(realm, formId, payload);
      if (reply) {
        res.send(reply);
      } else {
        res.status(500).send("Failed to save reply");
      }

      // TODO: Notifications.notify(Form.notifications, reply);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
})();