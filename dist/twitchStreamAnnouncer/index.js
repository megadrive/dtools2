'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Config = require("../../config.js");
var logging_1 = require("../logging");
var Discord = require('discord.js');
var discord = new Discord.Client();
discord.login(Config.discord.token).catch(console.error);
var TwitchOnlineTracker_1 = require("TwitchOnlineTracker");
var axios_1 = require("axios");
var tracker = new TwitchOnlineTracker_1.TwitchOnlineTracker({
    client_id: Config.twitch.clientid,
    debug: true,
    pollInterval: 5
});
tracker.on('error', function (e) { return console.error(e.message); });
var mappedUsers = new Map();
discord.on('ready', function () {
    logging_1.Log.log("Logged in as " + discord.user.tag);
    // @DEBUG
    tracker.track(['gamesdonequick']);
    tracker.start();
});
discord.on('error', console.error);
discord.on('message', function (message) {
    if (message.author.bot)
        return;
    if (message.content.startsWith('!')) {
        var args = message.content
            .slice(1)
            .split(' ');
        var twitch = args[1].toLowerCase();
        if (args[0] === 'track') {
            if (mappedUsers.has(twitch) && mappedUsers.get(twitch).id === message.author.id) {
                mappedUsers.delete(twitch);
                tracker.untrack([twitch]);
            }
            mappedUsers.set(twitch, message.author);
            tracker.track([twitch]);
        }
        if (args[0] === 'untrack') {
            if (mappedUsers.has(twitch) && mappedUsers.get(twitch).id === message.author.id) {
                mappedUsers.delete(twitch);
                tracker.untrack([twitch]);
            }
        }
    }
});
tracker.on('live', function (stream) {
    announceLiveToChannel(stream.user_name + " just went live! " + stream.title + " at https://twitch.tv/" + stream.user_name + ".");
});
/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string?} announcementText Optional overriding announcement text to use, preformatted.
 */
function announceLiveToChannel(announcementText) {
    console.log(announcementText);
    axios_1.default.post(Config.streamUpdates.webhook, {
        content: announcementText
    });
    // discord.channels
    //   .get(Config.discord.channel.id)
    //   .send(shout)
    //   .catch(Log.error)
}
