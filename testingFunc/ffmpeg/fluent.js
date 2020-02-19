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

ffmpeg(ytdl("0DO9RIJ8w-k"))
.format("mp3") //ffmpeg cant determine format from a stream
.audioBitrate("96k") //generally used for speech or low-quality streaming
.audioFilters(
  "silenceremove=" +
  /*             'start_periods=0:'+ //trim until 1 non-silence
         'start_duration=0:'+ //atleast that amount of seconds to be a 'silence'
         'start_threshold=0:'+ //what dB constitutes a 'silence' */

  "stop_periods=-1:" + //negative value means that silencing will occur in the middle of the file, '1' means that 'trim until 1 non-silence'
  "stop_duration=3:" + //atleast that amount of seconds to be a 'silence'
    "stop_threshold=-35dB",
  "dynaudnorm"
) 

.on("progress", progress =>
  console.log(`Processing ${title}: ${progress.timemark}`)
)
.on("error", error => console.log(error))
.outputOption("-metadata", `title=${title}`)
.save(tmp)
.on("end", () => {
  fs.renameSync(tmp, filePath);
})