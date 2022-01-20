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

    getReceivedMessages = (messages, userId, trigger) => {
        const receivedMessages = messages.filter(
            (msg) => msg.message_create.sender_id !== userId
        );
        return receivedMessages.filter((msg) =>
            msg.message_create.message_data.text.includes(trigger)
        );
    };

    getDirectMessages = (userId) => {
        return new Promise((resolve, reject) => {
            this.T.get("direct_messages/events/list", (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    const messages = data.events;
                    const receivedMessages = this.getReceivedMessages(
                        messages,
                        userId,
                        this.triggerWord
                    );
                    resolve(receivedMessages);
                }
            });
        });
    };
}

module.exports = { twitterBot };
