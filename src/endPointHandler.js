const parseString = require("xml2js").parseString;
const url = require("url");
const fs = require("fs");
const ytdl = require("ytdl-core");

const crypto = require("crypto");

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
    log.info("Confirmed subscription from " + requestUrl.query[topic]);
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

    localFileManager
      .createRSS()
      .then(feed => {
        response.write(feed);
        response.end();
      })
      .catch(err => log.error(err));
  }

  if (method === "GET" && requestUrl.query[file]) {
    const requestedFileNum = parseInt(requestUrl.query[file]);
    if (
      !isNaN(requestedFileNum) &&
      requestedFileNum > 0 &&
      requestedFileNum < 20 //replace with const
    ) {
      const audioList = localFileManager.getAudioListSortedByDate();
      //Making sure that there exists a file for the request
      if (audioList.length >= requestedFileNum) {
        const audio = audioList[requestedFileNum - 1];

        const filePath = config.storageDir + audio;

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
    const hmac = crypto.createHmac("sha1", config.hmacSecret);
    const contentHash = request.headers["X-Hub-Signature"];
    request.on("data", data => {
      hmac.update(data);
      if (contentHash === hmac.digest("hex")) {
        log.info("Hashes match, content is valid");

        parseString(data, (err, parsedData) => {
          if (err) {
            log.error(err);
            //TODO hard exit after error?
          }
          const entry = parsedData.feed.entry[0];

          const channelId = entry["yt:channelId"][0];

          if (config.youTubeChannels.includes(channelId)) {
            // Unnecessary after HMAC?
            log.info("Notification from channel " + channelId);
            console.log("Notification from channel " + channelId);
            const title = entry.title[0];
            const youTubeId = entry["yt:videoId"][0];

            // If audio matchin the ID is still processing, reject notification
            if (localFileManager.getProcessingAudioById(youTubeId)) {
              //tempAudio
              response.writeHead("403");
              response.end();
              log.info(
                `${title} with id ${youTubeId} is currently being processed. Ignoring the incoming change.`
              );
            } else {
              // When should this header be sent? Immediately after link has been fetched? Depends on how often the notifications are sent.
              // Should anything happen then it can be a good thing if another notification is sent
              // I'll assume that if a notification was received then it can be discarded
              // Stops the notifications for current item
              response.writeHead("200");
              response.end();
              log.info("Video title: " + title);

              ytdl.getBasicInfo(youTubeId, (err, info) => {
                if (err) log.error(err);
                else {
                  const description = info.description;
                  const credentials = config.podbeanCredentials;
                  // compare the video id with all ids of stored media
                  const existingAudio = localFileManager.getAudioById(
                    youTubeId
                  );
                  if (existingAudio) {
                    // replace old file's name and description
                    log.info(
                      `${title} exists, but its contents have been changed. Updating name and description.`
                    );
                    audioProcessor.editAudioMetadata(
                      existingAudio,
                      "title",
                      title
                    );
                    localFileManager.createDescription(youTubeId, description);
                    localFileManager
                      .getMetadataFromAudio(existingAudio, "TIT3")
                      .then(episodeId => {
                        podBeanAPI.updatePodcast(
                          episodeId,
                          title,
                          description,
                          credentials
                        );
                      });
                  } else {
                    log.info("Downloading audio for " + title);

                    audioProcessor
                      .processAudio(ytdl(youTubeId), title, youTubeId)
                      .on("end", () => {
                        podBeanAPI.startUploading(
                          youTubeId,
                          title,
                          description,
                          credentials
                        );
                        localFileManager.createDescription(
                          youTubeId,
                          description
                        );
                        localFileManager.removeOldContent();
                      });
                  }
                }
              });
            }
          }
        });
      } else {
        log.info("Hashes not matching, content is invalid");
        response.writeHead("200");
        response.end();
      }
    });
  }

  /*   response.writeHead(404);
  response.end(); */
}

module.exports = { parse: parse };
