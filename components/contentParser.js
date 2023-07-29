/* load requirements */
const config = require('../config.json');
const fs = require("fs").promises; // Using the fs Promises API for async/await
const path = require("path");
const util = require("util");

class contentParser {
    constructor() {
        this.memory = {
            bookTitles: {
                rawData : "",
                titles : []
            },
            bookContent: {
                books: {}
            },
            passage: {}
        };
    }

    async loadDatabase() {
        try {
            const bookData = await fs.readFile(path.join(__dirname, "./../assets/jl-database-en", "databooks-en.txt"), 'utf8');
            this.memory.bookTitles.rawData = bookData;
            this.memory.bookTitles.titles = [];
            let titles = this.memory.bookTitles.rawData.split(/\r\n|\r|\n/);

            titles.forEach(title => {
                const parts = title.split('|');

                if (!parts[0]) {
                    return;
                }

                this.memory.bookTitles.titles[parts[0]] = {
                    'abr' : parts[0],
                    'title' : parts[1]
                }
            })

            console.log('databooks-en.txt loaded.')
            console.log(this.memory.bookTitles)

            const passageData = await fs.readFile(path.join(__dirname, "./../assets/jl-database-en", "database-en.txt"), 'utf8');
            this.memory.bookContent.rawData = passageData;

            this.parseBooks();

            console.log('database-en.txt loaded.')
            console.log(this.memory.bookContent.linesCount + " lines loaded");
        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    }

    parseBooks() {
        this.memory.bookContent.lines = this.memory.bookContent.rawData.split(/\r\n|\r|\n/);
        this.memory.bookContent.linesCount = this.memory.bookContent.lines.length;

        this.memory.bookContent.lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length >= 6) {
                const [book, bookNo, chapter, pgNo, isHeadline, content] = parts;
                if (!this.memory.bookContent.books[book]) {
                    this.memory.bookContent.books[book] = {};
                }
                if (!this.memory.bookContent.books[book][bookNo]) {
                    this.memory.bookContent.books[book][bookNo] = {};
                }
                if (!this.memory.bookContent.books[book][bookNo][chapter]) {
                    this.memory.bookContent.books[book][bookNo][chapter] = [];
                }
                this.memory.bookContent.books[book][bookNo][chapter].push({
                    pgNo: parseInt(pgNo),
                    isHeadline: parseInt(isHeadline),
                    content
                });
            }
        });

    }

    async logToJSON(passages) {
        try {
            const filePath = path.join(__dirname, "./../logs/passages.json");

            // Check if the log file exists
            let existingData = [];
            try {
                const existingContent = await fs.readFile(filePath, "utf8");
                existingData = JSON.parse(existingContent);
            } catch (err) {
                // If the log file does not exist, create it with an empty array
                await fs.writeFile(filePath, "[]", "utf8");
            }

            // Add the new passage to the existing array
            existingData.push(passages);

            // Convert the array to JSON with pretty formatting
            const jsonData = JSON.stringify(existingData, null, 2);

            // Write the updated array back to the log file
            await fs.writeFile(filePath, jsonData, "utf8");
            console.log("Passage added and bookContent updated in passages.json.");
        } catch (err) {
            console.error("Error saving bookContent to JSON:", err);
        }
    }




    async getPassage() {
        console.log('Get random passage');
        await this.getRandomPassage();

        console.log('Get extended passage');
        await this.getExtendedPassage();

        console.log('Build discord full extended passage');
        await this.buildExtendedPassage();

        console.log('Truncate passage to <2000 characters');
        await this.truncateContent();

        console.log('Append url to content');
        await this.appendURLToContent();

        //console.log('Passage loaded and ready');
        //console.log(this.memory.passage.targetChapter);
        if (this.memory.passage.extendedCleaned.length <3) {
            return '';
        } else {
            return this.memory.passage;
        }
    }



    async getRandomPassage() {
        const books = [];
        for (const book in this.memory.bookContent.books) {
            const bookNumbers = Object.keys(this.memory.bookContent.books[book]);
            for (let i = 0; i < bookNumbers.length; i++) {
                books.push(book);
            }
        }

        const rbi = Math.floor(Math.random() * books.length);
        const randomBook = books[rbi];
        console.log('book selected ' + randomBook )
        if (typeof randomBook == 'undefined') {
            console.log('book index ' + rbi + ' of ' + books.length )
            console.log(books)
            console.log(this.memory.bookContent.books)
        }

        const bookNumbers = Object.keys(this.memory.bookContent.books[randomBook]);
        const randomBookNo = bookNumbers[Math.floor(Math.random() * bookNumbers.length)];
        const chapters = Object.keys(this.memory.bookContent.books[randomBook][randomBookNo]);
        const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];

        const passages = this.memory.bookContent.books[randomBook][randomBookNo][randomChapter];
        const randomIndex = Math.floor(Math.random() * passages.length);
        const randomPassage = passages[randomIndex];

        this.memory.passage = {
            index : randomIndex,
            book: randomBook,
            bookTitle: this.memory.bookTitles.titles[randomBook].title,
            bookNo: randomBookNo,
            chapter: randomChapter,
            pgNo: randomPassage.pgNo,
            isHeadline: randomPassage.isHeadline,
            content: randomPassage.content,
            search: '',
            url: 'https://www.jakob-lorber.cc/',
            extendedRaw: [],
            extendedCleaned: [],
            syndication: {
                discord : "",
                twitter : ""
            }
        };

        //console.log(this.memory.passage)
    }




    async getExtendedPassage() {
        let currentIndex = this.memory.passage.index;
        let currentBook = this.memory.passage.book;
        let currentBookNo = this.memory.passage.bookNo;
        let currentChapter = this.memory.passage.chapter;
        let passages = this.memory.bookContent.books[currentBook][currentBookNo][currentChapter]

        this.memory.passage.search =  `${currentBook} ${currentBookNo !== '0' ?  currentBookNo +'.' : ''} ${currentChapter !== '0' ? currentChapter : ''}`;

        // Check if the selected passage is a headline
        if (this.memory.passage.isHeadline === 1) {
            let start = currentIndex;

            // If the current passage is a subheadline, find the actual headline
            while (start > 0 && passages[start - 1].isHeadline) {
                start--;
            }

            let consecutiveHeadlines = 0;

            // Include passages from start to the next headline (exclusive)
            for (let i = start; i < passages.length; i++) {
                if (passages[i].isHeadline) {
                    consecutiveHeadlines++;
                    if (consecutiveHeadlines > 4) {
                        console.log('Passage skipped due to more than four consecutive headlines.');
                        this.memory.passage = {}
                        return; // Skip the passage expansion
                    }
                } else {
                    consecutiveHeadlines = 0; // Reset the count
                }

                this.memory.passage.extendedRaw.push(passages[i]);
                this.memory.passage.extendedCleaned.push(passages[i].content);
            }
        } else {
            let start = currentIndex - 1;

            // If the current passage is not a headline, find the previous headline
            while (start > 0 && !passages[start].isHeadline) {
                start--;
            }

            // Include passages from start to the current index (exclusive)
            for (let i = start; i < (currentIndex + 50) ; i++) {
                console.log(i)
                if (typeof passages[i] === 'undefined') {
                    break;
                }

                if( i > start && passages[i].isHeadline ){
                    console.log('here')
                    break;
                }

                this.memory.passage.extendedRaw.push(passages[i]);
                this.memory.passage.extendedCleaned.push(passages[i].content);
            }
        }

        this.logToJSON(this.memory.passage).then();
    }


    async buildExtendedPassage() {

        if (!this.memory.passage || !this.memory.passage.extendedCleaned) {
            console.log('ExtendedCleaned or Passage is empty')
          return;
        }

        // Get the required information from memory.passage
        const { chapter, book, bookNo } = this.memory.passage;

        // Create the header with the headline, book, volume, and chapter information
        let discordHeader = `${this.memory.passage.extendedCleaned[0].toUpperCase()}\n${this.memory.bookTitles.titles[book].title}`;
        let twitterHeader = `${this.memory.passage.extendedCleaned[0].toUpperCase()}\n\n${this.memory.bookTitles.titles[book].title}`;

        if (bookNo > 0) {
            discordHeader += ` Book ${bookNo}`;
            twitterHeader += ` Book ${bookNo}`;
        }

        if (chapter > 0) {
            discordHeader += ` Chapter ${chapter}`;
            twitterHeader += ` Chapter ${chapter}`;
        }

        // Join passages (excluding the first one, as it is already used in the header)
        const discordContent = this.memory.passage.extendedCleaned.slice(1).join("\n\n");

        let headlineCount = 0;

        const twitterContent = this.memory.passage.extendedCleaned
            .slice(1)
            .map((line, index) => {
                // Check the isHeadline value for the current index in extendedRaw
                if (!this.memory.passage.extendedRaw[index + 1].isHeadline) {
                    return `[${index + 1 - headlineCount}] ${line}`;
                } else {
                    headlineCount++;
                    return line;
                }
            })
            .join("\n\n");


        // Set the message body by combining the header and the content
        this.memory.passage.syndication.discord = "```"+ discordHeader + "\n\n" + discordContent +"";
        this.memory.passage.syndication.twitter = ""+ twitterHeader + "---" + twitterContent +"";
    }


    isHeadline(line) {
        return line && line.split('|')[4] === '1';
    }


    async truncateContent() {

        if (!this.memory.passage) {
            return;
        }

        let length = 1800;

        this.memory.passage.syndication.discord = this.memory.passage.syndication.discord.substring(0, length) + "...\n```";
    }

    async appendURLToContent() {

        if (!this.memory.passage) {
            return;
        }

        const { book, bookNo, chapter, search } = this.memory.passage;

        this.memory.passage.url = `https://www.jakob-lorber.cc/index.php?l=en&s=${encodeURI(`${search}`)}`;

        this.memory.passage.syndication.discord  =  this.memory.passage.syndication.discord  + "\r\n" +  this.memory.passage.url ;
    }

}

module.exports = contentParser;