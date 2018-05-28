(() => {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const config = require('nconf');
  config.file({ file: argv.config || `${__dirname}/config.json` });
  const app = require(`${__dirname}/index`);
  
  app.startServer(() => {
    console.log('Express server started');
  });
  
})();
