const superagent = require("superagent");
const ip = require("ip");
const channels = require("./constants/youTubeChannels.json");
const log = require("./logger.js").log;

function renewSubscriptions() {
  channels.forEach(channel => {
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
        "hub.callback":
          "http://" + ip.address() + ":" + (process.env.PORT || 80)
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
