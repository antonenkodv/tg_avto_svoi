const {connectToDb} = require('./init_db')
const User = require('./models/User')
const options = require('./options')
const {bot} = require('./bot')
const {createCar, savePhone, saveAdress, downloadInfo} = require('./functions')
const validators = require('./validators.js')
const callbacks = require('./callbacks')
const {validationFullname} = require("./validators");
const helpers = require("./helpers");
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
            if (!isExist) return bot.sendMessage(chatId, `Якщо хочете <b>Приєднатися</b> - натиснить кнопку `, options.enter);

            if (msgText === 'Налаштування') {
                if (user.done) {
                    const n = JSON.parse(options.settings_menu.reply_markup)
                    n.keyboard[2].push(user.status ? {text: "Деактивувати статус"} : {text: "Активувати статус"})
                    const opt = JSON.parse(JSON.stringify(options.settings_menu))
                    opt.reply_markup = n
                    return bot.sendMessage(chatId, `Оберіть,які налаштування  хочете змінити`, opt)
                }
            }
            if (msgText === `Номер телефону`) {
                if (user.done) {
                    const phone = user.tel_number
                    await User.updateOne({chat_id: chatId}, {tel_number: null})
                    return bot.sendMessage(chatId, `\nВаш номер телефону:<b>${phone}</b>\nВведіть новий номер  або поділиться контактом📞`, options.shareContact)

                }
            }
            if (msgText === 'Графік') {
                if (user.done) {
                    await User.updateOne({chat_id: chatId}, {schedule: null})
                    return bot.sendMessage(chatId, `Оберіть зручний для вас графік🕒`, options.schedule)
                }
            }
            if (msgText === 'Додати авто') {
                if (user.done) {
                    await User.updateOne({chat_id: chatId}, {cars_approved: null})
                    let str = "Ваші авто:"
                    user.cars.forEach((car, i) => {
                        str += `\n<b>${i + 1} ${car.model}</b>`
                    })
                    await bot.sendMessage(chatId, `${str}`, {parse_mode: "HTML"})
                    const optRemove = {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    };
                    return bot.sendMessage(msg.chat.id, `\n\nВведіть номер авто,яке хочете додати`, optRemove);

                }
            }
            if (msgText === 'Видалити авто') {
                const inline_keyboard = []
                user.cars.forEach((car, i) => {
                    inline_keyboard.push([{text: `${car.model}`, callback_data: `deleteCar_${car._id}`}])
                })
                inline_keyboard.push([{text: "👈Повернутись", callback_data: `backToMenu`}])

                const opt = {
                    parse_mode: "HTML",
                    reply_markup: JSON.stringify({inline_keyboard})
                }
                return bot.sendMessage(chatId, `Оберіть зі списку авто,яке хочете видалити❌`, opt)

            }
            if (msgText === 'Район пошуку') {
                if (user.done) {
                    await User.updateOne({chat_id: chatId}, {radius: {done: false, regions: []}})
                    const inline_keyboard = []
                    for (let key in helpers.regions) {
                        const text = `${user.radius.regions.find(region => region === key) ? "✅" : "➖"} ${helpers.regions[key]}`
                        inline_keyboard.push([{text, callback_data: `setRegion_${key}`}])
                    }
                    inline_keyboard.push([{text: 'Далi', callback_data: `setRegion_continue`}])
                    const opt = {parse_mode: "HTML"}
                    opt.reply_markup = JSON.stringify({inline_keyboard})
                    return bot.sendMessage(chatId, `\nДе ви готові їздити❓`, opt)
                }
            }
            if (msgText === 'Активувати статус' || msgText === 'Деактивувати статус') {
                if(user.done){
                    if(user.status) await User.updateOne({chat_id : chatId} , {status : false})
                    else  await User.updateOne({chat_id : chatId} , {status : true})
                    bot.sendMessage(chatId , `Ваш статус був змінений на <b>${user.status ? 'активний🚀' : 'не активний😴'}</b>`,options.settings)
                }

            }


            if (isExist && !user.name) {
                if (!validationFullname(msgText)) return bot.sendMessage(chatId, `Будь ласка , введіть повну фамілію, им'я та по батькові`)

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

            if (user.certification == null) {
                return bot.deleteMessage(chatId, msg.message_id)
            }
            return bot.sendMessage(chatId, `<b>Налаштування</b>`, options.settings)
        } catch
            (err) {
            console.log(err)
        }
    }
)
;


bot.on('callback_query', async function (msg) {
    const chatId = msg.message.chat.id;

    const entry = msg.data.split("_")[0]
    const func = callbacks[entry]
    await func(msg, chatId)

});
