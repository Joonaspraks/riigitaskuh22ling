const https = require("https");
const http = require("http");

const config = require("./config.js");
const subscriber = require("./subscriber.js");
const endPointHandler = require("./endPointHandler.js");

console.log("Service has started.")

subscriber.renewSubscriptions();

const options = config.SSLCert;

https
  .createServer(options, function(request, response) {
    endPointHandler.parse(request, response);
  })
  .listen(config.port);

config.useReroute && http.createServer(function(req, res){
    res.writeHead(301, {
      'Content-Type': 'text/plain', 
      'Location':'https://'+req.headers.host+req.url});
    res.end('Redirecting to SSL\n');
 }).listen(80);
 