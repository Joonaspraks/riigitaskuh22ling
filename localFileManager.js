const ip = require("ip");
var RSS = require("rss");
const fs = require("fs");

const siteUrl = "http://" + "riigipodcast.ee" + ":" + (process.env.PORT || 80);

function removeOldContent() {
  const contentDir = "./storedAudio/";
  const maxSize = 20;
  const fileNames = fs.readdirSync(contentDir);

  const filesToBeRemoved = fileNames
    .map(name => {
      return {
        name: name,
        time: fs.statSync(contentDir + name).birthtime
      };
    })
    .sort((file1, file2) => file2.time - file1.time)
    .slice(maxSize);

  filesToBeRemoved.forEach(file => {
    fs.unlinkSync(contentDir + file.name);
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

/* function createRSSTest() {
  var feed = new RSS({
    title: "Istungid ja press",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "/rss",
    site_url: siteUrl
  });

  // loop over data and add to feed
  feed.item({
    title: "Istung1",
    description: "Martin Helme",
    url: siteUrl + "/test1", // link to the item
    guid: siteUrl + "/test1",
    enclosure: {
      url: "/test1",
      file: "./storedAudio/Riigikogu infotund, 6. november 2019.mp3"
    }
  });

  feed.item({
    title: "Istung2",
    description: "Martin Helmer",
    url: siteUrl + "/test2", // link to the item
    guid: siteUrl + "/test2" // optional - defaults to url
  });

  feed.item({
    title: "Istung3",
    description:
      "<html><body><h1>Important news!</h1><p>Greed is good</p></body></html>",
    url: siteUrl + "/notExist", // link to the item
    guid: siteUrl + "/notExist" // optional - defaults to url
  }); 

  // cache the xml to send to clients
  return feed.xml();
}
*/

module.exports = { createRSS: createRSS, removeOldContent: removeOldContent };
