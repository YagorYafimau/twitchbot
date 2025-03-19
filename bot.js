const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');  // Для работы с файловой системой

const bot = new Telegraf('7695014969:AAGql5j-NLxvRU_G50idM6Fm92GCTn-oB8s'); // Замените на ваш токен
const ADMIN_CHAT_ID = '@twitchvzaimadmin'; // Замените на ваш chat_id

// Список каналов и пользователей
const users = new Map();
const channels = []; // Список каналов с ссылкой, ownerId и количеством подписчиков

// Таймер для сброса состояния пользователя (5 минут)
const USER_STATE_TIMEOUT = 300000; // 5 минут в миллисекундах

// Функция для загрузки статистики из файла
function loadStats() {
    try {
        const data = fs.readFileSync('stats.json');
        return JSON.parse(data);
    } catch (error) {
        // Если файл не существует, создаем его с начальными значениями
        return { "users": 0, "messages": 0 };
    }
}

// Функция для сохранения статистики в файл
function saveStats(stats) {
    fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
}

// Загрузка статистики при запуске бота
let stats = loadStats();

// Функция для поиска доступных каналов
function getAvailableChannels(userId) {
    const user = users.get(userId);
    if (!user) return [];

    return channels.filter(
        (channel) => channel.ownerId !== userId && !user.subscribed.includes(channel.link)
    );
}

// Функция для сброса состояния пользователя
function resetUserState(userId) {
    const user = users.get(userId);
    if (user) {
        user.step = 0; // Сбрасываем состояние
        console.log(`Состояние пользователя ${userId} сброшено.`);
    }
}

// Обработчик команды /start
bot.start((ctx) => {
    const userId = ctx.from.id;

    // Увеличиваем количество пользователей
    stats.users++;
    saveStats(stats);

    // Проверка, если пользователь уже прислал ссылку на канал
    if (!users.has(userId)) {
        ctx.reply(
            'Добро пожаловать! Отправьте ссылку на ваш Twitch канал 📺\n\n' +
            '🌟 Важно: на сколько человек вы подпишетесь, столько раз ваш канал будет показан другим пользователям! 🌟',
            Markup.removeKeyboard()
        );
    } else {
        ctx.reply('Вы уже зарегистрированы! Нажмите "Начать подписываться" для продолжения.');
    }
});

// Функция для проверки ссылки на Twitch
function isTwitchLink(url) {
    return url.includes('twitch.tv');
}

// Обработчик текста
bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const message = ctx.message.text;

    // Увеличиваем количество сообщений
    stats.messages++;
    saveStats(stats);

    if (!users.has(userId)) {
        if (isTwitchLink(message)) {
            // Сохраняем ссылку на Twitch канал
            users.set(userId, { 
                twitch: message, 
                subscribed: [], 
                step: 0, 
                subscribersCount: 0, // Количество подписчиков
                viewsCount: 0 // Количество показов канала
            });
            // Добавляем канал в список
            channels.push({ 
                link: message, 
                ownerId: userId, 
                subscribersCount: 0 // Количество подписчиков канала
            });

            ctx.reply(
                'Ссылка сохранена! Перед тем как начать, подпишитесь на мой Twitch канал 💖',
                Markup.inlineKeyboard([ 
<<<<<<< HEAD
                    Markup.button.url('Подписаться 💜', 'https://www.twitch.tv/komainn'), // Исправлено: убрана лишняя "h"
=======
                    Markup.button.url('Подписаться 💜', 'https://www.twitch.tv/komainn'),
>>>>>>> 0f7e4515aadaf3f9936137e8c45a6b562836c814
                    Markup.button.callback('Проверить подписку ✅', 'check_subscription')
                ])
            );
        } else {
            ctx.reply('⚠️ Вы отправили неверную ссылку. Пожалуйста, отправьте ссылку на ваш Twitch канал, например: https://www.twitch.tv/yourchannel');
        }
    } else {
        const user = users.get(userId);
        if (user.step === 0 && !isTwitchLink(message)) {
            ctx.reply('⚠️ Вы отправили неверную ссылку. Пожалуйста, отправьте ссылку на ваш Twitch канал, например: https://www.twitch.tv/yourchannel');
        } else if (user.step === 0 && isTwitchLink(message)) {
            // Обновляем ссылку на Twitch канал
            user.twitch = message;
            // Обновляем канал в списке
            const channelIndex = channels.findIndex(channel => channel.ownerId === userId);
            if (channelIndex !== -1) {
                channels[channelIndex].link = message;
            }

            ctx.reply(
                'Ссылка обновлена! Перед тем как начать, подпишитесь на мой Twitch канал 💖',
                Markup.inlineKeyboard([ 
                    Markup.button.url('Подписаться 💜', 'https://www.twitch.tv/innkomaf16'),
                    Markup.button.callback('Проверить подписку ✅', 'check_subscription')
                ])
            );
        } else {
            ctx.reply('Вы уже отправили свою ссылку. Нажмите "Начать подписываться"!'); 
        }
    }
});

// Обработчик нажатия на кнопку "Проверить подписку"
bot.action('check_subscription', (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);

    if (user.step === 0) {
        ctx.reply('Пожалуйста, отправьте скриншот подтверждения подписки 📸');
        user.step = 1; // Переход к ожиданию скриншота

        // Устанавливаем таймер для сброса состояния
        setTimeout(() => resetUserState(userId), USER_STATE_TIMEOUT);
    }
});

