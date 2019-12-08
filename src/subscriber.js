const superagent = require("superagent");

const log = require("./logger.js");
const config = require("./config.js");

function renewSubscriptions() {
  config.youTubeChannels.forEach(channel => {
    subscribeTo(channel);
    setInterval(() => {
      subscribeTo(channel);
    }, 1000 * 60 * 60 * 24);
  });

  function subscribeTo(channel) {
    superagent
      .post("https://pubsubhubbub.appspot.com/subscribe")
      .query({
        "hub.mode": "subscribe",
        "hub.topic":
          "https://www.youtube.com/xml/feeds/videos.xml?channel_id=" + channel,
        "hub.verify": "async",
        "hub.callback": "www.riigipodcast.ee:"+config.port
      })
      .end((err, res) => {
        if (err) {
          log.error(err);
        } else {
          log.info("Request for subsrciption to " + channel + " sent.");
        }
      });
  }
}

module.exports = { renewSubscriptions: renewSubscriptions };
