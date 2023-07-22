const { TwitterApi } = require('twitter-api-v2');
const config = require('./../config.json');

const tClient = new TwitterApi({
    appKey: config.twitterAPI.apiKey,
    appSecret: config.twitterAPI.apiKeySecret,
    accessToken: config.twitterAPI.accessToken,
    accessSecret: config.twitterAPI.accessTokenSecret
});

const twitterClient = tClient.readWrite;

module.exports =  twitterClient