
/* Load Discord Client & Configurations*/
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
client.login(config.token);


/* declare globals */
let memory = [];

/* Load methods */
const server = require('./methodsServer.js')(memory,client);
const bot = require('./methodsBot.js')(memory,client);


/**
 * On Ready
 */
client.on('ready', () => {

    /* set objects */
    memory.bot = bot;
    memory.server = server;
    memory.channel = {};
    memory.channel.interval = config.interval;
    memory.channel.serverChannelName = "channel name not set"
    memory.channel.serverChannelID = "channel id not set"
    memory.channel.serverStatus = "not running"
    memory.processor = {};


    /* Load data and start server */
    bot.init( server.init );
});

/**
 * Add Listeners
 */
client.on('message', message => {

    /* make sure message is bot command */
    if (message.content.charAt(0) != config.prefix) {
        return;
    }

    /* remove command prefix from message */
    message.content = message.content.substr(1);
    mParts = message.content.split(" ");
    command = mParts[0]
    param = mParts[1];
    param2 = mParts[2];

    /* set channel variables */
    memory.channel.serverChannelID = message.channel.id;
    memory.channel.serverChannelName = message.channel.name;

    switch (command) {
        case "help":
            bot.getCommands();
            break;
        case "ping":
            message.reply('pong');
            break;
        case "parrot":
            client.channels.cache.get(message.channel.id).send(param);
            break;
        case "start":
            if (param) {
                if (parseInt(param) < 1) {
                    client.channels.cache.get(message.channel.id).send("```invalid interval set. server not started.```");
                    return
                }
                memory.channel.interval = param;
                client.channels.cache.get(message.channel.id).send("```server interval set to "+param + " seconds```");
            }

            server.start()
            break;
        case "restart":
            server.restart()
            break;
        case "stop":
            server.stop();
            break;
        case "dumpDB":
            break;
        case "set":
            switch(param) {
                case 'interval':
                    if (!param2 || parseInt(param2) < 1 ) {
                        client.channels.cache.get(message.channel.id).send("```invalid interval```");
                        break;
                    }

                    memory.channel.interval = param2;
                    client.channels.cache.get(message.channel.id).send("```new interval set to "+param2 + " seconds. please restart starver.```");

                    break;
                default:
                    client.channels.cache.get(message.channel.id).send("```" +param + " command not recognized```");
                    break;
            }

            break;
        default:
            message.reply('```command not recognized```');
            break;
    }

});
