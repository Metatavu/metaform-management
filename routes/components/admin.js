(() => {
  'use strict';

  const FormUtils = require(__dirname + '/../../form/utils');
  const moment = require('moment');
  const xlsx = require('node-xlsx');
  const util = require('util');
  const pdf = require('html-pdf');
  const config = require('nconf');
  const request = require('request');
  const ApiClient = require(`${__dirname}/../../api-client`);
  const ReportController = require(`${__dirname}/../../reports/report-controller`);

  exports.renderAdminView = async (req, res) => {
    const includeFiltered = req.query.includeFiltered == "true";
    const allowDeletion = config.get('allow-deletion') || false;
    const apiClient = new ApiClient(req.metaform.token.token);
    const repliesApi = apiClient.getRepliesApi();
    const metaformsApi = apiClient.getMetaformsApi();
    const realm = res.locals.formConfig.realm;
    const formId = res.locals.formConfig.id;

    try {
      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }

      const listConfig = res.locals.formConfig.list || {};
      const listFilters = listConfig.filters || [];

      const fieldFilters = includeFiltered  ? null : listFilters
        .map((filter) => {
          const notEquals = filter["not-equals"]; 
          const equals = filter["equals"];
          const field = filter.field;
          const value = notEquals ? notEquals : equals;
          
          if (!field || !value) {
            return null;
          }

          const operator = notEquals ? "^" : ":";  

          return `${field}${operator}${value}`;
        })
        .filter((filter) => {
          return !!filter;
        });

      const replies = await repliesApi.listReplies(realm, formId, {
        createdBefore: null,
        createdAfter: null,
        modifiedBefore: null,
        modifiedAfter: null,
        includeRevisions: false,
        fields: fieldFilters
      });

      res.render('admin', { 
        title: 'Hallintapaneeli',
        fields: FormUtils.getContextFields(metaform, 'MANAGEMENT_LIST'),
        metafields: FormUtils.getMetaFields(metaform, 'MANAGEMENT_LIST'),
        replies: replies,
        includeFiltered: includeFiltered,
        allowDeletion: allowDeletion
      });
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  exports.renderReportView = async (req, res) => {
    const apiClient = new ApiClient(req.metaform.token.token);
    const repliesApi = apiClient.getRepliesApi();
    const metaformsApi = apiClient.getMetaformsApi();
    const realm = res.locals.formConfig.realm;
    const formId = res.locals.formConfig.id;

    const reportController = new ReportController(res.locals.formConfig);
    const reports = await reportController.getReportList();
    if (reports.length === 0) {
      res.send(404);
      return;
    }

    const selectedReport = req.query.report ? req.query.report : reports[0].slug;

    try {
      res.render("report", { 
        title: 'Hallintapaneeli',
        reports: reports,
        selectedReport: selectedReport
      });
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  exports.getFormReply = async (req, res) => {
    try {
      const id = req.params.id;
      const format = req.query.format;
      const apiClient = new ApiClient(req.metaform.token.token);
      const repliesApi = apiClient.getRepliesApi();
      const metaformsApi = apiClient.getMetaformsApi();
      const attachmentsApi = apiClient.getAttachmentsApi();
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
  
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

      const adminViewModel = FormUtils.getAdminViewModel(metaform, reply);
      const metaFields = FormUtils.getMetaFields(metaform, "MANAGEMENT");

      if (format === 'pdf') {
        res.render('form-reply-print', {
          title: 'Vastaus',
          viewModel: adminViewModel,
          metafields: metaFields,
          formReply: reply
        }, function(err, html) {
          res.header("Content-Type", "application/pdf");
          pdf.create(html, {'border': '1cm'}).toStream(function(err, pdfStream){
            pdfStream.pipe(res);
          });
        });
      } else {
        const fileFields = FormUtils.getFieldNamesByType(metaform, "files");
        
        for (let fileFieldIndex = 0; fileFieldIndex < fileFields.length; fileFieldIndex++) {
          const fileField = fileFields[fileFieldIndex];
          reply.data[fileField] = await Promise.all((reply.data[fileField] || []).map(async (attachmentId) => {
            const attachment = await attachmentsApi.findAttachment(realm, attachmentId);
            return {
              fileData: attachment.id,
              originalname: attachment.name
            }
          }));
        }

        res.render('form-reply', {
          title: 'Vastaus',
          viewModel: adminViewModel,
          metafields: metaFields,
          formReply: reply,
          hasExportTheme: !!metaform.exportThemeId
        });
      }

    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
  exports.getReportFilters = async (req, res) => {
    try {
      const reportSlug = req.params.slug;
      const apiClient = new ApiClient(req.metaform.token.token);
      const repliesApi = apiClient.getRepliesApi();
      const metaformsApi = apiClient.getMetaformsApi();
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
  
      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }

      const reportController = new ReportController(res.locals.formConfig);
      res.send(await reportController.getFilters(reportSlug, metaform));
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
  exports.getReportData = async (req, res) => {
    try {
      const reportSlug = req.params.slug;
      const apiClient = new ApiClient(req.metaform.token.token);
      const repliesApi = apiClient.getRepliesApi();
      const metaformsApi = apiClient.getMetaformsApi();
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }
      
      const replies = await repliesApi.listReplies(realm, formId, filters);
      const reportController = new ReportController(res.locals.formConfig);
      res.send(await reportController.getReport(reportSlug, metaform, replies));
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  
  exports.getFields = async (req, res) => {
    try {
      const id = req.params.id;
      const format = req.query.format;
      const apiClient = new ApiClient(req.metaform.token.token);
      const repliesApi = apiClient.getRepliesApi();
      const metaformsApi = apiClient.getMetaformsApi();
      const realm = res.locals.formConfig.realm;
      const formId = res.locals.formConfig.id;
  
      const metaform = await metaformsApi.findMetaform(realm, formId);
      if (!metaform) {
        res.status(404).send("Not found");
        return;
      }

      const fields = FormUtils.getDataFields(metaform);

      res.send(fields);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  exports.deleteReply = (req, res) => {
    res.status(501).send("Not implemented");
  };

  exports.renderReplyPdf = async (req, res) => {
    const realm = res.locals.formConfig.realm;
    const formId = res.locals.formConfig.id;
    const replyId = req.params.id;
    const apiUri = config.get("api:url");
    const url = `${apiUri}/realms/${realm}/metaforms/${formId}/replies/${replyId}/export?format=PDF`;
    
    request.get({ 
      url: url, 
      encoding: null,
      headers : {
        "Authorization" : `Bearer ${req.metaform.token.token}`,
        "Accept-Language": "fi"
      }
    }, (err, httpResponse, body) => {
      if (err) {
        console.error(err);
        res.status(500).send(err);
      } else {
        res.header("Content-Type", "application/pdf");
        res.header("Content-Disposition", "attachment; filename=\"export.pdf\"");
        res.send(body);
      }
    });
  }

  exports.createXlsx = async (req, res) => {
    const apiClient = new ApiClient(req.metaform.token.token);
    const repliesApi = apiClient.getRepliesApi();
    const metaformsApi = apiClient.getMetaformsApi();
    const attachmentsApi = apiClient.getAttachmentsApi();
    const realm = res.locals.formConfig.realm;
    const formId = res.locals.formConfig.id;

    const metaform = await metaformsApi.findMetaform(realm, formId);
    if (!metaform) {
      res.status(404).send("Not found");
      return;
    }

    const fields = FormUtils.getDataFields(metaform);

    // TODO: Filtering?

    const replies = await repliesApi.listReplies(realm, formId, {
      createdBefore: null,
      createdAfter: null,
      modifiedBefore: null,
      modifiedAfter: null,
      includeRevisions: false
    });

    const header = [];    
    const rows = [];
    const fieldMap = {};
    const fieldNames = fields.map((field) => {
      return field.name;
    });

    fields.forEach((field) => {
      fieldMap[field.name] = field;
    });

    for (let i = 0; i < fieldNames.length; i++) {
      for (let j = 0; j < fields.length;j++) {
        if (fieldNames[i] === fields[j].name) {
          header.push(fields[j].title);
          break;
        } 
      }
    }

    const replyDatas = replies.map((reply) => {
      return reply.data;
    });

    rows.push(header);

    for (let i = 0; i < replyDatas.length; i++) {
      const row = [];
      const reply = replyDatas[i];

      for (let j = 0; j < fieldNames.length; j++) {
        const fieldName = fieldNames[j];
        const field = fieldMap[fieldName];
        const fieldType = field.type;

        let fieldValue = reply[fieldName];
        if (!fieldValue) {
          row.push('');
          continue;
        }
        
        switch (fieldType) {
          case "email":
          case "number":
          case "text":
          case "memo":
          break;
          case "select":
          case "radio":
            fieldValue = FormUtils.getOptionFieldValueText(field, fieldValue);            
          break;
          case "checklist":
            fieldValue = (Array.isArray(fieldValue) ? fieldValue : [fieldValue]).map((singleValue) => {
              return FormUtils.getOptionFieldValueText(field, singleValue);
            }).join(', ');
          break;
          case "date-time":
            fieldValue = moment(fieldValue).format('DD.MM.YYYY');
          break;
          case "files":
            const fileNames = await Promise.all((Array.isArray(fieldValue) ? fieldValue : [fieldValue]).map(async (attachmentId) => {
              const attachment = await attachmentsApi.findAttachment(realm, attachmentId);
              return attachment.name;
            }));

            fieldValue = fileNames.join(', ');
          break;
          case "table":
            const tableRows = fieldValue.map((row) => {
              const columnNames = Object.keys(row);
              const rowResult = [];
              
              for (let j = 0; j < columnNames.length; j++) {
                const columnName = columnNames[j];
                const columnValue = row[columnName];
                if (columnValue) {
                  const columnTitle = FormUtils.getTableColumnTitle(field, columnName);
                  rowResult.push(`${columnTitle}: ${columnValue}`);
                }
              }

              return rowResult.join(",");
            });

            fieldValue = tableRows.join(",");
          break;
          default:
            console.log(`Unkown field type ${fieldType} returning value as-is`);
          break;
        }

        row.push(fieldValue);
      }

      rows.push(row);
    }

    const buffer = xlsx.build([{name: 'Vastaukset', data: rows}]);
    res.setHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  };

  function stringifyObjects(objects) {
    const result = objects.map((o) => {
      return stringifyObject(o);
    });
    
    return result.join(' / ');
  }

  function stringifyObject(object) {
    const result = [];
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].startsWith('_')) {
        continue;
      }
      result.push(util.format('%s: %s', keys[i], object[keys[i]]));
    }
    
    return result.join(', ');
  }

})();
