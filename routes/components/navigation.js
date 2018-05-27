(() => {
  "use strict";

  const config = require("nconf");
  const ApiClient = require(`${__dirname}/../../api-client`);
  const anonymousAuth = require(`${__dirname}/../../anonymous-auth`);
  const FormUtils = require(__dirname + '/../../form/utils');

  /**
   * Renders form
   */
  exports.renderIndex = async (req, res) => {
    try {
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
      const accessToken = await anonymousAuth.getAccessToken(realm);
      const apiClient = new ApiClient(accessToken);
      const metaformsApi = apiClient.getMetaformsApi();
      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }
      
      res.render("form", {
        metaform: FormUtils.filterMetaformContextFields(metaform, "FORM")
      });
      
    } catch (e) {
      res.status(500).send(e);
    }
  };
  
})();