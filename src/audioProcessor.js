const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const log = require("./logger.js");
const config = require("./config.js");

function editAudio(readableStream, title, id) {
  const filePath = config.storageDir + id + config.audioExtension;
  const tmp = filePath + ".tmp";

  return (
    ffmpeg(readableStream)
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
        log.info(`Processing ${title}: ${progress.timemark}`)
      )
      .on("error", error => log.error(error))
      .outputOption("-metadata", `title=${title}`)
      .save(tmp)
      .on("end", () => {
        fs.renameSync(tmp, filePath);
      })
  );
}

function editAudioMetadata(fileName, tagName, tagValue) {
  const filePath = config.storageDir + fileName;
  const tmp = fileName + ".tmp";

  ffmpeg(filePath)
    .format("mp3")
    .audioCodec("copy")
    .on("error", error => log.error(error))
    .outputOption("-metadata", `${tagName}=${tagValue}`)
    .save(tmp)
    .on("end", () => {
      fs.unlink(filePath, () => {
        fs.renameSync(tmp, filePath);
      });
    });
}

module.exports = {
  editAudio: editAudio,
  editAudioMetadata: editAudioMetadata
};
