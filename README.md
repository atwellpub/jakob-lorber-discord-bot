# Description

Will post a passage randomly from Jakob Lorber Books and links to related jakob-lorber.cc resource.

# Add Bot to Discord Network

1. Create bot inside your Discord Applications area (https://discord.com/developers/applications/)
2. Replace client ID invite link to invite bot into server (https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID_HERE&scope=bot)

# Server Installation

1. Upload files to base directory and also run the following commands
2. run `npm install`
3. run `npm install forever -g`

# Running Bot

## setup configuration

Edit config.json and replace token with generated bot access token

See: https://discord.com/developers/applications/ to generate token.

## start bot server

Inside your project directory run `forever start server.js`

## stop bot server
Inside your project directory run `forever stop server.js`

# Commands

`!start`  | starts server inside this channel.
`!start INT` | starts server inside this channel with interval param set.
`!stop` | stops server everywhere
`!restart` | stops and then restarts server in current channel
`!set interval INT` | overwrites default posting interval in secods

# DataBase Titles

```
The Household of God
The Fly
The Moon
Saturn
The Natural Sun|Announcements about our sun and its natural conditions
The Spiritual Sun
The Childhood of Jesus|Biographical Gospel of the Lord
Explanation of Scriptures
Paul's Letter to Laodicea
Correspondence with Jesus|Correspondence between Abgarus and Jesus
The Earth
Beyond the Threshold
Bishop Martin
From Hell to Heaven
The Healing Power of Sunlight
Three Days in the Temple
The Great Gospel of John
```



Update `token` with bot access token.

# More details

This bot can only serve one Discord Network at a time.