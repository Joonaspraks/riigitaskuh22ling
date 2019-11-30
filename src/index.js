const https = require("https");

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
  .listen(process.env.PORT || 80);
