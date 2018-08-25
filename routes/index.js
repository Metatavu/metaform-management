(() => {
  'use strict';

  const AdminExportThemeRoutes = require(`${__dirname}/admin-report-themes-routes`);
  const AdminFormRoutes = require(`${__dirname}/admin-form-routes`);

  const form = require(`${__dirname}/components/form`);
  const admin = require(`${__dirname}/components/admin`);
  const navigation = require(`${__dirname}/components/navigation`);
  const system = require(`${__dirname}/components/system`);
  
  /**
   * Middleware for authenticating request with roles
   * 
   * @param {Array} allowedRoles list of roles
   * @param {Object} keycloak Keycloak instance
   */
  function authenticate(allowedRoles, keycloakMultirealm) {
    return keycloakMultirealm.protect((token, req) => {
      for (let i = 0; i < allowedRoles.length; i++) {
        if (token.hasRole(allowedRoles[i])) {
          req.metaform = {
            token: token
          };
          return true;
        }
      }

      return false;
    });
  }

  module.exports = (app, keycloakMultirealm) => {

    /*
     * Navigation
     */

    app.get("/", navigation.renderIndex);

    /*
     * Forms
     */

    app.post('/formReply', form.postReply);
    app.post('/formReply/:id', authenticate(['manager', 'admin'], keycloakMultirealm), form.updateReply);
    app.post('/reply', form.postReply);

    /*
     *  Admin
     */

    app.get('/admin', authenticate(['manager', 'admin'], keycloakMultirealm), admin.renderAdminView);
    app.get('/admin/replies/:id', authenticate(['manager', 'admin'], keycloakMultirealm), admin.getFormReply);
    app.delete('/admin/replies/:id', authenticate(['manager', 'admin'], keycloakMultirealm), admin.deleteReply);
    app.get('/admin/fields', authenticate(['manager', 'admin'], keycloakMultirealm), admin.getFields);
    app.get('/admin/export/xlsx', authenticate(['manager', 'admin'], keycloakMultirealm), admin.createXlsx);
    app.get('/admin/report', authenticate(['manager', 'admin'], keycloakMultirealm), admin.renderReportView);
    app.get('/admin/getreportdata/:slug', authenticate(['manager', 'admin'], keycloakMultirealm), admin.getReportData);
    app.get('/admin/getreportfilters/:slug', authenticate(['manager', 'admin'], keycloakMultirealm), admin.getReportFilters);
    
    /**
     * System
     */

    app.get('/system/ping', system.ping);

    new AdminExportThemeRoutes(app, keycloakMultirealm);
    new AdminFormRoutes(app, keycloakMultirealm);
  };

})();
