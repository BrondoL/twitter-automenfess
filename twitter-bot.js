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
            msg.message_create.message_data.text.includes(trigger)
        );
    };

    getUnimportantMessages = (messages, trigger) => {
        return messages.filter(
            (msg) => !msg.message_create.message_data.text.includes(trigger)
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
        if (messages.length > 5) {
            for (let i = 0; i < 5; i++) {
                await this.deleteMessage(messages[i]);
                await this.sleep(2000);
            }
        }
    };

    getDirectMessages = (userId) => {
        return new Promise((resolve, reject) => {
            this.T.get("direct_messages/events/list", async (error, data) => {
                if (error) {
                    reject(error);
                } else {
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
                    await this.deleteUnimportantMessages(unimportantMessages);
                    resolve(importantMessages);
                }
            });
        });
    };
}

module.exports = { twitterBot };
