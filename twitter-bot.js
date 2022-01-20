const Twit = require("twit");

class twitterBot {
    constructor(props) {
        this.T = new Twit({
            consumer_key: props.consumer_key,
            consumer_secret: props.consumer_secret,
            access_token: props.access_token,
            access_token_secret: props.access_token_secret,
        });
    }

    getAdminUserInfo = () => {
        return new Promise((resolve, reject) => {
            this.T.get("account/verify_credentials", { skip_status: true })
                .catch((err) => reject(err))
                .then((result) => {
                    const userId = result.data.id_str;
                    resolve(userId)
                });
        });
    };

    getReceivedMessages = (messages, userId) => {
        return messages.filter((msg) => msg.message_create.sender_id !== userId);
    }

    getDirectMessages = (userId) => {
        return new Promise((resolve, reject) => {
            this.T.get("direct_messages/events/list", (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    const messages = data.events;
                    const receivedMessages = this.getReceivedMessages(messages, userId);
                    resolve(receivedMessages);
                }
            });
        });
    };
}

module.exports = { twitterBot };
