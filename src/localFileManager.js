const RSS = require("rss");
const fs = require("fs");
var ffprobe = require("fluent-ffmpeg").ffprobe;

const config = require("./config.js");
const log = require("./logger.js");

const siteUrl = "www.riigipodcast.ee:" + config.port + "/";

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

async function createRSS() {
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
  removeOldContent: removeOldContent
};
