const env = process.env.NODE_ENV; //dev or prod
const fs = require("fs");

let config;

config =
    env === "dev" ?
    {
        loggerDir: "./logs/devLogs/",
        hmacSecret: "qVt5FXH8RpHprlFetynj",
        port: 9090,
        protocol: "http://",
        publish: false,
        storageDir: "./audioStorage/devAudio/",
        useReroute: false,
        youTubeChannels: ["UCl2a12GbW8e9itYOJDyjNoA", "UC0FfpQ9PI9TSjuDl4byyjKQ"], // Joonas Praks, riigiPodcastDemo
        podbeanCredentials: {
            // riigiPodcastDemo.podbean
            id: "c49783cc3a2a051139b2c",
            secret: "9206e335d3d0951c33750"
        }
    } :
    {
        loggerDir: "./logs/productionLogs/",
        hmacSecret: "NjPWAxQeykUoixaYt1HJ",
        port: 443,
        protocol: "https://",
        publish: true,
        SSLCert: {
            key: fs.readFileSync(
                "/etc/letsencrypt/live/riigipodcast.ee/privkey.pem"
            ),
            cert: fs.readFileSync(
                "/etc/letsencrypt/live/riigipodcast.ee/fullchain.pem"
            )
        },
        storageDir: "./audioStorage/productionAudio/",
        useReroute: true,
        youTubeChannels: ["UCy2B86RwjKly8vab4GTg5Fw", "UCS1xJUQbauo60LJCEbiiJvg"], // valitsus, Riigikogu
        podbeanCredentials: {
            // riigiPodcast.podbean
            id: "ae8a1c25eebae0f77ee14",
            secret: "88976ea998eac5f6042b1"
        }
    };

config.descriptionExtension = ".txt";
config.audioExtension = ".mp3";

module.exports = config;