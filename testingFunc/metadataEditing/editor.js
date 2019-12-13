const ffmpeg = require("fluent-ffmpeg");
 
ffmpeg.ffprobe('song2.mp3', (err, metadata) => {
  if (err) {
    log.error(err);
  }
  console.log(metadata);
});

