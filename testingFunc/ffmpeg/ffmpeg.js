const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

ffmpeg("./testVid.mp4")
  .audioBitrate("128k")
  .on("progress", progress =>
    console.log(
      "The timestamp of the current frame in seconds: " + progress.timemark
    )
  )
  .on("error", error => console.log(error))
  .save("Higher bitrate.mp3");

/* ffmpeg("./testVid.mp4")
  .audioBitrate("24k")
  .on("progress", progress =>
  console.log(
      "The timestamp of the current frame in seconds: " + progress.timemark
    )
  )
  .on("error", error => console.log(error))
  .save("Lower bitrate.mp3"); */