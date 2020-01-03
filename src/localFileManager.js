const RSS = require("rss");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const config = require("./config.js");
const log = require("./logger.js");

const siteUrl = config.protocol + "www.riigipodcast.ee:" + config.port + "/";

function getAudioById(givenId) {
  return getAudioFiles().find(
    existingId =>
      existingId.replace(new RegExp(`${config.audioExtension}$`), "") ===
      givenId
  );
}

function getMetadataFromAudio(audio, tag) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(config.storageDir + audio, (err, metadata) => {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        resolve(metadata.format.tags[tag]);
      }
    });
  });
}

function createDescription(fileName, description) {
  fs.writeFileSync(
    config.storageDir + fileName + config.descriptionExtension,
    description
  );
}

function removeOldContent() {
  const maxSize = 20;

  const audioFilesToBeRemoved = getAudioListSortedByDate().slice(maxSize);

  audioFilesToBeRemoved.forEach(audio => {
    try {
      fs.unlinkSync(config.storageDir + audio);
      fs.unlinkSync(config.storageDir + getDescriptionFileOfAudio(audio));
    } catch (err) {
      log.error(err);
    }
  });
}

function createRSS() {
  var feed = new RSS({
    title: "Riigi Podcast",
    description:
      "Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube'ist",
    feed_url: siteUrl + "feed",
    site_url: siteUrl
  });

  const audioList = getAudioFiles();
  const audioDataPromises = [];
  audioList.forEach(audio => {
    audioDataPromises.push(
      new Promise((resolve, reject) => {
        //Create promises for fetching file title, description and creationTime
        const titlePromise = getMetadataFromAudio(audio, "title");
        const descriptionPromise = new Promise((resolve, reject) => {
          fs.readFile(
            config.storageDir + getDescriptionFileOfAudio(audio),
            (err, data) => {
              err ? reject(err) : resolve(data);
            }
          );
        });
        const datePromise = new Promise((resolve, reject) => {
          fs.stat(config.storageDir + audio, (err, data) => {
            err ? reject(err) : resolve(data.birthtime);
          });
        });

        Promise.all([titlePromise, descriptionPromise, datePromise])
          .then(values =>
            resolve({
              audio: audio,
              title: values[0],
              description: values[1],
              date: values[2]
            })
          )
          .catch(err => {
            log.error(err);
            reject();
          });
      })
    );
  });

  return Promise.all(audioDataPromises).then(audioObjects => {
    audioObjects.sort(
      (audioObject1, audioObject2) => audioObject2.date - audioObject1.date
    );
    audioObjects.forEach(audioObject => {
      const audio = audioObject.audio;
      feed.item({
        title: audioObject.title,
        description: audioObject.description,
        date: audioObject.date,
        guid: audio,
        url: siteUrl + "?file=" + getIdOfAudio(audio),
        enclosure: {
          url: siteUrl + "?file=" + getIdOfAudio(audio),
          file: config.storageDir + audio
        }
      });
    });

    return feed.xml();
  });
}

function createHTML() {
  return (
    "<html><head><meta charset='UTF-8'" +
    "name='google-site-verification' content='71QmVVJaUYxxAbp0YHhwaQ-gHcNnct4LtzaTt4ESPV0' /></head>" +
    "<body><h1>Riigi Podcast</h1>" +
    "<p>Riigi Podcast on saadaval aadressil <a href='https://riigipodcast.podbean.com/'>riigipodcast.podbean.com</a> " +
    "või lisades <a href='https://riigipodcast.ee/feed'>https://riigipodcast.ee/feed</a> oma valitud RSS agregaatorisse</p>" +
    "</body></html>"
  );
}

function getAudioById(givenId) {
  return getAudioFiles().find(
    existingId =>
      existingId.replace(new RegExp(`${config.audioExtension}$`), "") ===
      givenId
  );
}

function getAudioFiles() {
  return fs
    .readdirSync(config.storageDir)
    .filter(file => file.match(`${config.audioExtension}$`));
}

function getAudioListSortedByDate() {
  return getAudioFiles()
    .map(audio => {
      return {
        name: audio,
        time: fs.statSync(config.storageDir + audio).birthtime
      };
    })
    .sort((file1, file2) => file2.time - file1.time)
    .map(file => {
      return file.name;
    });
}

function getDescriptionFileOfAudio(audio) {
  return audio.replace(
    new RegExp(`${config.audioExtension}$`),
    config.descriptionExtension
  );
}

function getIdOfAudio(audio) {
  return audio.replace(new RegExp(`${config.audioExtension}$`), "");
}

function getMetadataFromAudio(audio, tag) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(config.storageDir + audio, (err, metadata) => {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        resolve(metadata.format.tags[tag]);
      }
    });
  });
}

function getProcessingAudioFile() {
  return fs
    .readdirSync(config.storageDir)
    .find(file => file.match(`${config.audioExtension}.tmp$`));
}

module.exports = {
  createDescription: createDescription,
  createRSS: createRSS,
  getAudioById: getAudioById,
  getMetadataFromAudio: getMetadataFromAudio,
  getProcessingAudioFile: getProcessingAudioFile,
  removeOldContent: removeOldContent,
  createHTML: createHTML
};
