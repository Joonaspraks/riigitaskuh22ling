const superagent = require("superagent");
const ip = require("ip");
const literals = require("./literals.json");
const logger = require("./logger.js")

function renewSubscriptions() {
  const channelsAsList = literals.channelsAsList;

  channelsAsList.forEach(channel => {
    subscribeTo(channel);
    setInterval(() => {
      subscribeTo(channel);
    }, 1000 * 60 * 60 * 24);
  });

  function subscribeTo(channel) {
    console.log("http://" + ip.address() + ":" + (process.env.PORT || 80));
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
        if (err) console.log(err);
        else {    
          logger.log.info("Request for subsrciption to " + channel + " sent.", new Date().toJSON());
        }
      });
  }
}

module.exports = { renewSubscriptions: renewSubscriptions };
