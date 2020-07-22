/* load requirements */
const config = require('./config.json');
const fs = require("fs");
const path = require("path");
const util = require("util");
/**
 * Database Methods
 *
 */
module.exports = function( memory , client) {
    return {
        init: function ( callback) {

            /* Load book titles */
            fs.readFile(path.join(__dirname, "assets/jl-database-en", "databooks-en.txt"), 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }

                memory.bookTitles = {};
                memory.bookTitles.rawData = data;
                memory.bookTitles.titles = memory.bookTitles.rawData.split(/\r\n|\r|\n/);;

                console.log('databooks-en.txt loaded.')

                /* Load passages */
                fs.readFile(path.join(__dirname, "assets/jl-database-en", "database-en.txt"), 'utf8', function (err, data) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }

                    memory.bookContent = []
                    memory.bookContent.rawData = data;

                    memory.bookContent.lines = memory.bookContent.rawData.split(/\r\n|\r|\n/);
                    memory.bookContent.linesCount = memory.bookContent.lines.length;

                    console.log('database-en.txt loaded.')
                    console.log(memory.bookContent.linesCount + " lines loaded");


                    callback()
                });
            });

        },
        getCommands: function () {
            var m = "```*** Current Commands: *** \r\n"
                + "`!start` starts server inside this channel.  \r\n"
                + "`!start INT` starts server inside this channel with interval param set.  \r\n"
                + "`!stop` stops server everywhere \r\n"
                + "`!restart` stops and then restarts server in current channel \r\n"
                + "`!set interval INT` overwrites default posting interval in secods \r\n"
                + "\r\n"
                + "*** Target Server Channel ***\r\n"
                + "#" + memory.channel.serverChannelName + " (" + memory.channel.serverChannelID + ")" + "\r\n"
                + "\r\n"
                + "*** Current Status ***\r\n"
                +  memory.channel.serverStatus + " (every "+memory.channel.interval+" seconds)\r\n"
                + "\r\n"
                + "*** Database Deails ***\r\n"
                + memory.bookContent.linesCount + " passages loaded\r\n"

            m = m + "```"

            client.channels.cache.get(memory.channel.serverChannelID).send(m);
        },
        getPassage: function () {

            console.log('Get random line')
            memory.bot.getRandomLine()
            console.log(memory.processor.targetLine)

            console.log('Get target passage')
            memory.bot.getTargetPassage();

            console.log('Expand target passage')
            memory.bot.getExpandedPassage();

            console.log('Parse expanded passage')
            memory.bot.parseExpanded();
            //console.log(util.inspect(memory.processor.chaptersParsed, {showHidden: false, depth: null}))

            console.log('Discover full chapter')
            memory.bot.getChapterFromParsed();
            //console.log(util.inspect(memory.processor.targetChapter, {showHidden: false, depth: null}))

            console.log('Get full book name')
            memory.bot.getFullBookNameFromParsedChapterData();
            //console.log(util.inspect(memory.processor.targetChapter, {showHidden: false, depth: null}))

            console.log('Truncate passage to <2000 characters')
            memory.bot.truncateContent();

            console.log('Prepend Chapter Title to content')
            memory.bot.prependTitleToContent();

            console.log('Append url to content')
            memory.bot.appendURLToContent();

            console.log("Passage loaded and ready");
            console.log(memory.processor.targetChapter);

        },
        getRandomLine: function () {
            min = Math.ceil(1);
            max = Math.floor(memory.bookContent.linesCount);
            memory.processor.targetLine = Math.floor(Math.random() * (max - min + 1)) + min;
        },
        getTargetPassage() {
            memory.processor.targetPassage = [];
            memory.processor.targetPassage.raw = memory.bookContent.lines[memory.processor.targetLine]
            memory.processor.targetPassage.parts = memory.processor.targetPassage.raw.split('|')
        },
        getExpandedPassage() {
            memory.processor.expandedPassage = [];

            var min = memory.processor.targetLine - 60;
            var max = memory.processor.targetLine + 60;

            for (i= min; i< max ; i++ ) {
                memory.processor.expandedPassage[i] = [];
                memory.processor.expandedPassage[i].raw = memory.bookContent.lines[i]
                memory.processor.expandedPassage[i].parts = memory.processor.expandedPassage[i].raw.split('|')
            }
        },
        parseExpanded() {
            let sample =  {};
            for ( lineNum in memory.processor.expandedPassage) {

                var book = memory.processor.expandedPassage[lineNum].parts[0];
                var bookNo = memory.processor.expandedPassage[lineNum].parts[1];
                var chapter = memory.processor.expandedPassage[lineNum].parts[2];
                var pgNo = memory.processor.expandedPassage[lineNum].parts[3];
                var isHeadline = memory.processor.expandedPassage[lineNum].parts[4];
                var content = memory.processor.expandedPassage[lineNum].parts[5];


                /* bookNo can never be 0 */
                if (bookNo === 0 ) {
                    bookNo = 1;
                }

                /* create first iterations */
                if (typeof sample[book] == 'undefined' ) {
                    sample[book] = {}
                }

                if (typeof sample[book][bookNo] == 'undefined' ) {
                    sample[book][bookNo] = {}
                }

                if (typeof sample[book][bookNo][chapter] == 'undefined' ) {
                    sample[book][bookNo][chapter] = []
                }

                /* if is headline make all caps */
                if (isHeadline==1 ){

                    /* do not push target if headline */
                    if (sample[book][bookNo][chapter][0] != "TARGET") {
                        sample[book][bookNo][chapter].push("TARGET");
                        targetFound = true;
                    }

                    content = content.toUpperCase();
                }

                sample[book][bookNo][chapter].push(content);
            }

            memory.processor.chaptersParsed = sample;
        },
        getChapterFromParsed : function() {

            let targetFound = false;
            memory.processor.targetChapter = {};

            /* loop books */
            for ( book in memory.processor.chaptersParsed) {

                /* loop book numbers */
                for ( bookNo in memory.processor.chaptersParsed[book]) {

                    /* loop chapters */
                    for ( chapter in memory.processor.chaptersParsed[book][bookNo]) {

                        /* check if chapter has more than 4 lines to make sure we have a good target */
                        if (memory.processor.chaptersParsed[book][bookNo][chapter].length <5) {
                            continue;
                        }

                        /* update memory with current chapter item */
                        memory.processor.targetChapter.book = book;
                        memory.processor.targetChapter.bookNo = bookNo;
                        memory.processor.targetChapter.chapter = chapter;
                        memory.processor.targetChapter.chapterTitle = "";
                        memory.processor.targetChapter.content = memory.processor.chaptersParsed[book][bookNo][chapter].join("\r\n\r\n");

                        /* check if first chapter item has a target flag (title based entry) */
                        if (memory.processor.chaptersParsed[book][bookNo][chapter][0] != "TARGET") {
                            continue;
                        }


                        /* remove target flag */
                        memory.processor.chaptersParsed[book][bookNo][chapter].shift();

                        /* update chapter title */
                        memory.processor.targetChapter.chapterTitle = memory.processor.chaptersParsed[book][bookNo][chapter].shift();

                        /* update chapter content */
                        memory.processor.targetChapter.content = memory.processor.chaptersParsed[book][bookNo][chapter].join("\r\n\r\n");

                        return;
                    }
                }
            }
        },
        getFullBookNameFromParsedChapterData : function() {
            for ( index in memory.bookTitles.titles) {
                var parsed = memory.bookTitles.titles[index].split('|')

                if (parsed[0] != memory.processor.targetChapter.book) {
                    continue;
                }

                memory.processor.targetChapter.titleParsed = parsed;
                memory.processor.targetChapter.bookTitleFull = parsed[1]

                return;
            }
        },
        truncateContent : function() {
            let length = 1600;

            if ( !memory.processor.targetChapter.content ) {
                console.log(util.inspect(memory.processor.chaptersParsed, {showHidden: false, depth: null}))
            }

            memory.processor.targetChapter.content = memory.processor.targetChapter.content.substring(0, length) + "...";
        },
        prependTitleToContent : function() {
            var title = memory.processor.targetChapter.chapterTitle + "\r\n"
                        + memory.processor.targetChapter.bookTitleFull;

            if (memory.processor.targetChapter.titleParsed[5]>1) {
                title = title + " Book " + memory.processor.targetChapter.bookNo;
            }

            if (memory.processor.targetChapter.chapter>1) {
                title = title + " Chapter " + memory.processor.targetChapter.chapter;
            }

            title = title + "\r\n" + "\r\n"

            memory.processor.targetChapter.content = title + memory.processor.targetChapter.content;

            /* set content in pre tags */
            memory.processor.targetChapter.content = "```" + memory.processor.targetChapter.content + "```"

        },
        appendURLToContent : function() {

            let s = memory.processor.targetChapter.book + " ";

            if (memory.processor.targetChapter.bookNo>0) {
                s = s + memory.processor.targetChapter.bookNo + "." + memory.processor.targetChapter.chapter
            } else {
                s = s + memory.processor.targetChapter.chapter
            }

            let url = "https://www.jakob-lorber.cc/index.php?l=en&s="+encodeURI(s)

            memory.processor.targetChapter.url = url;

            memory.processor.targetChapter.content =  memory.processor.targetChapter.content + "\r\n" + url ;
        }
    }
};

