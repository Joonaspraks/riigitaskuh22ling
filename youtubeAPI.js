var service = google.youtube("v3");
const keys = require("./keys.json");
var { google } = require("googleapis");

function getChannelId() {
  service.channels.list(
    {
      auth: keys.API_KEY,
      part: "id",
      forUsername: "ValitsuseUudised"
    },
    function(err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log("No channel found.");
      } else {
        getVideos(channels[0].id, upload);
      }
    }
  );
}

function getVideos(id, callback) {
  service.search.list(
    {
      auth: keys.API_KEY,
      part: "id, snippet",
      channelId: id,
      q: "Valitsuse pressikonverents",
      type: "video"
    },
    function(err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      var videos = response.data.items;
      if (videos.length == 0) {
        console.log("No videos found.");
      } else {
        var video = videos[0];
        console.log(video);
        shell.exec(
          "downloadVideo.sh" +
            " " +
            video.id.videoId +
            " " +
            "`" +
            video.snippet.title +
            "`"
        );
        callback(video.snippet.title);
      }
    }
  );
}
