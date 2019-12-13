const superagent = require("superagent");
const fs = require("fs");

const audioProcessor = require("./audioProcessor.js");
const log = require("./logger.js");
const config = require("./config.js");

let accessToken = "";
let content = "";
let fileName = "";
let mediaKey = "";

function startUploading(incomingFileName, description, credentials) {
  content = description;
  fileName = incomingFileName;
  getPodBeanAccessToken(credentials, authorizeUpload);
}

function getPodBeanAccessToken(credentials, callback) {
  superagent
    .post("https://api.podbean.com/v1/oauth/token")
    .send({
      grant_type: "client_credentials",
      client_id: credentials.id,
      client_secret: credentials.secret
    })
    .end((err, res) => {
      if (err) {
        log.error(err);
      } else {
        accessToken = res.body.access_token;
        log.info("Succesfully received accessToken");
        callback();
      }
    });
}

function authorizeUpload() {
  var fileSize = fs.statSync(
    config.storageDir + fileName + config.audioExtension
  ).size;
  superagent
    .get("https://api.podbean.com/v1/files/uploadAuthorize")
    .query({
      access_token: accessToken,
      filename: fileName + config.audioExtension,
      filesize: fileSize,
      content_type: "audio/mpeg"
    })
    .end((err, res) => {
      if (err) {
        log.error(err);
      } else {
        mediaKey = res.body.file_key;
        log.info("Succesfully authorized");
        uploadPodcast(res.body.presigned_url, fileName);
      }
    });
}

function uploadPodcast(url) {
  superagent
    .put(url)
    .type("audio/mpeg")
    .attach(
      fileName,
      fs.readFileSync(config.storageDir + fileName + config.audioExtension)
    )
    .end((err, res) => {
      if (err) {
        log.error(err);
      } else {
        log.info("Succesfully uploaded");
        publishPodcast(fileName);
      }
    });
}

function publishPodcast() {
  fileName + config.audioExtension;
  superagent
    .post("https://api.podbean.com/v1/episodes")
    .send({
      access_token: accessToken,
      type: "public",
      title: fileName,
      content: content,
      status: config.publish ? "publish" : "draft",
      media_key: mediaKey
    })
    .type("application/x-www-form-urlencoded")
    .end((err, res) => {
      if (err) {
        log.error(err);
      } else {
        log.info("Succesfully published");

        //set podcast id as file metadata for later updating if needed
        audioProcessor.editAudioMetadata(
          config.storageDir + fileName + config.audioExtension,
          "TIT3",
          res.body.episode.id
        );
      }
    });
}

function updatePodcast(episodeId, title, description, credentials) {
  getPodBeanAccessToken(credentials, () => {
    superagent
      .post(`https://api.podbean.com/v1/episodes/${episodeId}`)
      .send({
        access_token: accessToken,
        type: "public",
        title: title,
        content: description,
        status: config.publish ? "publish" : "draft",
      })
      .type("application/x-www-form-urlencoded")
      .end((err, res) => {
        if (err) {
          log.error(err);
        } else {
          log.info(`Succesfully updated ${title}`);
        }
      });
  });
}

module.exports = {
  startUploading: startUploading,
  updatePodcast: updatePodcast
};
