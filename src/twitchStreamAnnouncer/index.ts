"use strict";

import * as Config from "../../config.js";
import { Logger } from "../logging";
import { StreamsData, StreamsResponseData } from "./twitchInterfaces";

import { TwitchOnlineTracker } from "TwitchOnlineTracker";
import axios from "axios";

import { Client, User, Message } from "discord.js";
const discord = new Client();
discord.login(Config.discord.token).catch(console.error);

const tracker = new TwitchOnlineTracker({
  client_id: Config.twitch.clientid,
  debug: true,
  pollInterval: 5
});
tracker.on("error", e => Logger.error(e.message));

const mappedUsers = new Map();

discord.on("ready", () => {
  Logger.log(`Logged in as ${discord.user.tag}`);

  // @DEBUG
  // tracker.track(["gamesdonequick"]);

  tracker.start();
});
discord.on("error", Logger.error);

discord.on("message", message => {
  if (message.author.bot) return;

  if (message.content.startsWith("!")) {
    const args = message.content.slice(1).split(" ");

    const twitch = args[1] ? args[1].toLowerCase() : null;
    if (args[0] === "track" && twitch !== null) {
      track(message, twitch);
    }

    if (args[0] === "untrack") {
      untrack(message, twitch);
    }
  }
});

function track(message: Message, twitch: string) {
  if (
    mappedUsers.has(twitch) &&
    mappedUsers.get(twitch).id === message.author.id
  ) {
    mappedUsers.delete(twitch);
    tracker.untrack([twitch]);
  }
  mappedUsers.set(twitch, message.author);
  tracker.track([twitch]);
  Logger.log(`[tracker] Tracking user ${message.author.tag} at ${twitch}`);
}

function untrack(message: Message, twitch: string) {
  if (
    mappedUsers.has(twitch) &&
    mappedUsers.get(twitch).id === message.author.id
  ) {
    mappedUsers.delete(twitch);
    tracker.untrack([twitch]);
  }
  Logger.log(`[tracker] Stop tracking user ${message.author.tag}`);
}

tracker.on("live", (stream: StreamsData) => {
  const user = mappedUsers.get(stream.user_name.toLowerCase());

  let shout = `${stream.user_name} just went live! ${
    stream.title
  } at https://twitch.tv/${stream.user_name}.`;
  if (user) {
    shout = formatAnnouncementText(user, stream);
  }

  announceLiveToChannel(shout);
});

function formatAnnouncementText(user: User, stream: StreamsData): string {
  return `${user} just went live! ${stream.title} at https://twitch.tv/${
    stream.user_name
  }.`;
}

/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string} announcementText Announcement text to use, preformatted.
 */
function announceLiveToChannel(announcementText: string): void {
  Logger.log(announcementText);
  axios.post(Config.streamUpdates.webhook, {
    content: announcementText
  });
}
