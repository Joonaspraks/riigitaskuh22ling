const ip = require("ip");
var RSS = require("rss");

const siteUrl = "http://" + ip.address() + ":" + (process.env.PORT || 8080);

function propagate() {
  return createRSS();
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
  feed.item({
    title: "Istung1",
    description: "Martin Helme",
    url: siteUrl + "/file", // link to the item
    guid: siteUrl + "/file" // optional - defaults to url
  });

  feed.item({
    title: "Istung2",
    description: "Martin Helmer",
    url: siteUrl + "/test", // link to the item
    guid: siteUrl + "/test" // optional - defaults to url
  });

  // cache the xml to send to clients
  return feed.xml();
}

module.exports = { propagate: propagate };
