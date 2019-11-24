const http = require("http");
const opts = {
  errorEventName:'error',
      logDirectory:'./logs', // NOTE: folder must exist and be writable...
      fileNamePattern:'<DATE>.log',
      dateFormat:'YYYY.MM.DD'
};
const log = require('simple-node-logger').createRollingFileLogger( opts );

const subscriber = require("./subscriber.js");
const endPointHandler = require("./endPointHandler.js");

subscriber.renewSubscriptions();

http
  .createServer(function(request, response) {
    log.info('Server called at ', new Date().toJSON());
    endPointHandler.parse(request, response);
  })
  .listen(process.env.PORT || 80);
