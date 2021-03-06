(() => {
  "use strict";

  const fs = require("fs");
  const FormUtils = require(`${__dirname}/../form/utils`);
  
  /**
   * Report controller
   */
  class ReportController {

    /**
     * Constructor
     * 
     * @param {Object} formConfig form config 
     */
    constructor(formConfig) {
      this.formConfig = formConfig;
    }

    /**
     * Returns report list
     * 
     * @returns {Promise} Promise for list of reports
     */
    async getReportList() {
      const reports = await this.getReports();

      return Object.keys(reports)
        .map(key => {
          return {
            slug: key,
            name: reports[key].getName()
          }
        });
    }

    /**
     * Returns all reports
     * 
     * @returns {Promise} Promise for all reports
     */
    async getReports() {
      const files = await this.getReportFiles(this.formConfig);
      const result = {};

      files.forEach((reportFile) => {
        const slug = reportFile.file.substring(0, reportFile.file.lastIndexOf('.'));
        const instance = new (require(`${reportFile.folder}/${reportFile.file}`))();
        result[slug] = instance;
      });

      return result;
    }

    /**
     * Returns report
     * 
     * @param {String} reportSlug report slug
     * @param {Onject} metaform metaform
     * @param {Array} replies 
     * @return {Promise} promise for report 
     */
    async getReport(reportSlug, metaform, replies) {
      const reports = await this.getReports();
      return reports[reportSlug].getReport(metaform, replies);
    }

    /**
     * Returns filters for report
     * 
     * @param {String} reportSlug report slug
     * @param {Onject} metaform metaform
     * @return {Promise} promise for filters
     */
    async getFilters(reportSlug, metaform) {
      const reports = await this.getReports();
      const filters = await reports[reportSlug].getFilters(metaform);

      return filters
        .map((filter) => {
          switch (filter.type) {
            case "field":
              return this.getFieldFilter(metaform, filter);
            case "reply-time":
              return this.getReplyTimeFilter(metaform, filter);
            default:
              break;
          }
        })
        .filter((filter) => {
          return !!filter; 
        });
    }

    /**
     * Add title to filter
     * 
     * @param {Object} metaform metaform
     * @param {Object} filter filter
     * @return {Object} object filter
     */
    getReplyTimeFilter(metaform, filter) {
      const options = {};

      switch (filter.field) {
        case "createdBefore":
          options.title = "Luotu ennen";
        break;
        case "createdAfter":
          options.title = "Luotu jälkeen";
        break;
        case "modifiedBefore":
          options.title = "Muokattu ennen";
        break;
        case "modifiedAfter":
          options.title = "Muokattu jälkeen";
        break;
      }

      return Object.assign(filter, options);
    }

    /**
     * Returns field filter's name and text
     * 
     * @param {Object} metaform metaform
     * @param {Object} filter filter
     * @return {Object} object filter
     */
    getFieldFilter(metaform, filter) {
      const field = FormUtils.getField(metaform, filter.field);
      if (!field) {
        return null;
      }

      const options = {
        title: field.title
      };

      switch (field.type) {
        case "radio":
        case "select":
          options.options = (field.options || [])
            .filter((option) => {
              return option && option.name;
            })
            .map((option) => {
              return {
                name: option.name,
                text: option.text 
              };
            }); 
        break;
      }

      return Object.assign(filter, options);
    }

    /**
     * Lists report files
     * 
     * @returns {Promise} promise of report files
     */
    getReportFiles() {
      const folder = this.formConfig.reports.directory;

      return new Promise((resolve, reject) => {
        fs.readdir(folder, (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files.map((file) => {
              return {
                folder: folder,
                file: file
              };
            }));
          }
        });
      });
    }

  }

  module.exports = ReportController;

})();
