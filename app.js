(() => {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const config = require('nconf');
  config.file({ file: argv.config || `${__dirname}/config.json` });
  const app = require(`${__dirname}/index`);

  app.startServer()
    .then(() => {
      console.log('Express server started');
    })
    .catch((err) => {
      console.error(`Failed to start Express server: ${err}`);
    });
  
})();
