/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const ApiClient = require(`${__dirname}/../api-client`);
  const AbstractRoutes = require(`${__dirname}/abstract-routes`);
  const config = require("nconf");
  const Promise = require("bluebird");

  /**
   * Admin form routes
   */
  class AdminFormRoutes extends AbstractRoutes {
    
    /**
     * Constructor for category routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      super(app, keycloakMultirealm);

      app.get("/admin/form", this.realmRole(["metaform-admin"]), this.catchAsync(this.getAdminForm.bind(this)));
      app.post("/admin/form", this.realmRole(["metaform-admin"]), this.catchAsync(this.postAdminForm.bind(this)));
    }

    /**
     * Renders form admin view
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getAdminForm (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const metaformsApi = apiClient.getMetaformsApi();
      const exportThemesApi = apiClient.getExportThemesApi();
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
      const exportThemes = await exportThemesApi.listExportThemes(realm);

      let formJson = {};
      let title = null;
      let allowAnonymous = null;
      let exportThemeId = null;
      let allowDrafts = null;

      const metaform = formId != null ? await metaformsApi.findMetaform(realm, formId) : null;
      console.log(metaform);
      if (metaform) {
        formJson = {
          sections: metaform.sections,
          scripts: metaform.scripts
        };

        title = metaform.title;
        allowAnonymous = metaform.allowAnonymous;
        allowDrafts = metaform.allowDrafts;
        exportThemeId = metaform.exportThemeId;
      }      

      res.render("admin-edit-form", {
        title: title,
        exportThemeId: exportThemeId,
        allowAnonymous: allowAnonymous, 
        allowDrafts: allowDrafts,
        formJson: JSON.stringify(formJson, null, 2),
        exportThemes: exportThemes 
      });
    }
  
    /**
     * Handles form saving
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postAdminForm (req, res) {
      const realm = res.locals.formConfig.realm;
      const apiClient = new ApiClient(req.metaform.token.token);
      const metaformsApi = apiClient.getMetaformsApi();
      const formId = res.locals.formConfig.id;
      const allowAnonymous = req.body["allow-anonymous"] === "true";
      const exportThemeId = req.body["export-theme-id"];
      const allowDrafts = req.body["allow-drafts"] === "true";
      
      const formJson = JSON.parse(req.body["form-json"] || "{}");
      if (formJson) {
        const title = req.body.title;
  
        if (!formId) {
          const metaform = await metaformsApi.createMetaform(realm, {
            allowAnonymous: allowAnonymous,
            allowDrafts: allowDrafts,
            title: title,
            sections: formJson.sections,
            scripts: formJson.scripts,
            exportThemeId: exportThemeId
          });

          if (metaform) {
            config.set(`forms:${res.locals.formHostname}:id`, metaform.id);
            await this.saveConfig();
            res.redirect("/admin/form");
          } else {
            res.status(500).send("Failed to create new Metaform");
            return;
          }
        } else {
          const metaform = await metaformsApi.findMetaform(realm, formId);

          metaform.title = title;
          metaform.allowAnonymous = allowAnonymous;
          metaform.allowDrafts = allowDrafts;
          metaform.sections = formJson.sections;
          metaform.scripts = formJson.scripts;
          metaform.exportThemeId = exportThemeId;

          await metaformsApi.updateMetaform(realm, formId, metaform);

          res.redirect("/admin/form");
        }
      } else {
        res.status(400).send("Content is required");
        return;
      }
    }

    /**
     * Saves nconf
     * 
     * @return {Promise} promise for save result
     */
    saveConfig() {
      return new Promise((resolve, reject) => {
        config.save((err) => {
          if (err) {
            reject(err);      
          } else {
            resolve();
          }
        });
      });
    }

  }

  module.exports = AdminFormRoutes;

})();

