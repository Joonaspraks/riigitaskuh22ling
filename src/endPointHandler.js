const parseString = require("xml2js").parseString;
const url = require("url");
const ytdl = require("ytdl-core");
const fs = require("fs");

const config = require("./config.js");
const log = require("./logger.js");
const podBeanAPI = require("./podBeanAPI.js");
const localFileManager = require("./localFileManager.js");
const soundFixer = require("./soundFixer.js");

const topic = "hub.topic";
const challenge = "hub.challenge";

let currentCredentials = "";

function downloadAudio(id, title) {
  log.info("Downloading audio for " + title);

  ytdl.getBasicInfo(id, (err, info) => {
    if (err) log.error(err);
    else {
      soundFixer.extractAndEditAudio(ytdl(id), title).on("end", () => {
        podBeanAPI.startUploading(title, info.description, currentCredentials);
        localFileManager.createDescription(title, info.description);
        localFileManager.removeOldContent();
      });
    }
  });
}

function parse(request, response) {
  const method = request.method;
  let requestUrl = url.parse(request.url, true);
  /*   try { 
    requestUrl = decodeURIComponent(request.url); 
  } catch(err) { 
    log.error(err); 
  } */
  log.info(
    "Server was called with Method: " + method + " and Url: " + requestUrl
  );

  // move this to subscriber.js
  if (
    method === "GET" &&
    config.youTubeChannels.reduce(
      (accumulator, youtubeChannel) =>
        accumulator ||
        requestUrl.query[topic] ===
          "https://www.youtube.com/xml/feeds/videos.xml?channel_id=" +
            youtubeChannel,
      false
    )
  ) {
    //const parsedUrl = url.parse(requestUrl, true);
    log.info("Websub request from " + requestUrl.query[topic]);
    var challengeCode = requestUrl.query[challenge];

    if (challengeCode) {
      response.writeHead("200");
      response.write(challengeCode);
      response.end();
    }
  }

  if (method === "GET" && requestUrl.path === "/") {
    //localFileManager.populateSiteWithFiles(); actually use id to inject body with list
    // const html; // get file with fs
    const fileNames = localFileManager.getMediaFilesSortedByDate();
    response.writeHead(
      200 /* , {"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"} */
    );
    response.write(
      "<html><head><meta charset='UTF-8'" +
        "name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>" +
        "<body><h1>Riigi Podcast</h1>" +
        "<ul>" +
        fileNames
          .map((name, index) => {
            return (
              "<li>" +
              "<a href='" +
              `/?file=${index + 1}'>` +
              `<h3>${name}</h3>` +
              "</a>" +
              "</li>"
            );
          })
          .join("") +
        "</ul>" +
        "</body></html>"
    );
    response.end();
  }

  if (method === "GET" && requestUrl.path === "/feed") {
    localFileManager.createRSS().then(result => {
      response.writeHead(200, {
        "Content-Type": "application/rss+xml"
      });

      response.write(result);
      response.end();
    });
  }

  /*
      if endpoint get + filename, lookup and return file
    */
  if (method === "GET" && requestUrl.path === "/?file") {
    const requestedFileNum = parseInt(
      url.parse(requestUrl, true).query["file"]
    );
    if (
      !isNaN(requestedFileNum) &&
      requestedFileNum > 0 &&
      requestedFileNum < 20 //replace with const
    ) {
      const fileNames = localFileManager.getMediaFilesSortedByDate();
      //Making sure that there are enough files for the request
      if (fileNames.length >= requestedFileNum) {
        //replace with const
        const fileName = fileNames[requestedFileNum - 1];

        var filePath = config.storageDir + fileName; //replace dir with const
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

        if (config.youTubeChannels.includes(channelId)) {
          currentCredentials = config.podbeanCredentials;
          log.info("Notification from channel " + channelId);
        }
        if (currentCredentials !== "") {
          var id = entry["yt:videoId"][0];

          log.info("Video title: " + title);
          // When should this header be sent? Immediately after link has been fetched? Depends on how often the notifications are sent.
          // Should anything happen then it can be a good thing if another notification is sent
          // I'll assume that if a notification was received then it can be discarded
          // Stops the notifications for current item
          response.writeHead("200");
          response.end();
          downloadAudio(id, title);
        }
      });
    });
  }

  /*   response.writeHead(404);
  response.end(); */
}

module.exports = { parse: parse };
