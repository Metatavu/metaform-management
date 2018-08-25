/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const ApiClient = require(`${__dirname}/../api-client`);
  const AbstractRoutes = require(`${__dirname}/abstract-routes`);

  /**
   * Export theme routes
   */
  class ExportThemeRoutes extends AbstractRoutes {
    
    /**
     * Constructor for category routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      super(app, keycloakMultirealm);

      // TODO: proper roles

      app.get('/admin/export-themes', this.authenticate(['manager', 'admin']), this.catchAsync(this.getExportThemes.bind(this)));
      app.get('/admin/export-themes/:themeId', this.authenticate(['manager', 'admin']), this.catchAsync(this.getEditExportTheme.bind(this)));
      app.post('/admin/export-themes/:themeId', this.authenticate(['manager', 'admin']), this.catchAsync(this.postEditExportTheme.bind(this)));
      app.get('/admin/export-themes/:themeId/files/:fileId', this.authenticate(['manager', 'admin']), this.catchAsync(this.getEditExportThemeFile.bind(this)));
      app.post('/admin/export-themes/:themeId/files/:fileId', this.authenticate(['manager', 'admin']), this.catchAsync(this.postEditExportThemeFile.bind(this)));
      
      app.post('/ajax/admin/export-themes/new', this.authenticate(['manager', 'admin']), this.catchAsync(this.postAjaxCreateExportTheme.bind(this)));
      app.post('/ajax/admin/export-themes/:themeId/files/new', this.authenticate(['manager', 'admin']), this.catchAsync(this.postAjaxCreateExportThemeFile.bind(this)));
    }

    /**
     * Renders export themes view
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getExportThemes (req, res) {
      const realm = res.locals.formConfig.realm;

      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemesApi = apiClient.getExportThemesApi();

      const exportThemes = await exportThemesApi.listExportThemes(realm);
  
      res.render("admin-export-themes", {
        exportThemes: exportThemes
      });
    }
  
    /**
     * Renders export theme edit view
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getEditExportTheme (req, res) {
      const themeId = req.params.themeId;
      const realm = res.locals.formConfig.realm;
  
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemesApi = apiClient.getExportThemesApi();
      const exportThemeFilesApi = apiClient.getExportThemeFilesApi();
  
      const exportTheme = await exportThemesApi.findExportTheme(realm, themeId);
      if (!exportTheme) {
        res.sendStatus(404);
        return;
      }
  
      const exportThemes = await exportThemesApi.listExportThemes(realm);
      const exportThemeFiles = await exportThemeFilesApi.listExportThemeFiles(realm, themeId);
      res.render("admin-edit-export-theme", {
        exportTheme: exportTheme,
        exportThemeFiles: exportThemeFiles,
        exportThemes: exportThemes
      });
    }
  
    /**
     * Handles export theme saving
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postEditExportTheme (req, res) {
      const themeId = req.params.themeId;
      const realm = res.locals.formConfig.realm;
  
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemesApi = apiClient.getExportThemesApi();
  
      const exportTheme = await exportThemesApi.findExportTheme(realm, themeId);
      if (!exportTheme) {
        res.sendStatus(404);
        return;
      }
  
      exportTheme.name = req.body.name;
      exportTheme.locales = req.body.locales;
      exportTheme.parentId = req.body.parentId || null;
      
      await exportThemesApi.updateExportTheme(realm, themeId, exportTheme);
  
      res.redirect(`/admin/export-themes/${themeId}`);
    }
  
    /**
     * Renders export theme file editor
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getEditExportThemeFile (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemeFilesApi = apiClient.getExportThemeFilesApi();
      const realm = res.locals.formConfig.realm;
      const themeId = req.params.themeId;
      const fileId = req.params.fileId;
      
      const exportThemesApi = apiClient.getExportThemesApi();
  
      const exportTheme = await exportThemesApi.findExportTheme(realm, themeId);
      if (!exportTheme) {
        res.sendStatus(404);
        return;
      }
  
      const exportThemeFile = await exportThemeFilesApi.findExportThemeFile(realm, themeId, fileId);
      if (!exportThemeFile) {
        res.sendStatus(404);
        return;
      }
  
      if (exportThemeFile.themeId !== exportTheme.id) {
        res.sendStatus(404);
        return;
      }
  
      res.render("admin-edit-export-theme-file", {
        exportThemeFile: exportThemeFile
      });
    }
  
    /**
     * Handles export theme file saving
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postEditExportThemeFile (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemeFilesApi = apiClient.getExportThemeFilesApi();
      const realm = res.locals.formConfig.realm;
      const themeId = req.params.themeId;
      const fileId = req.params.fileId;
      
      const result = await exportThemeFilesApi.updateExportThemeFile(realm, themeId, fileId, {
        "themeId": themeId,
        "path": req.body.path,
        "content": req.body.content
      });
  
      res.redirect(`/admin/export-themes/${result.themeId}/files/${result.id}`);
    }
  
    /**
     * Handles export theme create ajax call
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postAjaxCreateExportTheme (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemesApi = apiClient.getExportThemesApi();
  
      const realm = res.locals.formConfig.realm;
      
      const result = await exportThemesApi.createExportTheme(realm, {
        "name": `new-theme-${new Date().getTime()}`
      });
  
      res.send(result);
    }
  
    /**
     * Handles export theme file create ajax call
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postAjaxCreateExportThemeFile (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const exportThemeFilesApi = apiClient.getExportThemeFilesApi();
      const realm = res.locals.formConfig.realm;
      const themeId = req.params.themeId;
      
      const result = await exportThemeFilesApi.createExportThemeFile(realm, themeId, {
        "themeId": themeId,
        "path": `/new-path/${new Date().getTime()}`,
        "content": "content"
      });
  
      res.send(result);
    }

  }

  module.exports = ExportThemeRoutes;

})();

