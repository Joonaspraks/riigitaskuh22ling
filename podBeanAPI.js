const superagent = require("superagent");
const fs = require("fs");

let mediaKey = "";
let accessToken = "";

function startUploading(fileName, credentials) {
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
      if (err) console.log(err);
      accessToken = res.body.access_token;
      console.log("Accestoken: " + accessToken);
      authorizeUpload(fileName);
    });
}

function authorizeUpload(fileName) {
  var ext = ".mp3";
  var fileSize = fs.statSync(fileName + ".mp3").size;
  console.log(fileName + ext);
  console.log(fileSize);
  superagent
    .get("https://api.podbean.com/v1/files/uploadAuthorize")
    .query({
      access_token: accessToken,
      filename: fileName + ext,
      filesize: fileSize,
      content_type: "audio/mpeg"
    })
    .end((err, res) => {
      if (err) {
        console.log(err);
      }
      mediaKey = res.body.file_key;
      console.log("Mediakey: " + mediaKey);
      uploadPodcast(res.body.presigned_url, fileName);
    });
}

function uploadPodcast(url, fileName) {
  superagent
    .put(url)
    .type("audio/mpeg")
    .attach(fileName, fs.readFileSync(fileName + ".mp3"))
    .end((err, res) => {
      if (err) {
        console.log(err.status);
      }
      console.log(res.status);
      if (res.status === 200);
      publishPodcast(fileName);
    });
}

function publishPodcast(fileName) {
  fileName + ".mp3";
  superagent
    .post("https://api.podbean.com/v1/episodes")
    .send({
      access_token: accessToken,
      type: "public",
      title: fileName,
      status: "publish",
      media_key: mediaKey
    })
    .type("application/x-www-form-urlencoded")
    .end((err, res) => {
      if (err) console.log(err);
      else console.log(res.status);
    });
}

function checkSpace() {}

function deleteEarliest() {}

module.exports = { startUploading: startUploading };
