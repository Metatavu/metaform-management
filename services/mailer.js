const config = require('nconf');
const mailgun = require('mailgun-js')({apiKey: config.get('mail:api_key'), domain: config.get('mail:domain')});
const sender = config.get('mail:sender')+'@'+config.get('mail:domain');

exports.sendMail = function(to, subject, text, callback) {
  mailgun.messages().send({
    from: sender,
    to: to,
    subject: subject,
    html: text
  }, function (error, body) {
    if(typeof(callback) == 'function') {
      callback(error, body);
    }
  });
};