const RSS = require("rss");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const config = require("./config.js");
const log = require("./logger.js");

const siteUrl = config.protocol + "www.riigipodcast.ee:" + config.port + "/";

function getProcessingAudioById(givenId) {
  return getAudioFiles(true).find(
    existingId =>
      existingId.replace(new RegExp(`${config.audioExtension}.tmp$`), "") ===
      givenId
  );
}

function getAudioById(givenId) {
  return getAudioFiles(false).find(
    existingId =>
      existingId.replace(new RegExp(`${config.audioExtension}$`), "") ===
      givenId
  );
}

/* async function getAudioById(givenId) {
  let matchingMediaFile;
  let promises = [];
  getMediaFiles().forEach(currentMediaFile => {
    promises.push(
      new Promise((resolve, reject) => {
        ffmpeg.ffprobe(
          config.storageDir + currentMediaFile,
          (err, metadata) => {
            if (err) {
              log.error(err);
            }
            if (metadata.format.tags.title === givenId) {
              matchingMediaFile = currentMediaFile;
              resolve();
            } else {
              reject();
            }
          }
        );
      })
    );
  });
  // Return when first promise resolves or when all reject
  try {
    await Promise.all(
      promises.map(p => {
        // Swapping reject and resolve cases
        // Promise.all() returns when there is one resolve or all rejects
        return p.then(
          val => Promise.reject(val),
          err => Promise.resolve(err)
        );
      })
    );
  } catch (value_1) {
    return matchingMediaFile;
  }
} */

function getMetadataFromAudio(id, tag) {
  const audio = getAudioById(id);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(config.storageDir + audio, (err, metadata) => {
      if (err) {
        log.error(err);
        reject(err);
      }
      resolve(metadata.format.tags[tag]);
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

  const audioList = getAudioListSortedByDate();
  audioList.forEach((audio, index) => {
    const promises = [];
    promises.push(getMetadataFromAudio(audio /* remove extension */, "title"));
    promises.push(
      new Promise((resolve, reject) => {
        fs.readFile(
          config.storageDir + getDescriptionFileOfAudio(audio),
          (err, data) => {
            err ? reject(err) : resolve(data);
          }
        );
      })
    );

    Promise.all(promises).then(values => {
      feed.item({
        title: values[0],
        description: values[1],
        guid: audio,
        url: siteUrl + "?file=" + (index + 1),
        enclosure: {
          url: siteUrl + "?file=" + (index + 1),
          file: config.storageDir + audio
        }
      });
    });
  });

  return feed.xml();
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

function getDescriptionFileOfAudio(audio) {
  return audio.replace(
    new RegExp(`${config.audioExtension}$`),
    config.descriptionExtension
  );
}

function getAudioByName(givenFileName) {
  return getAudioFiles(false).find(
    existingFileName =>
      existingFileName.replace(new RegExp(`${config.audioExtension}$`), "") ===
      givenFileName
  );
}

function getAudioFiles(findTemporaries) {
  const pattern = findTemporaries
    ? `${config.audioExtension}.tmp$`
    : `${config.audioExtension}$`;
  return fs.readdirSync(config.storageDir).filter(file => file.match(pattern));
}

function getAudioListSortedByDate() {
  return getAudioFiles(false)
    .map(name => {
      return {
        name: name,
        time: fs.statSync(config.storageDir + name).birthtime
      };
    })
    .sort((file1, file2) => file2.time - file1.time)
    .map(file => {
      return file.name;
    });
}

module.exports = {
  createDescription: createDescription,
  createRSS: createRSS,
  getAudioById: getAudioById,
  getAudioByName: getAudioByName,
  getAudioListSortedByDate: getAudioListSortedByDate,
  getMetadataFromAudio: getMetadataFromAudio,
  getProcessingAudioById: getProcessingAudioById,
  removeOldContent: removeOldContent,
  createHTML: createHTML
};
