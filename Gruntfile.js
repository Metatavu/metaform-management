const fs = require("fs");
const pug = require("pug");
const PUG_ADMIN_TEMPLATE = __dirname + "/public/js/admin-templates.js";

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);
  
  grunt.registerMultiTask("compile-template", "Compiles pug templates", function () {
    var clientTemplates = fs.readdirSync(this.data.sourceFolder);
    var compiledClientTemplates = [];
    for (var i = 0; i < clientTemplates.length; i++) {
      var templateName = clientTemplates[i].replace(".pug", "");
      templateName = "render" + templateName[0].toUpperCase() + templateName.substring(1);
      compiledClientTemplates.push(pug.compileFileClient(
        this.data.sourceFolder + clientTemplates[i],
        { name: templateName, compileDebug: false }
      ));
    }
    fs.writeFileSync(this.data.destFile, compiledClientTemplates.join(""));
  });
  
  grunt.initConfig({
    "compile-template": {
      "compile-admin-pug-template": {
        "sourceFolder": __dirname + "/views/templates/admin/",
        "destFile": PUG_ADMIN_TEMPLATE,
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
  
  grunt.registerTask("default", ["babel", "sass",  "compile-template:compile-admin-pug-template"]);
};