//Invite Link:
//https://discord.com/oauth2/authorize?client_id=734138894706147389&scope=bot
const config = require('./config.json');
const discordClient = require('./components/discordConnect')
const twitterClient = require('./components/twitterConnect')
const tweetStorm = require('./components/tweetStorm')
const contentParser = require('./components/contentParser.js')

class JakobLorberBot {

    constructor() {
        this.init();
        this.DB = new contentParser();
    }


    init() {
        console.log("JakobLorberBot Version "+config.version)
        this.onDiscordReady()
        this.startInterval()
    }


    async publishDiscord(passage) {
        const discordChannel = await discordClient.channels.fetch(config.discord.targetChannel);

        await discordChannel.send(passage)
            .then(response => {
                console.log('Published passage to Discord.')
            })
            .catch(error => {
                console.error("Discord API Error:", error);
            });
    }


    startInterval() {
        setInterval( async function (bot) {

            let passage = await bot.DB.getPassage();
            console.log('Passage loaded')
            //console.log(passage)

            // Send the message to the channel
            if (passage) {
                bot.publishDiscord(passage.syndication.discord);
                new tweetStorm( twitterClient , passage).run();
            }


        }, config.interval.second * 30 , this);
    }

    onDiscordReady() {
        discordClient.on('ready', () => {
            /* Load data and start server */
            this.DB.loadDatabase();
        });
    }

}


let Bot = new JakobLorberBot()