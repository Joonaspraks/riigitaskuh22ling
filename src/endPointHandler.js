const parseString = require("xml2js").parseString;
const url = require("url");
const fs = require("fs");

const config = require("./config.js");
const log = require("./logger.js");
const podBeanAPI = require("./podBeanAPI.js");
const localFileManager = require("./localFileManager.js");
const audioProcessor = require("./audioProcessor.js");

const topic = "hub.topic";
const challenge = "hub.challenge";
const file = "file";

function parse(request, response) {
  const method = request.method;
  let requestUrl = url.parse(request.url, true);
  log.info(
    "Server was called with Method: " + method + " and Url: " + requestUrl.path
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
    log.info("Websub request from " + requestUrl.query[topic]);

    const challengeCode = requestUrl.query[challenge];
    if (challengeCode) {
      response.writeHead("200");
      response.write(challengeCode);
      response.end();
    }
  }

  if (method === "GET" && requestUrl.path === "/") {
    response.writeHead(
      200 /* , {"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"} */
    );
    response.write(localFileManager.createHTML());
    response.end();
  }

  if (method === "GET" && requestUrl.path === "/feed") {
    response.writeHead(200, {
      "Content-Type": "application/rss+xml"
    });

    response.write(localFileManager.createRSS());
    response.end();
  }

  if (method === "GET" && requestUrl.query[file]) {
    const requestedFileNum = parseInt(requestUrl.query[file]);
    if (
      !isNaN(requestedFileNum) &&
      requestedFileNum > 0 &&
      requestedFileNum < 20 //replace with const
    ) {
      const fileNames = localFileManager.getMediaFilesSortedByDate();
      //Making sure that there exists a file for the request
      if (fileNames.length >= requestedFileNum) {
        const fileName = fileNames[requestedFileNum - 1];

        const filePath = config.storageDir + fileName;

        response.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Length": fs.statSync(filePath).size
        });

        fs.createReadStream(filePath).pipe(response);
      }
    }
  }

  if (
    method === "POST" &&
    request.headers.link &&
    request.headers.link.includes("http://pubsubhubbub.appspot.com/")
  ) {
    request.on("data", function(data) {
      parseString(data, function(err, parsedData) {
        if (err) {
          log.error(err);
        }
        const entry = parsedData.feed.entry[0];

        const channelId = entry["yt:channelId"][0];

        if (config.youTubeChannels.includes(channelId)) {
          log.info("Notification from channel " + channelId);
          const title = entry.title[0];
          // Why this check needed if I compare IDs later anyway?
          // Because this check ignores file, the later one replaces.
          if (localFileManager.getMediaFile(title)) {
            log.info("Video title: " + title);
            // When should this header be sent? Immediately after link has been fetched? Depends on how often the notifications are sent.
            // Should anything happen then it can be a good thing if another notification is sent
            // I'll assume that if a notification was received then it can be discarded
            // Stops the notifications for current item
            response.writeHead("200");
            response.end();
            const id = entry["yt:videoId"][0];

            // maybe move ytdl related stuff to other file?
            ytdl.getBasicInfo(id, (err, info) => {
              if (err) log.error(err);
              else {
                const description = info.description;
                // TODO 1) compare id with all ids of stored media
                localFileManager.getMediaById(id).then(existingMedia => {
                  // TODO 2) if true, replace oldfile's name and description
                  if (existingMedia) {
                    log.info(`${title} exists, but its contents have been changed. Updating name and description.`)
                    localFileManager.replaceMediaData(
                      existingMedia,
                      title,
                      description
                    );
                    // TODO update file on podbean
                  } else {
                    // TODO 3) else, the usual
                    log.info("Downloading audio for " + title);

                    audioProcessor
                      .processAudio(ytdl(id), title)
                      .on("end", () => {
                        podBeanAPI.startUploading(
                          title,
                          description,
                          config.podbeanCredentials
                        );
                        localFileManager.createDescription(title, description);
                        localFileManager.removeOldContent();
                      });
                  }
                });
              }
            });
          } else {
            log.info(`${title} already exists. Ignoring the file.`);
          }
        }
      });
    });
  }

  /*   response.writeHead(404);
  response.end(); */
}

module.exports = { parse: parse };
