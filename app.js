require("dotenv").config();

const express = require("express");
const cors = require("cors");
const CronJob = require("cron").CronJob;

const { TwitterBot } = require("./twitter-bot");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bot = new TwitterBot({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_KEY_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    triggerWord: process.env.TRIGGER,
});

const job = new CronJob("0 */5 * * * *", doJob, onComplete, false);

async function doJob() {
    console.log(`execute @ ${new Date().toTimeString()}`);
    let tempMessage = {};
    try {
        const authenticatedUserId = await bot.getAdminUserInfo();
        const message = await bot.getDirectMessage(authenticatedUserId);
        if (message.id) {
            tempMessage = message;
            const { data, msg } = await bot.tweetMessage(message);
            if(msg.length > 1){
                const replyTweet = {
                    data
                };
                for(let i = 1; i<msg.length; i++){
                    const result = await bot.replyTweetMessage(msg[i], replyTweet.data)
                    await bot.sleep(1000);
                    replyTweet.data = result.data;
                }
            }
            await bot.deleteMessage(message);
            console.log(
                `=== DM has been successfuly reposted with id: ${data.id} @ ${data.created_at} ===`
            );
            console.log("------------------------------------");
        } else {
            console.log("no tweet to post");
            console.log("------------------------------------");
        }
    } catch (error) {
        console.log(error, "ERROR.");
        console.log("------------------------------------");
        if (tempMessage.id) {
            await bot.deleteMessage(tempMessage);
        }
    }
}

async function onComplete() {
    console.log("my job is done!");
}

app.get("/", (req, res, next) => {
    res.send("Welcome to twitter bot server!");
});

app.get("/trigger", async (req, res, next) => {
    job.fireOnTick();
    res.send("job triggered!");
});

app.listen(PORT, () => console.log(`Server is listening to port ${PORT}`));
