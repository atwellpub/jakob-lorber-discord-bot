const config = require('./../config.json');
const Discord = require('discord.js');
const discordClient = new Discord.Client();

// Event: When the Discord client is ready
discordClient.once('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}`);
});

// Event: When the Discord client encounters an error
discordClient.on('error', (error) => {
    console.error('Discord client error:', error);
});

// Event: When the Discord client is disconnected
discordClient.on('disconnect', (event) => {
    console.log('Disconnected from Discord:', event);
});

// Event: When the Discord client tries to reconnect
discordClient.on('reconnecting', () => {
    console.log('Reconnecting to Discord...');
});

// Event: When the Discord client resumes from being disconnected
discordClient.on('resume', (replayed) => {
    console.log(`Resumed Discord client. Replayed ${replayed} events.`);
});

// Event: When the Discord client is destroyed
discordClient.on('destroy', () => {
    console.log('Discord client destroyed.');
});

// Login the client using your bot token
discordClient.login(config.discordAPI.token)
    .then(() => {
        console.log('Discord client logged in successfully!');
    })
    .catch((error) => {
        console.error('Error logging in to Discord client:', error);
    });

module.exports = discordClient;
