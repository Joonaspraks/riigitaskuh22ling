const RSS = require("rss");
const fs = require("fs");
var Metadata = require("fluent-ffmpeg").Metadata;

const siteUrl = "https://www.riigipodcast.ee";
const contentDir = "./storedAudio/";
const extension = ".mp3";

function checkIfFileIsNew(newFileName) {
  return (
    fs
      .readdirSync(contentDir)
      .filter(
        oldFileName =>
          oldFileName.substring(0, oldFileName.length - extension.length) ===
          newFileName
      ) === 0
  );
}

function removeOldContent() {
  const maxSize = 20;

  const filesToBeRemoved = getFilesSortedByDate().slice(maxSize);

  filesToBeRemoved.forEach(name => {
    fs.unlinkSync(contentDir + name);
  });
}

function createRSS() {
  var feed = new RSS({
    title: "Riigi Podcast",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "/feed",
    site_url: siteUrl
  });

  /* loop over data and add to feed */
  const files = getFilesSortedByDate();
  files.forEach((file, index) => {
    new Metadata(contentDir + file + extension, function(metadata, err) {
      console.log(require("util").inspect(metadata, false, null));
    });
    feed.item({
      title: file,
      description: "ADD CORRECT DESCRIPTION",
      /*       ffmetadata.read("song.mp3", function(err, data) {
        if (err) console.error("Error reading metadata", err);
        else console.log(JSON.stringify(data));
    }); */
      guid: file,
      url: siteUrl + "/?file=" + (index + 1),
      enclosure: {
        url: siteUrl + "/?file=" + (index + 1),
        file: contentDir + file
      }
    });
  });

  return feed.xml();
}

function getFilesSortedByDate() {
  const fileNames = fs.readdirSync(contentDir);

  return fileNames
    .map(name => {
      return {
        name: name,
        time: fs.statSync(contentDir + name).birthtime
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
