"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const bot = new telegraf_1.Telegraf('7695014969:AAGql5j-NLxvRU_G50idM6Fm92GCTn-oB8s');
// Список каналов и пользователей
const users = new Map();
const channels = []; // Список каналов с ссылкой и ownerId
bot.start((ctx) => {
    ctx.reply('Добро пожаловать! Отправьте ссылку на ваш Twitch канал 📺', telegraf_1.Markup.removeKeyboard());
});
bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const message = ctx.message.text;
    if (!users.has(userId)) {
        // Сохраняем ссылку на Twitch канал
        users.set(userId, { twitch: message, subscribed: [] });
        // Добавляем канал в список
        channels.push({ link: message, ownerId: userId });
        ctx.reply('Ссылка сохранена! Перед тем как начать, подпишитесь на мой Twitch канал 💖', telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.url('Подписаться 💜', 'https://www.twitch.tv/innkomaf16'),
            telegraf_1.Markup.button.callback('Проверить подписку ✅', 'check_subscription')
        ]));
    }
    else {
        ctx.reply('Вы уже отправили свою ссылку. Нажмите "Начать подписываться"!');
    }
});
bot.action('check_subscription', (ctx) => {
    ctx.reply('Готовы подписываться? Let’s go! 🏃‍♂️', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Начать подписываться 📺', 'start_subscribing')
    ]));
});
bot.action('start_subscribing', (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);
    if (!user) {
        ctx.reply('Пожалуйста, отправьте ссылку на ваш Twitch канал сначала!');
        return;
    }
    // Находим доступные каналы для подписки
    const availableChannels = channels.filter((channel) => channel.ownerId !== userId && !user.subscribed.includes(channel.link));
    if (availableChannels.length === 0) {
        ctx.reply('На данный момент нет доступных каналов для подписки. 😕', telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Хорошо 🙂', 'ready_to_subscribe')
        ]));
    }
    else {
        const channel = availableChannels[0];
        ctx.reply(`Подпишитесь на канал: ${channel.link} 👉`, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Проверить подписку ✅', `confirm_${channel.link}`)
        ]));
    }
});
bot.action('ready_to_subscribe', (ctx) => {
    ctx.reply('Готовы подписываться? Let’s go! 🏃‍♂️', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Начать подписываться 📺', 'start_subscribing')
    ]));
});
bot.action(/confirm_.+/, (ctx) => {
    const userId = ctx.from.id;
    const channelLink = ctx.match[0].replace('confirm_', '');
    const user = users.get(userId);
    if (!user) {
        ctx.reply('Пожалуйста, отправьте ссылку на ваш Twitch канал сначала!');
        return;
    }
    user.subscribed.push(channelLink);
    ctx.reply('Подписка подтверждена! 🙌', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Подписаться еще 👉', 'start_subscribing'),
        telegraf_1.Markup.button.callback('Прекратить 🚫', 'stop')
    ]));
});
bot.action('stop', (ctx) => {
    ctx.reply('Спасибо за использование бота! Нажмите /start, чтобы начать заново. 🚀');
});
bot.launch().then(() => {
    console.log('Бот запущен!');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
