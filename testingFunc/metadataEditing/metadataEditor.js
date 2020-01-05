const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const promise = new Promise((resolve) => {
  ffmpeg.ffprobe("song.mp3", (err, metadata) => {
    if (err) {
      log.error(err);
    }
    resolve (metadata.format.tags.TIT3);
  });
});

promise.then(subtitles=> console.log(subtitles));

/* function editAudioMetadata(fileName, tagName, tagValue) {
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

editAudioMetadata("./song.mp3", "TIT3", `string text line 1
string text line 2`);
 */