// Обработчик фото (скриншотов)
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);

    if (user && user.step === 1) {
        const photo = ctx.message.photo[0].file_id;

        // Получаем ссылку на канал, на который нужно подписаться
        const targetChannelLink = user.currentChannel;

        // Пересылаем скриншот в админский чат
        ctx.telegram.sendPhoto(ADMIN_CHAT_ID, photo, {
            caption: `Пользователь @${ctx.from.username} (ID: ${userId}) отправил скриншот для подтверждения подписки.\n\nСсылка на Twitch канал пользователя: ${user.twitch}\nСсылка на Twitch канал для подписки: ${targetChannelLink}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Подтвердить ✅', callback_data: `approve_${userId}` },
                        { text: 'Отклонить ❌', callback_data: `reject_${userId}` }
                    ]
                ]
            }
        });

        ctx.reply('Мы проверим вашу подписку, пожалуйста, подождите! ⏳');
        user.step = 2; // Ожидание ответа от администратора
    }
});

// Обработчик подтверждения/отклонения подписки администратором
bot.action(/approve_(\d+)/, (ctx) => {
    const userId = ctx.match[1];
    const user = users.get(Number(userId));

    if (user) {
        // Добавляем текущий канал в список подписок пользователя
        if (user.currentChannel) {
            user.subscribed.push(user.currentChannel);
            user.currentChannel = null; // Сбрасываем текущий канал

            // Увеличиваем счетчик подписчиков для канала
            const channel = channels.find(ch => ch.link === user.currentChannel);
            if (channel) {
                channel.subscribersCount++;
            }

            // Увеличиваем счетчик показов для пользователя
            user.viewsCount += user.subscribed.length;

            // Показываем канал пользователя другим пользователям
            const availableChannels = getAvailableChannels(userId);
            availableChannels.slice(0, user.subscribed.length).forEach(ch => {
                // Отправляем сообщение с предложением подписаться на канал пользователя
                ctx.telegram.sendMessage(ch.ownerId, `Ваш канал был показан пользователю @${ctx.from.username}`);
            });
        }

        ctx.telegram.sendMessage(
            userId,
            `Подписка на канал подтверждена! 🙌\nВаш канал будет показан ${user.subscribed.length} раз(а).`,
            Markup.inlineKeyboard([
                Markup.button.callback('Подписаться еще 👉', 'subscribe_more'),
                Markup.button.callback('Прекратить 🚫', 'stop')
            ])
        );
        ctx.reply('Подписка подтверждена.');
    }
});

bot.action(/reject_(\d+)/, (ctx) => {
    const userId = ctx.match[1];
    const user = users.get(Number(userId));

    if (user) {
        ctx.telegram.sendMessage(userId, 'Подписка не подтверждена, пожалуйста, вышлите скриншот с подпиской 📸');
        user.step = 1; // Возврат к ожиданию скриншота
        ctx.reply('Подписка отклонена.');
    }
});

// Обработчик нажатия на кнопку "Подписаться еще"
bot.action('subscribe_more', (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);

    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, отправьте ссылку на ваш Twitch канал 📺');
        return;
    }

    const availableChannels = getAvailableChannels(userId);

    if (availableChannels.length === 0) {
        ctx.reply(
            'На данный момент нет доступных каналов для подписки. Попробуйте позже ⏳',
            Markup.inlineKeyboard([ 
                Markup.button.callback('Хорошо 🙂', 'ready_to_subscribe')
            ])
        );
    } else {
        const channel = availableChannels[0];
        user.currentChannel = channel.link; // Сохраняем текущий канал для проверки
        ctx.reply(
            `Подпишитесь на канал: ${channel.link} 👉`,
            Markup.inlineKeyboard([ 
                Markup.button.callback(`Проверить подписку ✅`, `check_subscription_new_${channel.link}`)
            ])
        );
    }
});

// Обработчик нажатия на кнопку "Хорошо 🙂"
bot.action('ready_to_subscribe', (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);

    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, отправьте ссылку на ваш Twitch канал 📺');
        return;
    }

    const availableChannels = getAvailableChannels(userId);

    if (availableChannels.length === 0) {
        ctx.reply(
            'На данный момент нет доступных каналов для подписки. Попробуйте позже ⏳',
            Markup.inlineKeyboard([ 
                Markup.button.callback('Хорошо 🙂', 'ready_to_subscribe')
            ])
        );
    } else {
        ctx.reply(
            'Готовы подписываться? Let\'s go! 🚀',
            Markup.inlineKeyboard([
                Markup.button.callback('Начать подписываться', 'subscribe_more')
            ])
        );
    }
});

// Обработчик нажатия на кнопку "Проверить подписку" для нового канала
bot.action(/check_subscription_new_.+/, (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);

    if (user) {
        ctx.reply('Пожалуйста, отправьте скриншот подтверждения подписки 📸');
        user.step = 1; // Переход к ожиданию скриншота

        // Устанавливаем таймер для сброса состояния
        setTimeout(() => resetUserState(userId), USER_STATE_TIMEOUT);
    }
});

// Обработчик нажатия на кнопку "Прекратить"
bot.action('stop', (ctx) => {
    ctx.reply('Спасибо за использование бота! Нажмите /start, чтобы начать заново. 🚀');
});

// Запуск бота
bot.launch().then(() => {
    console.log('Бот запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
