//Invite Link:
//https://discord.com/oauth2/authorize?client_id=734138894706147389&scope=bot
const config = require('./config.json');
const discordClient = require('./components/discordConnect')
const twitterClient = require('./components/twitterConnect')
const tweetStorm = require('./components/tweetStorm')
const contentParser = require('./components/contentParser.js')

let interval = config.interval.hour * 6;
interval = config.interval.minute * 5;

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
        const intervalFunction = async (bot) => {
            let passage = await bot.DB.getPassage();
            console.log('Passage loaded')

            // Send the message to the channel
            if (passage) {
                bot.publishDiscord(passage.syndication.discord);
                new tweetStorm(twitterClient, passage).run();
            }
        };

        // Execute the interval function immediately
        setTimeout(function(bot) {
            intervalFunction(bot);
        }, 5000 , this)

        // Schedule the interval function to run at regular intervals
        setInterval(intervalFunction, interval, this);
    }


    onDiscordReady() {
        discordClient.on('ready', () => {
            /* Load data and start server */
            this.DB.loadDatabase();
        });
    }

}


let Bot = new JakobLorberBot()