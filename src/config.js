const env = process.env.NODE_ENV; //dev or prod

let config;

config =
  env === "dev"
    ? {
        feedEndpoint: "/testFeed",
        homeEndpoint: "/test",
        loggerDir: ".logs/devLogs",
        publish: false,
        storageDir: ".audioStorage/devAudio",
        youTubeChannels: ["UCl2a12GbW8e9itYOJDyjNoA"] // Joonas Praks
      }
    : {
        feedEndpoint: "/feed",
        homeEndpoint: "/",
        loggerDir: ".logs/productionLogs",
        publish: true,
        storageDir: ".audioStorage/productionAudio",
        youTubeChannels: ["ValitsuseUudised", "UCS1xJUQbauo60LJCEbiiJvg"] // valitsus, Riigikogu
      };

config.podbeanCredentials = {
  // riigiPodcast.podbean
  id: "1405d6a0497f64f70d6d1",
  secret: "2872053f56f0b2e656d4f"
};
config.extension = ".mp3";

module.exports = {
  config: config
};
