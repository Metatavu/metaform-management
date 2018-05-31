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
      const formConfig = res.locals.formConfig;
      const realm = formConfig.realm;
      const formId = formConfig.id;
      const keycloak = Object.assign(config.get("keycloak") || {}, formConfig.keycloak || {});
      const accessToken = await anonymousAuth.getAccessToken(keycloak);
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