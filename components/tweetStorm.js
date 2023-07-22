class tweetStorm {
    constructor(client, passage, maxTweetLength = 280) {
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
        this.tweets = this.splitContent();
        console.log(`${this.tweets.length} tweets scheduled to be posted`);
        console.log(this.tweets);

        const tweetLimit = Math.min(this.tweets.length, 30);

        for (let i = 0; i < tweetLimit; i++) {
            try {
                let tweetText = this.tweets[i];

                if (tweetText.length > 280) {
                    tweetText = tweetText.slice(0, 280); // Truncate tweet to 280 characters
                }

                if (i===0) {

                    try {
                        const response = await this.client.v2.tweet(tweetText);
                        console.log('Tweet added');
                        this.previousTweetId = response.data.id;
                        console.log(this.previousTweetId);
                        console.log(response);
                    } catch (error) {
                        console.error('Twitter API Error:', error);
                        throw new Error('Tweeting process aborted due to an error');
                    }

                } else {

                    await new Promise(resolve => setTimeout(resolve, Math.random() * (10 * 1000 - 3 * 1000) + 3 * 1000));

                    const tweetOptions = {
                        status: tweetText,
                        in_reply_to_tweet_id: this.previousTweetId, // Set the reply status ID
                    };

                    try {
                        const response = await this.client.v2.reply(tweetOptions)
                        console.log('Reply added');
                        this.previousTweetId = response.data.id; // Assuming that the 'id_str' is a property in the response object
                    } catch (error) {
                        console.error('Twitter API Error:', error);
                        throw new Error('Tweeting process aborted due to an error');
                    }
                }


            } catch (err) {
                console.error(`Error posting tweet ${i + 1}:`, err);
            }
        }

        // Add the final tweet with a note about the content generation
        try {
            let finalTweet = '#jakoblorber #' + this.hashTag + "\n\n" + this.passage.url;

            if (finalTweet.length > 280) {
                finalTweet = finalTweet.slice(0, 280); // Truncate final tweet to 280 characters
            }

            const finalTweetOptions = {
                status: finalTweet,
                in_reply_to_tweet_id: this.previousTweetId, // Reply to the last tweet in the thread
            };

            await new Promise(resolve => setTimeout(resolve, Math.random() * (10 * 1000 - 3 * 1000) + 3 * 1000));

            try {
                const response = await this.client.v2.reply(tweetOptions)
                console.log('Reply added');
                this.previousTweetId = response.data.id; // Assuming that the 'id_str' is a property in the response object
            } catch (error) {
                console.error('Twitter API Error:', error);
                throw new Error('Tweeting process aborted due to an error');
            }
        } catch (err) {
            console.error('Error posting the final tweet:', err);
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
        this.tweets.push(firstTweet);

        const words = sections[1].split(/\s+/);
        for (let word of words) {
            if (currentTweet.length + word.length + 1 <= this.maxTweetLength) {
                currentTweet += word + ' ';
            } else {
                const { tweet, clippedContent: newClippedContent } = this.formatTweet(currentTweet.trim(), this.tweets.length + 1);
                currentTweet = newClippedContent + ' ' + word + ' ';

                this.tweets.push(tweet);
            }
        }


        // Add the last tweet with any remaining content
        if (currentTweet.trim() !== '') {
            const { tweet } = this.formatTweet(currentTweet.trim(), this.tweets.length + 1);
            this.tweets.push(tweet);
        }

        return this.tweets;
    }

    formatTweet(tweet, tweetNumber) {
        let clippedContent = '';

        // If the last 5 words contain a punctuation, end the tweet there
        const lastFiveWords = tweet.split(/\s+/).slice(-5).join(' ');
        const hasPunctuation = /[\.,!?:;'"()\[\]{}]/.test(lastFiveWords);


        if (hasPunctuation) {
            const punctuationIndex = tweet.lastIndexOf(lastFiveWords.trim());
            clippedContent = tweet.slice(punctuationIndex + lastFiveWords.length);
            tweet = tweet.slice(0, punctuationIndex + lastFiveWords.length);
        }

        // Enclose tweet in quotations
        tweet = `"${tweet}"`;

        // Add '...' at the end of the tweet
        tweet += '...';

        // Prepend the tweet number (except the first tweet)
        if (tweetNumber > 1) {
            tweet = `[${tweetNumber}] ${tweet}`;
        }

        return { tweet, clippedContent };
    }
}

module.exports = tweetStorm;
