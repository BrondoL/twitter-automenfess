const express = require("express");
const { twitterBot } = require("./twitter-bot");
const CronJob = require("cron").CronJob;
require("dotenv").config();

const app = express();
const port = 3000;

const twit = new twitterBot({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_KEY_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const doJob = async () => {
    const userId = await twit.getAdminUserInfo();
    const DM = await twit.getDirectMessages(userId);
    console.log(DM);
}

const job = new CronJob(
    "* */3 * * * *",
    doJob,
    null,
    false,
);

app.get("/", async (req, res) => {
    job.fireOnTick();
    res.send("Welcome to twitter bot server!");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
