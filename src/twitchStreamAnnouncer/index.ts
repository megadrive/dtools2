"use strict";

import * as Config from "../../config.js";
import { Logger } from "../logging";
import { StreamsData, StreamsResponseData } from "./twitchInterfaces";

import { TwitchOnlineTracker } from "TwitchOnlineTracker";
import axios from "axios";
import * as Keyv from "keyv";

const mappedUsers = new Keyv("sqlite://streamtracker.sqlite", {
  namespace: "streamtracker"
});
mappedUsers.on("error", Logger.error);

import { Client, User, Message } from "discord.js";
const discord = new Client();
discord.login(Config.discord.token).catch(Logger.error);

const tracker = new TwitchOnlineTracker({
  client_id: Config.twitch.clientid,
  debug: true,
  pollInterval: 5
});
tracker.on("error", e => Logger.error(e.message));

discord.on("ready", () => {
  Logger.log(`Logged in as ${discord.user.tag}`);

  // @DEBUG
  // tracker.track(["gamesdonequick"]);

  tracker.start();
});
discord.on("error", Logger.error);

discord.on("message", async message => {
  if (message.author.bot) return;

  if (message.content.startsWith("!")) {
    const args = message.content.slice(1).split(" ");
    const twitch = args[1] ? args[1].toLowerCase() : null;

    try {
      if (args[0] === "track" && twitch !== null) {
        await track(message, twitch);
      }

      if (args[0] === "untrack") {
        await untrack(message, twitch);
      }
    } catch (e) {
      Logger.error(e);
    }
  }
});

async function track(message: Message, twitch: string) {
  try {
    const mappedUser = await mappedUsers.get(twitch);
    if (mappedUser && mappedUser.id === message.author.id) {
      await mappedUsers.delete(twitch);
      tracker.untrack([twitch]);
    }

    const simplifiedUser = new User(discord, {
      id: message.author.id,
      tag: message.author.tag
    });
    await mappedUsers.set(twitch, simplifiedUser);
    tracker.track([twitch]);
    Logger.log(`[tracker] Tracking user ${message.author.tag} at ${twitch}`);
  } catch (e) {
    Logger.error(e);
  }
}

async function untrack(message: Message, twitch: string) {
  try {
    const mappedUser = await mappedUsers.get(twitch);
    if (mappedUser && mappedUser.id === message.author.id) {
      await mappedUsers.delete(twitch);
      tracker.untrack([twitch]);
    }
    Logger.log(`[tracker] Stop tracking user ${message.author.tag}`);
  } catch (e) {
    Logger.error(e);
  }
}

tracker.on("live", async (stream: StreamsData) => {
  try {
    const user = await mappedUsers.get(stream.user_name.toLowerCase());

    let shout = `${stream.user_name} just went live! ${
      stream.title
    } at https://twitch.tv/${stream.user_name}.`;
    if (user) {
      shout = formatAnnouncementText(user, stream);
    }

    announceLiveToChannel(shout);
  } catch (e) {
    Logger.error(e);
  }
});

function formatAnnouncementText(user: User, stream: StreamsData): string {
  return `<@${user.id}> just went live! ${stream.title} at https://twitch.tv/${
    stream.user_name
  }.`;
}

/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string} announcementText Announcement text to use, preformatted.
 */
function announceLiveToChannel(announcementText: string): void {
  Logger.log(announcementText);
  axios
    .post(Config.streamUpdates.webhook, {
      content: announcementText
    })
    .catch(Logger.error);
}
