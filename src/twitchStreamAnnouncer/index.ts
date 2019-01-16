"use strict";

import * as Config from "../../config.js";
import { Logger } from "../logging";
import { StreamsData, StreamsResponseData } from "./twitchInterfaces";

import { TwitchOnlineTracker } from "twitchonlinetracker";
import axios from "axios";
import * as Datastore from "nedb-promise";

const databaseFilename =
  Config.streamUpdates.databaseFilename || "streamUpdates.db.json";
Logger.log(`Loading db @ ${databaseFilename}`);
const db = new Datastore({
  filename: databaseFilename,
  autoload: true
});

import { Client, User, Message } from "discord.js";
const discord = new Client();
discord.login(Config.discord.token).catch(Logger.error);

const tracker = new TwitchOnlineTracker({
  client_id: Config.twitch.clientid,
  debug: process.env.DEBUG || false,
  pollInterval: Config.streamUpdates.pollInterval || 30 // Default: 30
});
tracker.on("error", e => Logger.error(e.message));

discord.on("ready", () => {
  Logger.log(`Logged in as ${discord.user.tag}`);

  tracker.start();

  try {
    trackFromDatabase(tracker);
  } catch (err) {
    throw new Error(err);
  }
});
discord.on("error", Logger.error);

discord.on("message", async message => {
  if (message.author.bot) return;
  if (message.guild === null) return;

  if (message.content.startsWith("!")) {
    const args = message.content.slice(1).split(" ");
    const twitch = args[1] ? args[1].toLowerCase() : null;

    try {
      if (args[0] === "track" && twitch !== null) {
        await track(message, twitch);
      }

      if (args[0] === "untrack") {
        await untrack(message);
      }
    } catch (e) {
      Logger.error(e);
    }
  }
});

async function trackFromDatabase(tracker) {
  const allUsers = await db.find({});
  const allTwitch = allUsers.map(user => user.twitch);
  tracker.track(allTwitch);

  Logger.log(`[tracker] Started tracking ${allTwitch.length} twitch users.`);
}

async function track(message: Message, twitch: string) {
  try {
    const simplifiedUser = new User(discord, {
      id: message.author.id,
      tag: message.author.tag
    });

    // Update if exists, or insert otherwise
    await db.update(
      {
        guildid: message.guild.id,
        "user.id": simplifiedUser.id
      },
      {
        guildid: message.guild.id,
        user: simplifiedUser,
        twitch: twitch
      },
      {
        upsert: true
      }
    );

    tracker.track([twitch]);
    message.reply(`now tracking your Twitch stream at ${twitch}.`);
    Logger.log(`[tracker] Tracking user ${message.author.tag} at ${twitch}`);
  } catch (e) {
    Logger.error(e);
  }
}

async function untrack(message: Message) {
  try {
    const findQuery = {
      guildid: message.guild.id,
      "user.id": message.author.id
    };
    const user = await db.findOne(findQuery);
    const twitch = user.twitch;
    const twitchCount = await db.find({
      twitch: twitch
    });
    const simplifiedUser = new User(discord, {
      id: message.author.id,
      tag: message.author.tag
    });
    const numRemoved = await db.remove(findQuery);

    if (twitchCount.length === 1) {
      // only remove tracking if its the last stream we are tracking
      tracker.untrack([twitch]);
      Logger.log(
        `[tracker] Untracked ${twitch} since it was the last user using this Twitch.`
      );
    } else {
      Logger.log(
        `[tracker] Not untracking ${twitch} since there are more users using this Twitch.`
      );
    }

    Logger.log(
      `[tracker] Stop tracking user ${
        message.author.tag
      } (${numRemoved} records removed)`
    );
    message.reply(`stopped tracking your Twitch stream status.`);
  } catch (e) {
    Logger.error(e);
  }
}

tracker.on("live", async (stream: StreamsData) => {
  try {
    const trackedUsers = await db.find({
      twitch: stream.user_name.toLowerCase()
    });

    trackedUsers.forEach(trackedUser => {
      let shout = `${stream.user_name} just went live! ${
        stream.title
      } at https://twitch.tv/${stream.user_name}.`;
      if (trackedUser.user) {
        shout = formatAnnouncementText(trackedUser.user, stream);
      }

      announceLiveToChannel(shout);
    });
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
