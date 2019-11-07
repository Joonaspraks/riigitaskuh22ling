var http = require('http');

const subscriber = require("./subscriber.js")
const endPointHandler = require("./endPointHandler.js")

subscriber.renewSubscriptions();

http.createServer(function (request, response) {

  endPointHandler.parse(request, response);

}).listen(process.env.PORT || 8080);
