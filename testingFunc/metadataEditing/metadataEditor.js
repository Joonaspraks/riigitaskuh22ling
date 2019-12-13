const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

/* ffmpeg.ffprobe('song2.mp3', (err, metadata) => {
  if (err) {
    log.error(err);
  }
  console.log(metadata);
}); */

function editAudioMetadata(fileName, tagName, tagValue) {
  const tmp = fileName + ".tmp";
  fs.copyFileSync(fileName, tmp);

    ffmpeg(tmp)
      .audioCodec("copy")
      .outputOption("-metadata", `${tagName}=${tagValue}`)
      .save(fileName)
      .on("end", () => {
        fs.unlink(tmp, () => {});
      });
}

editAudioMetadata("./song.mp3", "TIT3", "aajeee subtitles");
