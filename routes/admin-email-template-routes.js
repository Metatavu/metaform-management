/*jshint esversion: 6 */
/* global __dirname */

(() => {
  "use strict";

  const ApiClient = require(`${__dirname}/../api-client`);
  const AbstractRoutes = require(`${__dirname}/abstract-routes`);
  const MetaformApiClient = require("metaform-api-client");
  const EmailNotification = MetaformApiClient.EmailNotification;

  /**
   * Export theme routes
   */
  class AdminEmailNotificationRoutes extends AbstractRoutes {
    
    /**
     * Constructor for category routes class
     * 
     * @param {Object} app Express app
     * @param {Object} keycloakMultirealm keycloakMultirealm
     */
    constructor (app, keycloakMultirealm) {
      super(app, keycloakMultirealm);

      app.get('/admin/email-notifications', this.realmRole(['metaform-admin']), this.catchAsync(this.getEmailNotifications.bind(this)));
      app.get('/admin/email-notifications/:notificationId', this.realmRole(['metaform-admin']), this.catchAsync(this.getEditEmailNotification.bind(this)));
      app.post('/admin/email-notifications/:notificationId', this.realmRole(['metaform-admin']), this.catchAsync(this.postEditEmailNotification.bind(this)));
      app.post('/ajax/admin/email-notifications/new', this.realmRole(['metaform-admin']), this.catchAsync(this.postAjaxCreateEmailNotification.bind(this)));
    }

    /**
     * Renders email notifications view
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getEmailNotifications (req, res) {
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;

      const apiClient = new ApiClient(req.metaform.token.token);
      const emailNotificationsApi = apiClient.getEmailNotificationsApi();

      const emailNotifications = await emailNotificationsApi.listEmailNotifications(realm, formId);
  
      res.render("admin-email-notifications", {
        emailNotifications: emailNotifications
      });
    }

    /**
     * Renders email notification edit view
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async getEditEmailNotification (req, res) {
      const notificationId = req.params.notificationId;
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
  
      const apiClient = new ApiClient(req.metaform.token.token);
      const emailNotificationsApi = apiClient.getEmailNotificationsApi();
  
      const emailNotification = await emailNotificationsApi.findEmailNotification(realm, formId, notificationId);
      if (!emailNotification) {
        res.sendStatus(404);
        return;
      }

      res.render("admin-edit-email-notification", {
        emailNotification: emailNotification
      });
    }

    /**
     * Handles email notification saving
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postEditEmailNotification (req, res) {
      const notificationId = req.params.notificationId;
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
  
      const apiClient = new ApiClient(req.metaform.token.token);
      const emailNotificationsApi = apiClient.getEmailNotificationsApi();
      
      const emailNotification = await emailNotificationsApi.findEmailNotification(realm, formId, notificationId);
      if (!emailNotification) {
        res.sendStatus(404);
        return;
      }

      emailNotification.subjectTemplate = req.body.subjectTemplate;
      emailNotification.contentTemplate = req.body.contentTemplate;
      emailNotification.emails = (req.body.emails || '').split(',');
      
      await emailNotificationsApi.updateEmailNotification(realm, formId, notificationId, emailNotification);
  
      res.redirect(`/admin/email-notifications/${notificationId}`);
    }

    /**
     * Handles email notification create ajax call
     * 
     * @param {Express.Request} req client request object
     * @param {Express.Response} res server response object
     **/
    async postAjaxCreateEmailNotification (req, res) {
      const apiClient = new ApiClient(req.metaform.token.token);
      const emailNotificationsApi = apiClient.getEmailNotificationsApi();
  
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;

      const notification = EmailNotification.constructFromObject({
        "subjectTemplate": "subject",
        "contentTemplate": "content",
        "emails": []        
      });

      const result = await emailNotificationsApi.createEmailNotification(realm, formId, notification);  
      res.send(result);
    }

  }

  module.exports = AdminEmailNotificationRoutes;

})();

