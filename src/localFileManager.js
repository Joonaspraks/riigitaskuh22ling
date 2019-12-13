const RSS = require("rss");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const config = require("./config.js");
const log = require("./logger.js");

const siteUrl = config.protocol + "www.riigipodcast.ee:" + config.port + "/";

async function getMediaById(givenId) {
  let matchingMediaFile;
  let promises = [];
  getMediaFiles().forEach(currentMediaFile => {
    promises.push(
      new Promise((resolve, reject) => {
        ffmpeg.ffprobe(config.storageDir + currentMediaFile, (err, metadata) => {
          if (err) {
            log.error(err);
          }
          if (metadata.format.tags.title === givenId) {
            matchingMediaFile = currentMediaFile;
            resolve();
          } else {
            reject();
          }
        });
      })
    );
  });
  // Return when first promise resolves or when all reject
  try {
    await Promise.all(
      promises.map(p => {
        // Swapping reject and resolve cases
        // Promise.all() returns when there is one resolve or all rejects
        return p.then(
          val => Promise.reject(val),
          err => Promise.resolve(err)
        );
      })
    );
  } catch (value_1) {
    return matchingMediaFile;
  }
}

function replaceMediaData(existingMedia, incomingMedia, incomingDescription) {
  fs.renameSync(config.storageDir + existingMedia, config.storageDir + incomingMedia + config.mediaExtension);
  fs.unlinkSync(config.storageDir + getDescriptionFileOfMediaFile(existingMedia));
  createDescription(incomingMedia, incomingDescription);
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

function getMediaFile(givenFileName) {
  return getMediaFiles().find(
    existingFileName =>
      existingFileName.replace(new RegExp(`${config.mediaExtension}$`), "") ===
      givenFileName
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
  createDescription: createDescription,
  createRSS: createRSS,
  getMediaById: getMediaById,
  getMediaFile: getMediaFile,
  getMediaFilesSortedByDate: getMediaFilesSortedByDate,
  removeOldContent: removeOldContent,
  replaceMediaData: replaceMediaData,
  createHTML: createHTML
};
