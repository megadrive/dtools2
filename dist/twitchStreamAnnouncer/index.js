"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Config = require("../../config.js");
var logging_1 = require("../logging");
var TwitchOnlineTracker_1 = require("TwitchOnlineTracker");
var axios_1 = require("axios");
var discord_js_1 = require("discord.js");
var discord = new discord_js_1.Client();
discord.login(Config.discord.token).catch(console.error);
var tracker = new TwitchOnlineTracker_1.TwitchOnlineTracker({
    client_id: Config.twitch.clientid,
    debug: true,
    pollInterval: 5
});
tracker.on("error", function (e) { return logging_1.Logger.error(e.message); });
var mappedUsers = new Map();
discord.on("ready", function () {
    logging_1.Logger.log("Logged in as " + discord.user.tag);
    // @DEBUG
    // tracker.track(["gamesdonequick"]);
    tracker.start();
});
discord.on("error", logging_1.Logger.error);
discord.on("message", function (message) {
    if (message.author.bot)
        return;
    if (message.content.startsWith("!")) {
        var args = message.content.slice(1).split(" ");
        var twitch = args[1] ? args[1].toLowerCase() : null;
        if (args[0] === "track" && twitch !== null) {
            track(message, twitch);
        }
        if (args[0] === "untrack") {
            untrack(message, twitch);
        }
    }
});
function track(message, twitch) {
    if (mappedUsers.has(twitch) &&
        mappedUsers.get(twitch).id === message.author.id) {
        mappedUsers.delete(twitch);
        tracker.untrack([twitch]);
    }
    mappedUsers.set(twitch, message.author);
    tracker.track([twitch]);
    logging_1.Logger.log("[tracker] Tracking user " + message.author.tag + " at " + twitch);
}
function untrack(message, twitch) {
    if (mappedUsers.has(twitch) &&
        mappedUsers.get(twitch).id === message.author.id) {
        mappedUsers.delete(twitch);
        tracker.untrack([twitch]);
    }
    logging_1.Logger.log("[tracker] Stop tracking user " + message.author.tag);
}
tracker.on("live", function (stream) {
    var user = mappedUsers.get(stream.user_name.toLowerCase());
    var shout = stream.user_name + " just went live! " + stream.title + " at https://twitch.tv/" + stream.user_name + ".";
    if (user) {
        shout = formatAnnouncementText(user, stream);
    }
    announceLiveToChannel(shout);
});
function formatAnnouncementText(user, stream) {
    return user + " just went live! " + stream.title + " at https://twitch.tv/" + stream.user_name + ".";
}
/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string} announcementText Announcement text to use, preformatted.
 */
function announceLiveToChannel(announcementText) {
    logging_1.Logger.log(announcementText);
    axios_1.default.post(Config.streamUpdates.webhook, {
        content: announcementText
    });
}
