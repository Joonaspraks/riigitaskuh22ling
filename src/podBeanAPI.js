const superagent = require("superagent");
const fs = require("fs");

const log = require("./logger.js");
const config = require("./config.js");

let content = "";
let mediaKey = "";
let accessToken = "";

function startUploading(fileName, description, credentials) {
  content = description;
  getPodBeanAccessToken(fileName, credentials);
}

function getPodBeanAccessToken(fileName, credentials) {
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
        authorizeUpload(fileName);
      }
    });
}

function authorizeUpload(fileName) {
  var fileSize = fs.statSync(config.storageDir + fileName + config.extension)
    .size;
  superagent
    .get("https://api.podbean.com/v1/files/uploadAuthorize")
    .query({
      access_token: accessToken,
      filename: fileName + config.extension,
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

function uploadPodcast(url, fileName) {
  superagent
    .put(url)
    .type("audio/mpeg")
    .attach(
      fileName,
      fs.readFileSync(config.storageDir + fileName + config.extension)
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

function publishPodcast(fileName) {
  fileName + config.extension;
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
      }
    });
}

module.exports = { startUploading: startUploading };
