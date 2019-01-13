"use strict";
/**
 * On a Tweet from defined users, POST to a Discord webhook.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Config = require("../../config.js");
var logging_1 = require("../logging");
var Twit = require("twit");
var axios_1 = require("axios");
var T = new Twit({
    consumer_key: Config.twitter.consumer.key,
    consumer_secret: Config.twitter.consumer.secret,
    access_token: Config.twitter.access.token,
    access_token_secret: Config.twitter.access.secret
});
T.get("users/lookup", { screen_name: Config.twitter.handles.join(",") }, function (err, data) {
    if (err)
        throw new Error(err);
    logging_1.Logger.log("gettings ids for " + Config.twitter.handles.join(", "));
    var ids = data.map(function (curr) {
        return curr.id;
    });
    logging_1.Logger.log("got ids: " + ids);
    var stream = T.stream("statuses/filter", { follow: ids.join(",") });
    stream.on("tweet", function (tweet) {
        if (!Config.twitter.handles.includes(tweet.user.screen_name.toLowerCase()))
            return;
        var tweetUrl = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
        logging_1.Logger.log("got tweet -- @" + tweet.user.screen_name + ": " + tweet.text);
        if (tweet.retweeted_status) {
        }
        else {
            postToWebhook(tweetUrl, tweet)
                .then(console.dir)
                .catch(console.dir);
        }
    });
});
function postToWebhook(tweetUrl, tweet) {
    return new Promise(function (resolve, reject) {
        axios_1.default
            .post(Config.sendTweetsToChannel.webhook, {
            embeds: [
                {
                    color: 4886754,
                    author: {
                        name: tweet.user.name + " (@" + tweet.user.screen_name + ")",
                        url: tweetUrl,
                        icon_url: tweet.user.profile_image_url
                    },
                    description: tweet.text
                }
            ]
        })
            .then(function () {
            resolve("new tweet, sent message. " + tweet.text);
        })
            .catch(reject);
    });
}
