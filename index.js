(() => {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const express = require('express');
  const path = require('path');
  const bodyParser = require('body-parser');
  const expressSession = require('express-session');
  const cookieParser = require('cookie-parser');
  const expressValidator = require('express-validator');
  const config = require('nconf');
  const port = argv.port||3000;
  const app = express();
  const moment = require('moment');
  const http = require('http').Server(app);
  const SequelizeStore = require("connect-session-sequelize")(expressSession.Store);
  const KeycloakMultirealm = require(`${__dirname}/keycloak/keycloak-multirealm.js`);
  const Database = require(`${__dirname}/database`);

  exports.startServer = async () => {
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.use(cookieParser());

    const database = new Database();
    await database.initialize();

    const sessionStore = new SequelizeStore({
      db: database.getSequelizeInstance(),
      table: "ConnectSession"
    });

    app.use(expressSession({
      secret: config.get('session:secret'),
      store: sessionStore,
      resave: false,
      saveUninitialized: false
    }));
    
    const keycloakMultirealm = new KeycloakMultirealm({ store: sessionStore});

    app.use((req, res, next) => {
      const host = req.get('host');
      const portIndex = host.indexOf(':');
      const hostname = portIndex > -1 ? host.substring(0, portIndex) : host; 
      const formConfig = config.get(`forms:${hostname}`);
      if (formConfig) {
        const realm = formConfig.realm;
        const authServerUrl = config.get("keycloak:auth-server-url");
        const keycloakRealmUrl = `${authServerUrl}/realms/${realm}`;
        res.locals.formConfig = formConfig; 
        res.locals.formHostname = hostname;
        res.locals.keycloakAccountUrl = `${keycloakRealmUrl}/account`;
        next();
      } else {
        res.status(404).send("Not found");
      }
    });

    app.use(keycloakMultirealm.middleware({
      logout: '/logout'
    }));
    
    app.set('port', port);
    app.set('trust proxy', true);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended : true
    }));
    app.use(expressValidator());
    
    app.locals.metaformMode = config.get('mode') || 'production';
    app.locals.moment = moment;
    
    require(__dirname + '/websocket')(http, database);
    require('./routes')(app, keycloakMultirealm);

    return new Promise((resolve, reject) => {
      http.listen(app.get('port'), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

  };
  
})();