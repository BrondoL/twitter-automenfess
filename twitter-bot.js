const { time } = require("cron");
const Twit = require("twit");

class twitterBot {
    constructor(props) {
        this.T = new Twit({
            consumer_key: props.consumer_key,
            consumer_secret: props.consumer_secret,
            access_token: props.access_token,
            access_token_secret: props.access_token_secret,
        });
        this.triggerWord = props.triggerWord;
    }

    getAdminUserInfo = () => {
        return new Promise((resolve, reject) => {
            this.T.get("account/verify_credentials", { skip_status: true })
                .catch((err) => reject(err))
                .then((result) => {
                    const userId = result.data.id_str;
                    resolve(userId);
                });
        });
    };

    getReceivedMessages = (messages, userId) => {
        return messages.filter(
            (msg) => msg.message_create.sender_id !== userId
        );
    };

    getImportantMessages = (messages, trigger) => {
        return messages.filter((msg) =>
            msg.message_create.message_data.text.includes(trigger.toLowerCase())
        );
    };

    getUnimportantMessages = (messages, trigger) => {
        return messages.filter(
            (msg) =>
                !msg.message_create.message_data.text.includes(
                    trigger.toLowerCase()
                )
        );
    };

    deleteMessage = (message) => {
        return new Promise((resolve, reject) => {
            this.T.delete(
                "direct_messages/events/destroy",
                { id: message.id },
                (error, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        const msg = `Message with id ${message.id} has been successfully deleted!`;
                        console.log(msg);
                        resolve({
                            message: msg,
                            data,
                        });
                    }
                }
            );
        });
    };

    sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

    deleteUnimportantMessages = async (messages) => {
        if (messages.length > 3) {
            for (let i = 0; i < 3; i++) {
                await this.deleteMessage(messages[i]);
                await this.sleep(2000);
            }
        }
    };

    deleteMoreThan280CharMessages = async (messages) => {
        try {
            const moreThan280 = [];
            for (let [i, msg] of messages.entries()) {
                let text = msg.message_create.message_data.text;
                const attachment = msg.message_create.message_data.attachment;
                if (attachment) {
                    const url = attachment.media.url;
                    text = text.split(url)[0];
                }

                if (text.length > 280) {
                    moreThan280.push(msg);
                    await this.deleteMessage(msg);
                    await this.sleep(2000);
                }
                if (i + 1 === 3) {
                    break;
                }
            }
            for (let msg of moreThan280) {
                const index = messages.indexOf(msg);
                messages.splice(index, 1);
            }
        } catch (error) {
            throw error;
        }
    };

    getDirectMessages = (userId) => {
        return new Promise((resolve, reject) => {
            this.T.get("direct_messages/events/list", async (error, data) => {
                try {
                    if (error) {
                        reject(error);
                    } else {
                        let lastMessage = {};
                        const messages = data.events;
                        const receivedMessages = this.getReceivedMessages(
                            messages,
                            userId
                        );
                        const importantMessages = this.getImportantMessages(
                            receivedMessages,
                            this.triggerWord
                        );
                        const unimportantMessages = this.getUnimportantMessages(
                            receivedMessages,
                            this.triggerWord
                        );
                        await this.deleteUnimportantMessages(
                            unimportantMessages
                        );
                        await this.deleteMoreThan280CharMessages(
                            importantMessages
                        );
                        if (importantMessages[0]) {
                            lastMessage =
                                importantMessages[importantMessages.length - 1];
                        }
                        resolve(lastMessage);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    };

    tweetMessage = (message) => {
        return new Promise(async (resolve, reject) => {
            const status = message.message_create.message_data.text;
            const payload = {
                status,
            };
            await this.T.post(
                "statuses/update",
                payload,
                (error, data) => {
                    if(error){
                        reject(error);
                    }else{
                        const msg = `successfully posting new status with DM id ${message.id}`;
                        console.log(msg);
                        resolve({
                            message: msg,
                            data
                        });
                    }
                }
            );
        });
    };
}

module.exports = { twitterBot };
