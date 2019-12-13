const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const log = require("./logger.js");
const config = require("./config.js");

function processAudio(videoStream, title, id) {
  return editAudio(videoStream, title, id);
}

function editAudio(readableStream, title, id) {
  const fileName = config.storageDir + id + config.audioExtension;
  const tmp = fileName + ".tmp";

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
      .format("mp3")
      // TODO add .audioCodec("copy") and compare
      .audioBitrate("96k") //generally used for speech or low-quality streaming
      //.format("mp3") //ffmpeg cant determine format from a stream
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
        fs.renameSync(tmp, fileName);
      })
  );
}

function editAudioMetadata(fileName, tagName, tagValue) {
  const tmp = fileName + ".tmp";

  ffmpeg(fileName)
    .audioCodec("copy")
    .on("error", error => log.error(error))
    .outputOption("-metadata", `${tagName}=${tagValue}`)
    .save(tmp)
    .on("end", () => {
      fs.unlink(fileName, () => {
        fs.renameSync(tmp, fileName);
      });
    });
}

module.exports = {
  processAudio: processAudio,
  editAudioMetadata: editAudioMetadata
};
