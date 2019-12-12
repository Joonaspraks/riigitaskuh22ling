const ffmpeg = require("fluent-ffmpeg");
 
ffmpeg.ffprobe('song.mp3', (err, metadata) => {
  if (err) {
    log.error(err);
  }
  console.log(metadata.format.tags.title);
});

