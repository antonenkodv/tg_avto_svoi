const Message = require("./models/Message");
const options = require("./options");
const {bot} = require("./bot");

async function editMessage(chatId, text, funcType, optType) {
    const message = await Message.findOne({chat_id: chatId}).lean().exec()
    await Message.updateOne({chat_id: chatId}, {type: funcType})
    options[optType].chat_id = chatId
    options[optType].message_id = message.message_id
    return bot.editMessageText(text, options[optType]);
}

async function saveMessage(chatId, messageId, type) {
    const message = new Message({chat_id: chatId, message_id: messageId, type: 'create_car'});
    return message.save()
}

async function deleteMessage(chatId) {
    return Message.deleteOne({chat_id: chatId}).lean().exec()
}

module.exports = {
    editMessage,
saveMessage,
    deleteMessage
}