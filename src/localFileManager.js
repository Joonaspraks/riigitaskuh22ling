const RSS = require("rss");
const fs = require("fs");

const siteUrl = "http://" + "riigipodcast.ee" + ":" + (process.env.PORT || 80);
const contentDir = "./storedAudio/";

function checkIfFileIsNew(newFileName) {
  const extension = ".mp3";
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
  const files = fs.readdirSync("./storedAudio/");
  files.forEach(file => {
    feed.item({
      title: file,
      description: "ADD CORRECT DESCRIPTION",
      //url: siteUrl + "/" + file, // link to the item
      guid: file,
      enclosure: {
        url: "/" + file,
        file: "./storedAudio/" + file
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
    .map(file => {return file.name});
}

module.exports = {
  createRSS: createRSS,
  removeOldContent: removeOldContent,
  checkIfFileIsNew: checkIfFileIsNew,
  getAllFiles: getAllFiles
};
