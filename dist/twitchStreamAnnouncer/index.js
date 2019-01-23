"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var Config = require("../../config.js");
var logging_1 = require("../logging");
var twitchonlinetracker_1 = require("twitchonlinetracker");
var axios_1 = require("axios");
var Datastore = require("nedb-promise");
var databaseFilename = Config.streamUpdates.databaseFilename || "streamUpdates.db.json";
logging_1.Logger.log("Loading db @ " + databaseFilename);
var db = new Datastore({
    filename: databaseFilename,
    autoload: true
});
var gameInfoCacheDb = new Datastore({
    filename: "gameInfoCache.db.json",
    autoload: true
});
var discord_js_1 = require("discord.js");
var discord = new discord_js_1.Client();
discord.login(Config.discord.token).catch(logging_1.Logger.error);
var tracker = new twitchonlinetracker_1.TwitchOnlineTracker({
    client_id: Config.twitch.clientid,
    debug: process.env.DEBUG || false,
    pollInterval: Config.streamUpdates.pollInterval || 30 // Default: 30
});
tracker.on("error", function (e) { return logging_1.Logger.error(e.message); });
discord.on("ready", function () {
    logging_1.Logger.log("Logged in as " + discord.user.tag);
    tracker.start();
    try {
        trackFromDatabase(tracker);
    }
    catch (err) {
        throw new Error(err);
    }
});
discord.on("error", logging_1.Logger.error);
discord.on("message", function (message) { return __awaiter(_this, void 0, void 0, function () {
    var args, twitch, e_1;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (message.author.bot)
                    return [2 /*return*/];
                if (message.guild === null)
                    return [2 /*return*/];
                if (!message.content.startsWith("!")) return [3 /*break*/, 7];
                args = message.content.slice(1).split(" ");
                twitch = args[1] ? args[1].toLowerCase() : null;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                if (!(args[0] === "track" && twitch !== null)) return [3 /*break*/, 3];
                return [4 /*yield*/, track(message, twitch)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                if (!(args[0] === "untrack")) return [3 /*break*/, 5];
                return [4 /*yield*/, untrack(message)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                if (args[0] === "debug") {
                    ["megadriving", "twitchpresents", "bajostream"].forEach(function (t) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, track(message, t)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
                return [3 /*break*/, 7];
            case 6:
                e_1 = _a.sent();
                logging_1.Logger.error("MessageError", e_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
function trackFromDatabase(tracker) {
    return __awaiter(this, void 0, void 0, function () {
        var allUsers, allTwitch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.find({})];
                case 1:
                    allUsers = _a.sent();
                    allTwitch = allUsers.map(function (user) { return user.twitch; });
                    tracker.track(allTwitch);
                    logging_1.Logger.log("[tracker] Started tracking " + allTwitch.length + " twitch users.");
                    return [2 /*return*/];
            }
        });
    });
}
function track(message, twitch) {
    return __awaiter(this, void 0, void 0, function () {
        var simplifiedUser, findQuery, dbUser, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    simplifiedUser = new discord_js_1.User(discord, {
                        id: message.author.id,
                        tag: message.author.tag
                    });
                    findQuery = {
                        guildid: message.guild.id,
                        "user.id": simplifiedUser.id
                    };
                    return [4 /*yield*/, db.findOne(findQuery)];
                case 1:
                    dbUser = _a.sent();
                    if (dbUser) {
                        dbUser.twitch = twitch;
                        db.update(findQuery, dbUser);
                    }
                    else {
                        db.insert(Object.assign(findQuery, { twitch: twitch }));
                    }
                    tracker.track([twitch]);
                    message.reply("now tracking your Twitch stream at " + twitch + ".");
                    logging_1.Logger.log("[tracker] Tracking user " + message.author.tag + " at " + twitch);
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    logging_1.Logger.error(e_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function untrack(message) {
    return __awaiter(this, void 0, void 0, function () {
        var findQuery, user, twitch, twitchCount, simplifiedUser, numRemoved, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    findQuery = {
                        guildid: message.guild.id,
                        "user.id": message.author.id
                    };
                    return [4 /*yield*/, db.findOne(findQuery)];
                case 1:
                    user = _a.sent();
                    twitch = user.twitch;
                    return [4 /*yield*/, db.find({
                            twitch: twitch
                        })];
                case 2:
                    twitchCount = _a.sent();
                    simplifiedUser = new discord_js_1.User(discord, {
                        id: message.author.id,
                        tag: message.author.tag
                    });
                    return [4 /*yield*/, db.remove(findQuery)];
                case 3:
                    numRemoved = _a.sent();
                    if (twitchCount.length === 1) {
                        // only remove tracking if its the last stream we are tracking
                        tracker.untrack([twitch]);
                        logging_1.Logger.log("[tracker] Untracked " + twitch + " since it was the last user using this Twitch.");
                    }
                    else {
                        logging_1.Logger.log("[tracker] Not untracking " + twitch + " since there are more users using this Twitch.");
                    }
                    logging_1.Logger.log("[tracker] Stop tracking user " + message.author.tag + " (" + numRemoved + " records removed)");
                    message.reply("stopped tracking your Twitch stream status.");
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    logging_1.Logger.error(e_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
tracker.on("live", function (stream) { return __awaiter(_this, void 0, void 0, function () {
    var trackedUsers, gameInfo_1, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, db.find({
                        twitch: stream.user_name.toLowerCase()
                    })];
            case 1:
                trackedUsers = _a.sent();
                return [4 /*yield*/, getGameInfo(stream.game_id)];
            case 2:
                gameInfo_1 = _a.sent();
                trackedUsers.forEach(function (trackedUser) {
                    var shout = {
                        content: stream.user_name + " just went live! " + stream.title + " at https://twitch.tv/" + stream.user_name + "."
                    };
                    if (trackedUser.user) {
                        shout = formatAnnouncement(trackedUser.user, stream, gameInfo_1);
                    }
                    announceLiveToChannel(shout);
                });
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                logging_1.Logger.error("LiveError", e_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
function getGameInfo(gameId) {
    return __awaiter(this, void 0, void 0, function () {
        var gameInfo, twitchData, e_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logging_1.Logger.log("getting game info for id: " + gameId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, gameInfoCacheDb.findOne({ game_id: gameId })];
                case 2:
                    gameInfo = _a.sent();
                    if (!(gameInfo === null)) return [3 /*break*/, 6];
                    logging_1.Logger.log("no cached game info, polling twitch for id: " + gameId);
                    return [4 /*yield*/, tracker.api("games?id=" + gameId)];
                case 3:
                    twitchData = _a.sent();
                    if (!twitchData.data) return [3 /*break*/, 5];
                    logging_1.Logger.log("cached data: " + twitchData.data[0].name);
                    return [4 /*yield*/, gameInfoCacheDb.insert(twitchData.data[0])];
                case 4:
                    _a.sent();
                    gameInfo = twitchData.data[0];
                    return [3 /*break*/, 6];
                case 5:
                    gameInfo = null;
                    logging_1.Logger.warn("twitch said no game with that id exists?");
                    _a.label = 6;
                case 6: return [2 /*return*/, gameInfo];
                case 7:
                    e_5 = _a.sent();
                    logging_1.Logger.error("GameInfoError", e_5);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function formatAnnouncement(user, stream, gameInfo) {
    var richEmbed = new discord_js_1.RichEmbed()
        .setTitle("https://twitch.tv/" + stream.user_name)
        .setURL("https://twitch.tv/stream.user_name")
        .setColor(9442302)
        .setTimestamp(new Date(stream.started_at))
        .addField("Title", stream.title, true);
    if (gameInfo) {
        richEmbed.addField("Now Playing", gameInfo.name);
        richEmbed.setThumbnail(gameInfo.box_art_url.replace("{width}", "285").replace("{height}", "380"));
    }
    var announceOptions = {
        content: "Stream Update",
        embed: richEmbed
    };
    return announceOptions;
}
/**
 * Announce that the Twitch channel is live to Discord.
 * @param {string} announcementText Announcement text to use, preformatted.
 */
function announceLiveToChannel(options) {
    if (options.content)
        logging_1.Logger.log(options.content);
    if (options.embed)
        logging_1.Logger.log("Sending embed: " + options.embed.fields[0]);
    axios_1.default
        .post(Config.streamUpdates.webhook, {
        content: options.content,
        embeds: [options.embed]
    })
        .catch(function (e) {
        console.log(e.response);
    });
}
