const https = require("https");
const http = require("http");
const fs = require("fs");

const subscriber = require("./subscriber.js");
const endPointHandler = require("./endPointHandler.js");

console.log("Service has started.")

subscriber.renewSubscriptions();

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/riigipodcast.ee/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/riigipodcast.ee/fullchain.pem")
};

https
  .createServer(options, function(request, response) {
    endPointHandler.parse(request, response);
  })
  .listen(process.env.PORT || 443);

http.createServer(function(req, res){
    res.writeHead(301, {
      'Content-Type': 'text/plain', 
      'Location':'https://'+req.headers.host+req.url});
    res.end('Redirecting to SSL\n');
 }).listen(80);
