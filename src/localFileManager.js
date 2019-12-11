const RSS = require("rss");
const fs = require("fs");

const config = require("./config.js");
const log = require("./logger.js");

const siteUrl = config.protocol + "www.riigipodcast.ee:" + config.port + "/";

function checkIfFileIsNew(incomingFile) {
  return (
    getMediaFiles().filter(
      existingFile =>
        existingFile.replace(new RegExp(`${config.mediaExtension}$`), "") ===
        incomingFile
    ).length === 0
  );
}

function createDescription(title, description) {
  fs.writeFileSync(
    config.storageDir + title + config.descriptionExtension,
    description
  );
}

function removeOldContent() {
  const maxSize = 20;

  const mediaFilesToBeRemoved = getMediaFilesSortedByDate().slice(maxSize);

  mediaFilesToBeRemoved.forEach(mediaFileName => {
    try {
      fs.unlinkSync(config.storageDir + mediaFileName);
      fs.unlinkSync(
        config.storageDir + getDescriptionFileOfMediaFile(mediaFileName)
      );
    } catch (err) {
      log.error(err);
    }
  });
}

function createRSS() {
  var feed = new RSS({
    title: "Riigi Podcast",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "feed",
    site_url: siteUrl
  });

  const mediaFileNames = getMediaFilesSortedByDate();
  mediaFileNames.forEach((mediaFileName, index) => {
    let description = "";
    try {
      description = fs.readFileSync(
        config.storageDir + getDescriptionFileOfMediaFile(mediaFileName)
      );
    } catch (err) {
      log.error(err);
    }
    feed.item({
      title: mediaFileName,
      description,
      guid: mediaFileName,
      url: siteUrl + "?file=" + (index + 1),
      enclosure: {
        url: siteUrl + "?file=" + (index + 1),
        file: config.storageDir + mediaFileName
      }
    });
  });

  return feed.xml();
}

function createHTML() {
  const mediaFiles = getMediaFilesSortedByDate();
  return (
    "<html><head><meta charset='UTF-8'" +
    "name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>" +
    "<body><h1>Riigi Podcast</h1>" +
    "<ul>" +
    mediaFiles
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
}

function getDescriptionFileOfMediaFile(mediaFileName) {
  return mediaFileName.replace(
    new RegExp(`${config.mediaExtension}$`),
    config.descriptionExtension
  );
}

function getMediaFiles() {
  return fs
    .readdirSync(config.storageDir)
    .filter(fileName => fileName.match(`${config.mediaExtension}$`));
}

function getMediaFilesSortedByDate() {
  return getMediaFiles()
    .map(name => {
      return {
        name: name,
        time: fs.statSync(config.storageDir + name).birthtime
      };
    })
    .sort((file1, file2) => file2.time - file1.time)
    .map(file => {
      return file.name;
    });
}

module.exports = {
  checkIfFileIsNew: checkIfFileIsNew,
  createDescription: createDescription,
  createRSS: createRSS,
  getMediaFilesSortedByDate: getMediaFilesSortedByDate,
  removeOldContent: removeOldContent,
  createHTML: createHTML
};
