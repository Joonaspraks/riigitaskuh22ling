const parseString = require("xml2js").parseString;
const url = require("url");
const ytdl = require("ytdl-core");

const log = require("./logger.js").log;
const podBeanAPI = require("./podBeanAPI.js");
const localFileManager = require("./localFileManager.js");
const soundFixer = require("./soundFixer.js");

const podBeanCredentials = require("./constants/podBeanCredentials.json");
const youTubechannels = require("./constants/youTubechannels.json");
const topic = "hub.topic";
const challenge = "hub.challenge";

let currentCredentials = "";

//Refactor to somewhere else
function downloadAudio(id, title) {
  log.info("Downloading audio for " + title);

  soundFixer.extractAndEditAudio(ytdl(id), title).on("end", () => {
    //podBeanAPI.checkSpace(); Necessary if unlimited space?
    podBeanAPI.startUploading(title, currentCredentials);
    localFileManager.removeOldContent();
    localFileManager.createRSS();
  });
}

function parse(request, response) {
  const method = request.method;
  const requestUrl = request.url;
  log.info(
    "Server was called with Method: " + method + " and Url: " + requestUrl
  );

  if (
    method === "GET" &&
    request.includes("https://www.youtube.com/xml/feeds/")
  ) {
    const parsedUrl = url.parse(requestUrl, true);
    log.info(
      "Websub  request from " + parsedUrl.query[topic],
      new Date().toJSON()
    );
    var challengeCode = url.parse(requestUrl, true).query[challenge];

    if (challengeCode) {
      response.writeHead("200");
      response.write(challengeCode);
      response.end();
    }
  }

  if (method === "GET" && requestUrl == "/") {
    //localFileManager.populateSiteWithFiles(); actually use id to inject body with list
    response.writeHead("200");
    response.write(
      "<html><head><meta name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>" +
        "<body><h1>Welcome to my start page</h1>" +
        "<p>Pride is good</p>" +
        "<ul id=itemList></ul>" +
        "</body></html>"
    );
    response.end();
  }

  if (method === "GET" && requestUrl === "/feed") {
    const result = localFileManager.createRSS();

    response.writeHead(200, {
      "Content-Type": "application/rss+xml"
    });

    response.write(result);
    response.end();
  }

  /*
      if endpoint get + filename, lookup and return file
    */
  /*   if (method === "GET" && requestUrl.includes("test1")) {
    var filePath = path.join(__dirname, "storedAudio/Riigikogu infotund, 6. november 2019.mp3");
    var stat = fs.statSync(filePath);

    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(response);
  }

  if (method === "GET" && requestUrl.includes("test2")) {
    response.writeHead("200");
    response.write(
      "<html><body><h1>Welcome to my test page</h1><p>Greed is good</p></body></html>"
    );
    response.end();
  } */

  if (
    method === "POST" &&
    request.headers.link &&
    request.headers.link.includes("http://pubsubhubbub.appspot.com/")
  ) {
    // Parse feed data
    request.on("data", function(data) {
      parseString(data, function(err, parsedData) {
        if (err) {
          log.error(err);
        }
        var entry = parsedData.feed.entry[0];
        var title = entry.title[0];
        localFileManager.checkIfFileIsNew(title);

        var channelId = entry["yt:channelId"][0];

        if (youTubechannels.includes(channelId)) {
          currentCredentials = podBeanCredentials;
          log.info("Notification from channel " + channelId);
        }
        if (currentCredentials !== "") {
          var id = entry["yt:videoId"][0];

          log.info("Video title: " + title);
          downloadAudio(id, title);
        }
        // Stops the notifications for current item
        response.writeHead("200");
        response.end();
      });
    });
  }
}

module.exports = { parse: parse };
