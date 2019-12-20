const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const ytdl = require("ytdl-core");

const title = "testTitle";
const filePath = "fileName.mp3";
const tmp = "tmp.mp3";

/* ffmpeg(ytdl("KlsGHiV3Xf4"))
  .noVideo()
  .audioCodec('copy')
  .format("mp3")
  .on("error", error => console.log(error))
  .save(tmp); */

//ffmpeg(ytdl("KlsGHiV3Xf4")).save("newVid.mp4");
//ffmpeg("./newVid.mp4").save("./audio.mp3");

ffmpeg('longVid.mp4').output('testOutput.mp3')
.noVideo()
.format('mp3')
.outputOptions('-ab','192k')
.on("error", error => console.log(error))
.run();
