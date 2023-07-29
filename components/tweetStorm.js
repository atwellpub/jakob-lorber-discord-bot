class tweetStorm {
    constructor(client, passage, maxTweetLength = 270) {
        this.client = client;
        this.maxTweetLength = maxTweetLength;
        this.passage = passage;
        this.content = passage.syndication.twitter;
        this.tweets = [];
        this.bookTitle = passage.bookTitle;
        this.hashTag = this.bookTitle.replace(/\W+/g, '');
        this.previousTweetId;
    }

    async run() {
        //return;
        this.tweets = this.splitContent();
        console.log(`${this.tweets.length} tweets scheduled to be posted`);
        console.log(this.tweets);
        //return;

        const tweetLimit = Math.min(this.tweets.length, 24);

        for (let i = 0; i < tweetLimit; i++) {

            let tweetText = this.tweets[i];

            if (tweetText.length > 280) {
                tweetText = tweetText.slice(0, 280); // Truncate tweet to 280 characters
            }

            if (i === tweetLimit - 1) {
                if (tweetText.endsWith("...")) {
                    tweetText = tweetText.slice(0, -3);
                }
            }

            if (i===0) {

                try {
                    const response = await this.client.v2.tweet(tweetText);
                    console.log('Tweet added');
                    this.previousTweetId = response.data.id;
                    console.log(this.previousTweetId);
                    console.log(response);
                } catch (error) {
                    console.error(`Error posting tweet ${i + 1}:`, error);
                    throw new Error('Tweeting process aborted due to an error');
                }

            } else {

                await new Promise(resolve => setTimeout(resolve, Math.random() * (10 * 1000 - 3 * 1000) + 3 * 1000));

                try {
                    const response = await this.client.v2.reply(tweetText ,this.previousTweetId )
                    this.previousTweetId = response.data.id;
                    console.log('Reply added.')
                } catch (error) {
                    console.error(`Error posting tweet ${i + 1}:`, error);
                    return;
                }
            }
        }

        // Add the final tweet with a note about the content generation
        let bookNumber = '';
        if (this.passage.bookNo > 0) {
            bookNumber += ` Book ${this.passage.bookNo},`;
        }

        let chapter = '';
        if (this.passage.chapter > 0) {
            chapter += ` Chapter ${this.passage.chapter}`;
        }

        let finalTweet = 'This thread was sourced from "'+ this.passage.bookTitle +'"' + bookNumber + chapter + '.' + "\n\n" +  'To continue reading, please visit the following URL: '+ "\n" + this.passage.url;

        if (finalTweet.length > 280) {
            finalTweet = finalTweet.slice(0, 280); // Truncate final tweet to 280 characters
        }

        await new Promise(resolve => setTimeout(resolve, Math.random() * (10 * 1000 - 3 * 1000) + 3 * 1000));

        try {
            const response = await this.client.v2.reply(finalTweet ,this.previousTweetId )
            console.log('Final reply added');
            this.previousTweetId = response.data.id; // Assuming that the 'id_str' is a property in the response object
        } catch (error) {
            console.error('Twitter API Error:', error);
            return;
        }

    }


    splitContent() {
        const sections = this.content.split('---'); // Split content by '---'

        if (typeof sections[1] =='undefined') {
            console.log('Sections[1] is undefined')
            console.log(sections)
            console.log(this.content)
            return [];
        }
        let currentTweet = '';

        /* prepare the first tweet */
        let firstTweet =  `${sections[0]} \n\n${this.passage.url} #jakoblorber #${this.hashTag}`
        this.tweets.push(firstTweet.trim());

        const words = sections[1].split(/\s+/);
        for (let word of words) {
            if (currentTweet.length + word.length + 1 <= this.maxTweetLength) {
                currentTweet += word + ' ';
            } else {
                const { tweet, clippedContent: newClippedContent } = this.formatTweet(currentTweet.trim());
                currentTweet = newClippedContent + ' ' + word + ' ';

                this.tweets.push(tweet.trim());
            }
        }

        // Add the last tweet with any remaining content
        if (currentTweet.trim() !== '') {
            const { tweet } = this.formatTweet(currentTweet.trim());
            this.tweets.push(tweet.trim());
        }

        return this.tweets;
    }

    formatTweet(tweet) {

        let clippedContent = '';

        if (!tweet.trim()) {
            console.error('empty tweet sent')
            return { tweet, clippedContent}
        }

        // Check if the tweet contains [n] (where n is a number) not at the beginning
        const match = tweet.match(/(?<!^)\[\d+\]/);

        if (match) {
            const startIndex = match.index;
            clippedContent = tweet.slice(startIndex).trim();
            tweet = tweet.slice(0, startIndex).trim();
        }

        // Check if the last three words contain a punctuation
        const lastThreeWords = tweet.split(/\s+/).slice(-3).join(' ');
        const hasPunctuation = /[\.,!?:;'"()\[\]{}]/.test(lastThreeWords);
/*
        if (hasPunctuation) {
            const match = lastThreeWords.match(/[\.,!?:;'"()\[\]{}]/);
            const punctuationIndex = tweet.lastIndexOf(match.input);
            clippedContent = tweet.slice(punctuationIndex + match.index + 1).trim() + (clippedContent ? ' ' : '') + clippedContent;
            tweet = tweet.slice(0, punctuationIndex + match.index + 1).trim();
        }*/

        // Enclose tweet in quotations
        tweet = `"${tweet}"`;

        // Add '...' at the end of the tweet
        tweet += '...';

        return { tweet, clippedContent };
    }




}

module.exports = tweetStorm;
