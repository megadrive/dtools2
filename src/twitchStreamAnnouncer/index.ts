"use strict";

import * as Config from "../../config.js";
import { Logger } from "../logging";
import {
  StreamsData,
  StreamsResponseData,
  AnnounceOptions,
  GameInfo
} from "./twitchInterfaces";

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

const gameInfoCacheDb = new Datastore({
  filename: "gameInfoCache.db.json",
  autoload: true
});

import { Client, User, Message, RichEmbed } from "discord.js";
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

      if (args[0] === "debug") {
        ["megadriving", "twitchpresents", "bajostream"].forEach(async t => {
          await track(message, t);
        });
      }
    } catch (e) {
      Logger.error("MessageError", e);
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
    const findQuery = {
      guildid: message.guild.id,
      "user.id": simplifiedUser.id
    };
    const dbUser = await db.findOne(findQuery);
    if (dbUser) {
      dbUser.twitch = twitch;
      db.update(findQuery, dbUser);
    } else {
      db.insert(Object.assign(findQuery, { twitch: twitch }));
    }

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

    const gameInfo = await getGameInfo(stream.game_id);

    trackedUsers.forEach(trackedUser => {
      let shout: AnnounceOptions = {
        content: `${stream.user_name} just went live! ${
          stream.title
        } at https://twitch.tv/${stream.user_name}.`
      };
      if (trackedUser.user) {
        shout = formatAnnouncement(trackedUser.user, stream, gameInfo);
      }

      announceLiveToChannel(shout);
    });
  } catch (e) {
    Logger.error("LiveError", e);
  }
});

async function getGameInfo(gameId) {
  Logger.log(`getting game info for id: ${gameId}`);
  try {
    let gameInfo = await gameInfoCacheDb.findOne({ game_id: gameId });

    // not cached? get from api and cache
    if (gameInfo === null) {
      Logger.log(`no cached game info, polling twitch for id: ${gameId}`);
      const twitchData = await tracker.api(`games?id=${gameId}`);

      if (twitchData.data) {
        Logger.log(`cached data: ${twitchData.data[0].name}`);
        await gameInfoCacheDb.insert(twitchData.data[0]);
        gameInfo = twitchData.data[0];
      } else {
        gameInfo = null;
        Logger.warn(`twitch said no game with that id exists?`);
      }
    }

    return gameInfo;
  } catch (e) {
    Logger.error("GameInfoError", e);
  }
}

function formatAnnouncement(
  user: User,
  stream: StreamsData,
  gameInfo: GameInfo
): AnnounceOptions {
  const richEmbed = new RichEmbed()
    .setTitle(`https://twitch.tv/${stream.user_name}`)
    .setURL("https://twitch.tv/stream.user_name")
    .setColor(9442302)
    .setTimestamp(new Date(stream.started_at))
    .addField("Title", stream.title, true);

  if (gameInfo) {
    richEmbed.addField("Now Playing", gameInfo.name);
    richEmbed.setThumbnail(
      gameInfo.box_art_url.replace("{width}", "285").replace("{height}", "380")
    );
  }

  const announceOptions: AnnounceOptions = {
    content: "Stream Update",
    embed: richEmbed
  };

  return announceOptions;
}

/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string} announcementText Announcement text to use, preformatted.
 */
function announceLiveToChannel(options: AnnounceOptions): void {
  if (options.content) Logger.log(options.content);
  if (options.embed) Logger.log(`Sending embed: ${options.embed.fields[0]}`);
  axios
    .post(Config.streamUpdates.webhook, {
      content: options.content,
      embeds: [options.embed]
    })
    .catch(e => {
      console.log(e.response);
    });
}
