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
var TwitchOnlineTracker_1 = require("TwitchOnlineTracker");
var axios_1 = require("axios");
var Keyv = require("keyv");
var mappedUsers = new Keyv('sqlite://streamtracker.sqlite', {
    namespace: 'streamtracker'
});
mappedUsers.on('error', logging_1.Logger.error);
var discord_js_1 = require("discord.js");
var discord = new discord_js_1.Client();
discord.login(Config.discord.token).catch(console.error);
var tracker = new TwitchOnlineTracker_1.TwitchOnlineTracker({
    client_id: Config.twitch.clientid,
    debug: true,
    pollInterval: 5
});
tracker.on("error", function (e) { return logging_1.Logger.error(e.message); });
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
    return __awaiter(this, void 0, void 0, function () {
        var mappedUser, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, mappedUsers.get(twitch)];
                case 1:
                    mappedUser = _a.sent();
                    if (mappedUser &&
                        mappedUser.id === message.author.id) {
                        mappedUsers.delete(twitch);
                        tracker.untrack([twitch]);
                    }
                    mappedUsers.set(twitch, message.author);
                    tracker.track([twitch]);
                    logging_1.Logger.log("[tracker] Tracking user " + message.author.tag + " at " + twitch);
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    logging_1.Logger.error(e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function untrack(message, twitch) {
    return __awaiter(this, void 0, void 0, function () {
        var mappedUser, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, mappedUsers.get(twitch)];
                case 1:
                    mappedUser = _a.sent();
                    if (mappedUser &&
                        mappedUser.id === message.author.id) {
                        mappedUsers.delete(twitch);
                        tracker.untrack([twitch]);
                    }
                    logging_1.Logger.log("[tracker] Stop tracking user " + message.author.tag);
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
tracker.on("live", function (stream) { return __awaiter(_this, void 0, void 0, function () {
    var user, shout, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, mappedUsers.get(stream.user_name)];
            case 1:
                user = _a.sent();
                console.log(user);
                shout = stream.user_name + " just went live! " + stream.title + " at https://twitch.tv/" + stream.user_name + ".";
                if (user) {
                    shout = formatAnnouncementText(user, stream);
                }
                announceLiveToChannel(shout);
                return [3 /*break*/, 3];
            case 2:
                e_3 = _a.sent();
                logging_1.Logger.error(e_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
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
    })
        .catch(logging_1.Logger.error);
}
