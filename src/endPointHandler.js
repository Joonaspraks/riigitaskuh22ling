const parseString = require("xml2js").parseString;
const url = require("url");
const ytdl = require("ytdl-core");

const log = require("./logger.js").log;
const podBeanAPI = require("./podBeanAPI.js");
const localFileManager = require("./localFileManager.js");
const soundFixer = require("./soundFixer.js");

const podBeanCredentials = require("./constants/podBeanCredentials.json");
const youTubechannels = require("./constants/youTubeChannels.json");
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
    requestUrl.includes("https://www.youtube.com/xml/feeds/")
  ) {
    const parsedUrl = url.parse(requestUrl, true);
    log.info("Websub  request from " + parsedUrl.query[topic]);
    var challengeCode = url.parse(requestUrl, true).query[challenge];

    if (challengeCode) {
      response.writeHead("200");
      response.write(challengeCode);
      response.end();
    }
  }

  if (method === "GET" && requestUrl == "/") {
    //localFileManager.populateSiteWithFiles(); actually use id to inject body with list
    // const html; // get file with fs
    const fileNames = localFileManager.getAllFiles();
    response.writeHead("200");
    response.write(
      "<html><head><meta name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>" +
        "<body><h1>Riigi Podcast</h1>" +
        "<ul>" +
        fileNames.map(name => {return "tere"}) +
        "</ul>" +
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
  if (method === "GET" && requestUrl.includes("file")) {
    const fileNum = parseInt(url.parse(requestUrl, true).query["file"]);
    if (
      !isNan(fileNum) &&
      fileNum > 0 &&
      fileNum < 20 //replace with const
    ) {
      const fileNames = localFileManager.getAllFiles();
      if (fileNames.length >= 20) {
        //replace with const
        const fileName = fileNames[fileNum - 1];

        var filePath = path.join(
          __dirname, // remove dirname
          "storedAudio/" + fileName //replace dir with const
        );
        var stat = fs.statSync(filePath);

        response.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Length": stat.size
        });

        var readStream = fs.createReadStream(filePath);
        readStream.pipe(response);
      }
    }
  }

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
