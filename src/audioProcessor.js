const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const log = require("./logger.js");
const config = require("./config.js");

function processAudio(videoStream, title, id) {
  return editAudio(videoStream, title, id);
}

function editAudio(readableStream, title, id) {
  const filePath = config.storageDir + id + config.audioExtension;
  const tmp = filePath + ".tmp";

  // TODO if file later empty, remove
  /*   const writableStream = fs.createWriteStream(
    config.storageDir + title + config.audioExtension
  ); */
  /*   return ffmpeg(readableStream)
    .preset("podcast")
    .on("error", error => log.error(error))
    .save(config.storageDir + title + config.audioExtension); */
  return (
    ffmpeg(readableStream)
      //ffmpeg(config.storageDir+"abc.mp3")
      .format("mp3") //ffmpeg cant determine format from a stream
      // TODO add .audioCodec("copy") and compare
      .audioBitrate("96k") //generally used for speech or low-quality streaming
      //noise removal
      //detect general audio level to cut silence
      //note that questioneers mic sound can be lower than the ministers
      .audioFilters(
        "silenceremove=" +
        /*             'start_periods=0:'+ //trim until 1 non-silence
               'start_duration=0:'+ //atleast that amount of seconds to be a 'silence'
               'start_threshold=0:'+ //what dB constitutes a 'silence' */

        "stop_periods=-1:" + //negative value means that silencing will occur in the middle of the file, '1' means that 'trim until 1 non-silence'
        "stop_duration=3:" + //atleast that amount of seconds to be a 'silence'
          "stop_threshold=-35dB",

        //'earwax'+
        //'loudnorm',
        "dynaudnorm"
      ) //what dB constitutes a 'silence'

      .on("progress", progress =>
        log.info(`Processing ${title}: ${progress.timemark}`)
      )
      .on("error", error => log.error(error))
      //.save('earwaxIstung2.mp3');
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
  processAudio: processAudio,
  editAudioMetadata: editAudioMetadata
};
