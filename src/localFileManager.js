const RSS = require("rss");
const fs = require("fs");
var ffprobe = require("fluent-ffmpeg").ffprobe;

const config = require("./config.js");

const siteUrl = "www.riigipodcast.ee:" + config.port + "/";

function checkIfFileIsNew(newFileName) {
  return (
    fs
      .readdirSync(config.storageDir)
      .filter(
        oldFileName =>
          oldFileName.substring(
            0,
            oldFileName.length - config.extension.length
          ) === newFileName
      ) === 0
  );
}

function removeOldContent() {
  const maxSize = 20;

  const filesToBeRemoved = getFilesSortedByDate().slice(maxSize);

  filesToBeRemoved.forEach(name => {
    fs.unlinkSync(config.storageDir + name);
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

  /* loop over data and add to feed */
  const files = getFilesSortedByDate();
  files.forEach((file, index) => {
    let description;
    ffprobe(config.storageDir + file, (error, metadata) => {
      if (error) {
        log.error(error);
      } else {
        description = metadata.format.tags.title;
      }
    });

    feed.item({
      title: file,
      description: description,
      guid: file,
      url: siteUrl + "?file=" + (index + 1),
      enclosure: {
        url: siteUrl + "?file=" + (index + 1),
        file: config.storageDir + file
      }
    });
  });

  return feed.xml();
}

function getFilesSortedByDate() {
  const fileNames = fs.readdirSync(config.storageDir);

  return fileNames
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
  createRSS: createRSS,
  removeOldContent: removeOldContent,
  checkIfFileIsNew: checkIfFileIsNew,
  getFilesSortedByDate: getFilesSortedByDate
};
