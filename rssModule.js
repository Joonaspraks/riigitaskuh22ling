const ip = require("ip");
var RSS = require("rss");
const fs = require("fs");

const siteUrl = "http://" + ip.address() + ":" + (process.env.PORT || 80);

function propagate() {
  return createRSS();
  //return createRSSTest();
  //upload();
}

function createRSS() {
  var feed = new RSS({
    title: "Istungid ja press",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "/rss",
    site_url: siteUrl
  });

  /* loop over data and add to feed */
  fs.readdir("./storedAudio/", (err, files) => {
    console.log(JSON.stringify(files));
    files.forEach(file => {
      feed.item({
        title: "Istung1",
        description: "Martin Helme",
        url: siteUrl + "/" + file, // link to the item
        guid: siteUrl + "/" + file,
        enclosure: {
          url: "/" + file,
          file: "./storedAudio/" + file
        }
      });
    });
  });
  return feed.xml();
} 

function createRSSTest() {
  var feed = new RSS({
    title: "Istungid ja press",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "/rss",
    site_url: siteUrl
  });

  /* loop over data and add to feed */
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

module.exports = { propagate: propagate };
