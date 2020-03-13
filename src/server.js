const https = require("https");
const http = require("http");
const fs = require("fs");

const config = require("./config.js");
const log = require("./logger.js");
const subscriber = require("./subscriber.js");
const endPointHandler = require("./endPointHandler.js");
const localFileManager = require("./localFileManager.js");

console.log("Service has started.");
log.info("-------------------------------------------");
log.info("Service has started.");
subscriber.renewSubscriptions();
const processingFile = localFileManager.getProcessingAudioFile();
if (processingFile) {
  fs.unlinkSync(config.storageDir + processingFile);
}
if (process.env.NODE_ENV === "dev") {
  http
    .createServer(function(request, response) {
      endPointHandler.parse(request, response);
    })
    .listen(config.port);
} else {
  https
    .createServer(config.SSLCert, function(request, response) {
      endPointHandler.parse(request, response);
    })
    .listen(config.port);

  http
    .createServer(function(req, res) {
      res.writeHead(301, {
        "Content-Type": "text/plain",
        Location: config.protocol + req.headers.host + req.url
      });
      res.end("Redirecting to SSL\n");
    })
    .listen(80);
}
