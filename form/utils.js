(() => {
  "use strict";
  
  const _ = require("lodash");
  const util = require("util");
  const NOT_SAVED_FIELDS = ["logo", "submit", "small-text", "html"];

  /**
   * Utility class for handling forms
   */
  class FormUtils {

    /**
     * Lists all fields from metaform. 
     * 
     * @param {Object} metaform metaform
     * @return fields from metaform.
     */
    static getFields(metaform) {
      const fields = [];
      
      for (let i = 0; i < metaform.sections.length; i++) {
        const section = metaform.sections[i];
        const sectionFields = section.fields;
        for (let j = 0; j < sectionFields.length; j++) {
          fields.push(sectionFields[j]);
        }
      } 
      
      return fields;
    }

    /**
     * Finds a field single from a metaform
     * 
     * @param {Object} metaform metaform 
     * @param {String} fieldName field's name
     * @returns {Object} field 
     */
    static getField(metaform, fieldName) {
      return this.getFields(metaform).filter((field) => {
        return field.name === fieldName;
      }).splice(0, 1)[0];
    }

    /**
     * Returns field's title from a metaform or null if field is not present
     * 
     * @param {Object} metaform metaform 
     * @param {String} fieldName field's name
     * @returns {String} field name 
     */
    static getFieldTitle(metaform, fieldName) {
      const field = this.getField(metaform, fieldName);
      return field ? field.title : null;
    }

    /**
     * Lists data fields from metaform. 
     * 
     * @param {Object} metaform metaform
     * @return fields from metaform.
     */
    static getDataFields(metaform) {
      return FormUtils.getFields(metaform).filter((field) => {
        return NOT_SAVED_FIELDS.indexOf(field.type) === -1;
      });
    }

    /**
     * Lists fields by type from metaform. 
     * 
     * @param {Object} metaform metaform
     * @param {String} type type
     * @return fields from metaform.
     */
    static getFieldsByType(metaform, type) {
      return FormUtils.getFields(metaform).filter((field) => {
        return field.type === type;
      });
    }

    /**
     * Lists field names by type from metaform. 
     * 
     * @param {Object} metaform metaform
     * @param {String} type type
     * @return field names from metaform.
     */
    static getFieldNamesByType(metaform, type) {
      return FormUtils.getFieldsByType(metaform, type).map((field) => {
        return field.name;
      });
    }
    
    /**
     * Creates (cloned) version of input Metaform with fields 
     * filter to match specific context 
     * 
     * @param {Object} metaform metaform
     * @param {String} context context
     */
    static filterMetaformContextFields(metaform, context) {
      const result = JSON.parse(JSON.stringify(metaform));

      result.sections.forEach((section) => {
        section.fields = section.fields.filter((field) => {
          return !field.contexts || field.contexts.length === 0 || field.contexts.indexOf(context) > -1;
        });
      });

      return result;
    }
    
    /**
     * Lists fields from metaform that have given context
     * 
     * @param {Object} metaform metaform
     * @param {String} context context
     * @return context fields from metaform.
     */
    static getContextFields(metaform, context) {
      const fields = FormUtils.getFields(metaform);
      const result = [];
      
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if ((field.contexts||[]).indexOf(context) > -1) {
          result.push(field);
        }
      }
      
      return result;
    }
    
    /**
     * Lists meta fields from the form 
     * 
     * @param {Object} metaform metaform 
     * @param {String} context context
     * 
     * @returns {Array} list of meta fields 
     */
    static getMetaFields(metaform, context) {
      const metaFields = metaform.metafields || [];
      return _.filter(metaFields, (field) => {
        return (field.contexts||[]).indexOf(context) > -1;
      });
    }

    /**
     * Converts form to be viewable in admin view
     * 
     * @param {Object} metaform metaform  
     * @param {Object} reply reply
     * @returns {Object} translated form model
     */
    static getAdminViewModel(metaform, reply) {
      const viewModel = FormUtils.filterMetaformContextFields(metaform, "MANAGEMENT");

      const sections = _.filter(viewModel.sections, (section) => {
        if (!section["visible-if"]) {
          return true;
        }

        return FormUtils.validateFieldVisibilityRule(reply, section["visible-if"]);
      });
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionFields = section.fields;
        section.fields = _.filter(section.fields, (field) => { 
          if (!field["visible-if"]) {
            return true;
          }

          return FormUtils.validateFieldVisibilityRule(reply, field["visible-if"]); 
        }).map((field) => {
          return Object.assign(field, {
            readonly: !(field.flags && field.flags.managementEditable)
          });
        });
      }

      sections.forEach((section) => {
        section.fields.forEach((field) => {
          delete field["visible-if"];
        });

        delete section["visible-if"];
      });      
      
      return {
        "title": viewModel.title,
        "theme": viewModel.theme,
        "sections": sections
      };
    }

    /**
     * Evaluates visible-if rule 
     * 
     * @param {Object} reply reply reply
     * @param {Object} rule rule
     * @returns {Boolean} rule result 
     */
    static validateFieldVisibilityRule(reply, rule) {
      const replyData = reply.data;
      let isVisible = false;
      let analyzed = false;

      if (rule.field) {
        const valueSet = replyData[rule.field] !== undefined && replyData[rule.field] !== null && replyData[rule.field] !== "";
        const fieldValue = valueSet ? replyData[rule.field] : null;

        analyzed = true;
        
        if (rule.equals === true) {
          isVisible = valueSet;
        } else if (rule.equals) {
          isVisible = rule.equals === fieldValue;
        } else if (rule["not-equals"] === true) {
          isVisible = !valueSet;
        } else if (rule["not-equals"]) {
          isVisible = rule["not-equals"] !== fieldValue;
        }
      }

      if (Array.isArray(rule.and)) {
        let andResult = true;
        for (let i = 0; i < rule.and.length; i++) {
          const andSubRule = rule.and[i];
          andResult = andResult && FormUtils.validateFieldVisibilityRule(reply, andSubRule);
          if (!andResult) {
            break;
          }
        }
        isVisible = analyzed ? isVisible && andResult : andResult;
      }

      if (Array.isArray(rule.or)) {
        let orResult = false;
        for (let j = 0; j < rule.or.length; j++) {
          const orSubRule = rule.or[j];
          orResult = orResult || FormUtils.validateFieldVisibilityRule(reply, orSubRule);
          if (orResult) {
            break;
          }
        }
        isVisible = analyzed ? isVisible || orResult : orResult;
      }
      
      return isVisible;
    }

    /**
     * Evaluates field visible-if rules
     * 
     * @param {Object} reply reply reply
     * @param {Object} field field
     * @returns {Boolean} whether the field should be visible or not 
     */
    static validateFieldVisibilityRules(reply, field) {
      if (!field.visibilityRules) {
        return true;
      }
      
      for (let i = 0; i < field.visibilityRules.length; i++) {
        const rule = field.visibilityRules[i];
        if (!FormUtils.validateFieldVisibilityRule(reply, rule)) {
          return false;
        }
      }
      
      return true;
    }

    /**
     * Validates a request
     * 
     * @param {Object} req request objerct 
     * @param {Object} metaform metaform
     */
    static validateRequest(req, metaform) {
      const fields = FormUtils.getFields(metaform);
      
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        const fieldVisible = FormUtils.validateFieldVisibilityRules(req.body, field);

        if (field.required && fieldVisible) {
          req.checkBody(field.name, util.format("Syötä %s", field.title)).notEmpty();
        } else if (!fieldVisible) {
          delete req.body[field.name];
        }
        
        if (FormUtils.isValueSet(req, field.name)) {
          switch (field.type) {
            case "number":
              req.checkBody(field.name, util.format("%s ei ole numero", field.title)).isInt()
            break;
            case "email":
              req.checkBody(field.name, util.format("%s ei ole sähköpostiosoite", field.title)).isEmail()
            break;
            case "boolean":
              req.checkBody(field.name, util.format("%s on väärin muotoiltu", field.title)).isBoolean();
            break;
            case "select":
            case "radio":
              let options = FormUtils.resolveFieldOptions(field);
              req.checkBody(field.name, util.format("%s ei ole joukossa %s", field.title, options.join(","))).isIn(options);
            break;
            case "date":
              if (field.constraints) {
                const constraints = field.constraints;
                if (constraints["min-date"]) {
                  const minDate = Form.resolveMinDate(constraints["min-date"]);
                  req.checkBody(field.name, util.format("%s on ennen %s", field.title, minDate.toDate())).isAfter(minDate.toString());
                }
                if (constraints["disabled-weekday-indices"]) {
                  const disabledIndices = constraints["disabled-weekday-indices"];
                  req.checkBody(field.name, util.format("%s on joukossa %s", field.title, disabledIndices.join(","))).custom((value) => { 
                    return disabledIndices.indexOf(new Date(value).getDay()) === -1; 
                  });
                }
              }
            break;
            default:
            break;
          }
        } 
      }
    }

    /**
     * Returns whether the value is set on request or not
     * 
     * @param {Object} req request object 
     * @param {String} name value name
     * @returns {Object} whether the value is set on request or not
     */
    static isValueSet(req, name) {
      const value = req.body[name];
      return value !== undefined && value !== null && value !== "";
    }

    /**
     * Resolves option field's options
     * 
     * @param {Object} field field
     * @returns {Array} option names
     */
    static resolveFieldOptions(field) {
      return _.map(field.options, (option) => {
        return option.name;
      });
    }

  }
  
  module.exports = FormUtils;
  
})();