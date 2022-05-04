const {connectToDb} = require('./init_db')
const User = require('./models/User')
const options = require('./options')
const {bot} = require('./bot')
const { createCar, savePhone, saveAdress, downloadInfo} = require('./functions')
const validators = require('./validators.js')
const callbacks = require('./callbacks')
const {validationFullname} = require("./validators");
require('dotenv').config()


connectToDb()

bot.setMyCommands([
    {command: '/start', description: 'Початок'},
    {command: '/download', description: 'Завантажити'}
])

bot.on('message', async (msg) => {
    const msgText = msg.text
    const chatId = msg.chat.id;
    const isExist = await User.exists({chat_id: chatId})
    let user = isExist ? await User.findOne({chat_id: chatId}).populate('cars').lean().exec() : null

    try {
        if (msgText === '/download') {
            return downloadInfo(chatId)
        }
        if (msgText === '/start') {
            if (!isExist) return bot.sendMessage(chatId, "Мы команда Свої(https://svoi.space) , ласкаво просимо у наше співтовариство ,якщо  хочете <b>Приєднатися</b> - натисніть кнопку", options.enter);
        }
        if (msgText === 'Приєднатися') {
            if (!isExist) {
                const newUser = new User({chat_id: chatId})
                await newUser.save()
                return bot.sendMessage(chatId, `\nДякуємо за бажання доєднатися до нас🙏\nДля початку нам потрібно познайомитись\n<b>Введіть ваше прізвище, ім’я та по батькові</b>`, {parse_mode: "HTML"});
            }
        }
        if (msgText === 'Налаштування') {
            if (!isExist) {
                return bot.sendMessage(chatId, `Якщо хочете <b>Приєднатися</b> - натиснить кнопку `, options.enter);
            }else {
                if (user.certification !==null) return bot.sendMessage(chatId, `Оберіть потрібні налаштування`,options.settings_menu)
            }
        } else {
            if (!isExist) return bot.sendMessage(chatId, `Якщо хочете <b>Приєднатися</b> - натиснить кнопку `, options.enter);
        }


        if (isExist && !user.name) {
            if (!validationFullname(msgText)) return bot.sendMessage(chatId, `Будь ласка ,введіть повну фамілію, им'я та по батькові`)

            const name = msgText.trim().split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
            await User.updateOne({chat_id: chatId}, {name});
            return bot.sendMessage(chatId, `Добре <b>${name}</b>,введіть номер вашого транспортного засобу🚗`, {parse_mode: "HTML"})
        }

        if (!user.cars_approved) {
            if (!user.cars.length) return createCar(msgText, chatId)

            const carWithoutSB = user.cars.find(car => (car.type === 'Легковий' || car.type === 'Автобус') && !car.subtype)

            if (carWithoutSB) {
                return bot.deleteMessage(chatId, msg.message_id)
            }

            const carryingCheck = user.cars.find(car => !car.carrying)
            if (carryingCheck) {
                return bot.deleteMessage(chatId, msg.message_id)
            }
            return createCar(msgText, chatId)
        }

        if (!user.tel_number) {
            if (msg.contact || validators.validatePhoneNumber(msgText)) return savePhone(msg.contact ? msg.contact.phone_number : msgText, chatId)
            else {
                const str = "⛔Не вiрний формат, вiдправьте номер телефона у форматi: <b>+380xxxxxxxxx</b>\nАбо подiлиться контактом📞"
                return bot.sendMessage(chatId, str, options.shareContact);
            }
        }
        if (!user.radius.done) {
            return bot.deleteMessage(chatId, msg.message_id)
        }

        if (!user.schedule) {
            return bot.deleteMessage(chatId, msg.message_id)
        }

        if (!user.district) {
            return bot.deleteMessage(chatId, msg.message_id)
        }

        if (!user.microdistrict) {
            return bot.deleteMessage(chatId, msg.message_id)
        }

        if (!user.adress) {
            return saveAdress(msgText, chatId)
        }

        if (!user.certification) {
            return bot.deleteMessage(chatId, msg.message_id)
        }
        return bot.sendMessage(chatId, `<b>Налаштування</b>`, options.settings)
    } catch (err) {
        console.log(err)
    }
});


bot.on('callback_query', async function (msg) {
    const chatId = msg.message.chat.id;

    const entry = msg.data.split("_")[0]
    const func = callbacks[entry]
    await func(msg, chatId)

});
