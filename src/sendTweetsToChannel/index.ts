/**
 * On a Tweet from defined users, POST to a Discord webhook.
 */

import * as path from "path";
import * as Config from "../../config.js";
import { Logger } from "../logging";

import * as Twit from "twit";
import axios from "axios";

const T = new Twit({
  consumer_key: Config.twitter.consumer.key,
  consumer_secret: Config.twitter.consumer.secret,
  access_token: Config.twitter.access.token,
  access_token_secret: Config.twitter.access.secret
});

T.get(
  "users/lookup",
  { screen_name: Config.twitter.handles.join(",") },
  (err, data) => {
    if (err) throw new Error(err);

    Logger.log(`gettings ids for ${Config.twitter.handles.join(", ")}`);
    const ids = data.map(curr => {
      return curr.id;
    });

    Logger.log(`got ids: ${ids}`);
    const stream = T.stream("statuses/filter", { follow: ids.join(",") });

    stream.on("tweet", tweet => {
      if (
        !Config.twitter.handles.includes(tweet.user.screen_name.toLowerCase())
      )
        return;

      const tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${
        tweet.id_str
      }`;

      Logger.log(`got tweet -- @${tweet.user.screen_name}: ${tweet.text}`);

      if (tweet.retweeted_status) {
      } else {
        postToWebhook(tweetUrl, tweet)
          .then(console.dir)
          .catch(console.dir);
      }
    });
  }
);

function postToWebhook(tweetUrl, tweet) {
  return new Promise((resolve, reject) => {
    axios
      .post(Config.sendTweetsToChannel.webhook, {
        embeds: [
          {
            color: 4886754,
            author: {
              name: `${tweet.user.name} (@${tweet.user.screen_name})`,
              url: tweetUrl,
              icon_url: tweet.user.profile_image_url
            },
            description: tweet.text
          }
        ]
      })
      .then(() => {
        resolve("new tweet, sent message. " + tweet.text);
      })
      .catch(reject);
  });
}
