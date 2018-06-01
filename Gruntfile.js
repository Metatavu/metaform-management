const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const pug = require("pug");
const PUG_ADMIN_TEMPLATE = __dirname + "/public/js/admin-templates.js";

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.registerMultiTask("compile-templates", 'Compiles client pug templates', function () {
    const clientTemplates = fs.readdirSync(this.data.sourceFolder);
    const compiledClientTemplates = [];
    
    for (let i = 0; i < clientTemplates.length; i++) {
      let baseName = clientTemplates[i].replace('.pug', '');
      baseName = `${baseName[0].toUpperCase()}${baseName.substring(1)}`;
      const templateName = _.camelCase(`${this.data.templatePrefix}${baseName}`);
      compiledClientTemplates.push(pug.compileFileClient(this.data.sourceFolder + clientTemplates[i], { name: templateName, compileDebug: false }));
    }
    
    const destDir = path.dirname(this.data.destFile);
    
    if (!fs.existsSync(destDir)){
      fs.mkdirSync(destDir);
    }
    
    fs.writeFileSync(this.data.destFile, compiledClientTemplates.join(''));
  });

  
  grunt.initConfig({
    "compile-templates": {
      "compile-admin-pug-templates": {
        "sourceFolder": `${__dirname}/views/templates/admin/`,
        "destFile": PUG_ADMIN_TEMPLATE,
        "templatePrefix": "render"
      }
    },
    "sass": {
      dist: {
        options: {
          style: "compressed"
        },
        files: [{
          expand: true,
          cwd: "scss",
          src: ["**/*.scss"],
          dest: "public/css",
          ext: ".min.css"
        }]
      }
    },
    "babel": {
      options: {
        sourceMap: true,
        minified: false
      },
      dist: {
        files: [{
          expand: true,
          cwd: "src/js",
          src: ["*.js"],
          dest: "public/js/",
          ext: ".min.js"
        }]
      }
    }
  });
  
  grunt.registerTask("default", ["babel", "sass",  "compile-templates:compile-admin-pug-templates"]);
};