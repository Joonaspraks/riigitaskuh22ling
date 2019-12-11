const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const log = require("./logger.js");
const config = require("./config.js");

function extractAndEditAudio(readableStream, title) {
  // create new file immediately to discourage double file creation

  // TODO if file later empty, remove
  /*   const writableStream = fs.createWriteStream(
    config.storageDir + title + config.mediaExtension
  ); */
  /*   return ffmpeg(readableStream)
    .preset("podcast")
    .on("error", error => log.error(error))
    .save(config.storageDir + title + config.mediaExtension); */
  return (
    ffmpeg(readableStream)
      .audioBitrate("24k")
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
        log.info(
          "The timestamp of the current frame in seconds: " + progress.timemark
        )
      )
      .on("error", error => log.error(error))
      //.save('earwaxIstung2.mp3');
      //.outputOption('-metadata', `title=${description}`)
      .save(config.storageDir + title + config.mediaExtension)
  );
}

module.exports = { extractAndEditAudio: extractAndEditAudio };
