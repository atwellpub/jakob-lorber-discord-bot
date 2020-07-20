/* load requirements */
const config = require('./config.json');


/**
 * Setup Server routines
 *
 */

module.exports = function (memory , client) {
    return {

        init: function () {
            console.log("Running server.init()")
            console.log("Jakob Lorber Bot "+config.version+" Running")

        },
        start: function () {

            memory.channel.serverStatus = "running";

            /* annouce server is starting */
            let annouce = "```starting server. passages will be posted every " + memory.channel.interval + " seconds```"
            client.channels.cache.get(memory.channel.serverChannelID).send(annouce);

            this.interval = setInterval(function () {
                memory.bot.getPassage();
                setTimeout(function() {
                    memory.server.postPassage();
                }, 5000)
            }, memory.channel.interval * 1000);
        },
        stop: function () {

            memory.channel.serverStatus = "not running";

            clearInterval(this.interval);

            let annouce = "```server stopped```"
            console.log(annouce)
            client.channels.cache.get(memory.channel.serverChannelID).send(annouce);
        },
        restart: function () {

            let annouce = "```restarting server```"
            console.log(annouce)
            client.channels.cache.get(memory.channel.serverChannelID).send(annouce);

            memory.server.stop();

            setTimeout(function() {
                memory.server.start();
            } , 1000 )
        },
        postPassage: function () {
            client.channels.cache.get(memory.channel.serverChannelID).send(
                 memory.processor.targetChapter.content
            );
        }
    }
}