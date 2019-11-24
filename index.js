const http = require("http");
const opts = {
      logDirectory:'./logs', // NOTE: folder must exist and be writable...
      fileNamePattern:'<DATE>.log',
      dateFormat:'YYYY.MM.DD'
};
const log = require('simple-node-logger').createRollingFileLogger( opts );

const subscriber = require("./subscriber.js");
const endPointHandler = require("./endPointHandler.js");

setTimeout(function() {
  subscriber.renewSubscriptions();
}, 10000);



http
  .createServer(function(request, response) {
    endPointHandler.parse(request, response);
  })
  .listen(process.env.PORT || 80);

module.exports = {
  log: log
}
