"use strict";

import * as Config from "../../config.js";
import { Log } from "../logging";

const Discord = require("discord.js");
const discord = new Discord.Client();
discord.login(Config.discord.token).catch(console.error);

import { TwitchOnlineTracker } from "TwitchOnlineTracker";
import axios from "axios";
const tracker = new TwitchOnlineTracker({
  client_id: Config.twitch.clientid,
  debug: true,
  pollInterval: 5
});
tracker.on("error", e => console.error(e.message));

const mappedUsers = new Map();

discord.on("ready", () => {
  Log.log(`Logged in as ${discord.user.tag}`);

  // @DEBUG
  tracker.track(["gamesdonequick"]);

  tracker.start();
});

discord.on("error", console.error);

discord.on("message", message => {
  if (message.author.bot) return;

  if (message.content.startsWith("!")) {
    const args = message.content.slice(1).split(" ");

    const twitch = args[1].toLowerCase();
    if (args[0] === "track") {
      if (
        mappedUsers.has(twitch) &&
        mappedUsers.get(twitch).id === message.author.id
      ) {
        mappedUsers.delete(twitch);
        tracker.untrack([twitch]);
      }
      mappedUsers.set(twitch, message.author);
      tracker.track([twitch]);
    }

    if (args[0] === "untrack") {
      if (
        mappedUsers.has(twitch) &&
        mappedUsers.get(twitch).id === message.author.id
      ) {
        mappedUsers.delete(twitch);
        tracker.untrack([twitch]);
      }
    }
  }
});

tracker.on("live", stream => {
  announceLiveToChannel(
    `${stream.user_name} just went live! ${stream.title} at https://twitch.tv/${
      stream.user_name
    }.`
  );
});

/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string?} announcementText Optional overriding announcement text to use, preformatted.
 */
function announceLiveToChannel(announcementText) {
  console.log(announcementText);
  axios.post(Config.streamUpdates.webhook, {
    content: announcementText
  });
  // discord.channels
  //   .get(Config.discord.channel.id)
  //   .send(shout)
  //   .catch(Log.error)
}
