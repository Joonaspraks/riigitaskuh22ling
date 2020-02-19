const parseString = require("xml2js").parseString;
const url = require("url");
const fs = require("fs");
const ytdl = require("ytdl-core");

const crypto = require("crypto");

const config = require("./config.js");
const log = require("./logger.js");
const podBeanManager = require("./podBeanManager.js");
const localFileManager = require("./localFileManager.js");
const audioProcessor = require("./audioProcessor.js");

const topic = "hub.topic";
const challenge = "hub.challenge";
const file = "file";

function parse(request, response) {
    const method = request.method;
    let requestUrl = url.parse(request.url, true);
    console.log("Server was called with link pointing to: " + request.headers.link);
    log.info("Server was called with link pointing to: " + request.headers.link);

    console.log("Server was called with Method: " + method + " and Url: " + requestUrl.path);
    log.info(
        "Server was called with Method: " + method + " and Url: " + requestUrl.path
    );
    request.headers.link && log.info("With link: " + request.headers.link);
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
        response.writeHead("200");
        response.write(localFileManager.createHTML());
        response.end();
    }

    if (method === "GET" && requestUrl.path === "/feed") {
        response.writeHead("200", {
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
        const audio = localFileManager.getAudioById(requestUrl.query[file]);

        if (audio) {
            const filePath = config.storageDir + audio;

            response.writeHead("200", {
                "Content-Type": "audio/mpeg",
                "Content-Length": fs.statSync(filePath).size
            });

            fs.createReadStream(filePath).pipe(response);
        } else {
            response.writeHead("404");
            response.end();
        }
    }

    if (
        method === "POST" &&
        request.headers.link &&
        request.headers.link.includes("http://pubsubhubbub.appspot.com/")
    ) {
        log.info("Request signature: " + request.headers["x-hub-signature"]);
        console.log("Request signature: " + request.headers["x-hub-signature"]);
        const contentHash = request.headers["x-hub-signature"];

        let dataStream = []
        request.on("data", chunk => {
            dataStream.push(chunk);
        });
    
        request.on('end', function () {
            const data = dataStream.join('')
            parseString(data, (err, parsedData) => {
                if (err) {
                    log.error(err);
                    log.error("Cannot parse XML");
                    response.writeHead("503");
                    response.end();
                } else {

                log.info(JSON.stringify(parsedData));

                log.info("Creating new hmac...");
                console.log("Creating new hmac...");
                const hmac = crypto.createHmac("sha1", config.hmacSecret);
                log.info("New hmac created");
                console.log("New hmac created");

                log.info("Updating hmac with data");
                hmac.update(data);

                if (contentHash === "sha1=" + hmac.digest("hex")) {
                    log.info("Hashes match, content is valid");

                    const entry = parsedData.feed.entry[0];

                    const channelId = entry["yt:channelId"][0];

                    if (config.youTubeChannels.includes(channelId)) {
                        // Unnecessary after HMAC?
                        log.info("Notification from channel " + channelId);
                        console.log("Notification from channel " + channelId);
                        const title = entry.title[0];
                        const youTubeId = entry["yt:videoId"][0];

                        // If audio matchin the ID is still processing, reject notification
                        // NEW VER: If ANY audio still processing, reject notification (For memory reasons);
                        if (localFileManager.getProcessingAudioFile()) {
                            response.writeHead("503");
                            response.end();
                            log.info(
                                `Another file is currently being processed. Ignoring ${title} with id ${youTubeId} at the moment.`
                            );
                        } else {
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
                                        response.writeHead("200");
                                        response.end();
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
                                                podBeanManager.updatePodcast(
                                                    episodeId,
                                                    title,
                                                    description,
                                                    credentials
                                                );
                                            });
                                    } else {
                                        log.info("Downloading audio for " + title);

                                        audioProcessor
                                            .editAudio(ytdl(youTubeId), title, youTubeId)
                                            .on("end", () => {
                                                //Response after ffmpeg has succesfully processed the audio
                                                response.writeHead("200");
                                                response.end();
                                                podBeanManager.startUploading(
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
                } else {
                    log.info("Hashes not matching, content is invalid");
                    response.writeHead("200");
                    response.end();
                }
            }
            });
        });
    }

    /*   response.writeHead(404);
    response.end(); */
}

module.exports = { parse: parse };