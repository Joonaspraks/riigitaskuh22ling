const RSS = require("rss");
const fs = require("fs");
var ffprobe = require("fluent-ffmpeg").ffprobe;

const config = require("./config.js");
const log = require("./logger.js");

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

async function createRSS() {
  var feed = new RSS({
    title: "Riigi Podcast",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "feed",
    site_url: siteUrl
  });

  /* loop over data and add to feed */
  const files = getFilesSortedByDate();
  const promiseList = [];
  files.forEach((file, index) => {
    promiseList.push(
      new Promise((resolve, reject) => {
        ffprobe(config.storageDir + file, (error, metadata) => {
          if (error) {
            log.error(error);
            reject();
          } else {
            feed.item({
              title: file,
              description: metadata.format.tags.title,
              guid: file,
              url: siteUrl + "?file=" + (index + 1),
              enclosure: {
                url: siteUrl + "?file=" + (index + 1),
                file: config.storageDir + file
              }
            });
            resolve();
          }
        });
      })
    );
  });

  return Promise.all(promiseList).then(() => {
    return feed.xml();
  });
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
