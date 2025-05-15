import { Bot, InlineKeyboard, session } from "grammy";
import { psychologistPrompt } from "./systemPrompt.js";

// Проверка переменных окружения
if (
    !process.env.BOT_TOKEN ||
    !process.env.AI_API_URL ||
    !process.env.AI_API_TOKEN || 
    !process.env.STRESS_TEST_URL
) {
    console.error(
        "Ошибка: Не заданы BOT_TOKEN, AI_API_URL или AI_API_TOKEN в .env"
    );
    process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(
    session({
        initial: () => ({
            isChatting: false,
            conversationHistory: [
                {
                    role: "system",
                    content: psychologistPrompt,
                },
            ],
        }),
    })
);

bot.command("start", async (ctx) => {
    await sendMainMenu(ctx);
});

bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    switch (data) {
        case "emergency_help":
            await handleEmergencyHelp(ctx);
            break;
        case "in_danger":
            await handleInDanger(ctx);
            break;
        case "feeling_bad":
            await handleFeelingBad(ctx);
            break;
        case "start_chat":
            await handleStartChat(ctx);
            break;
        case "cancel":
            await sendMainMenu(ctx, false);
            break;
        default:
            await sendErrorMessage(null, ctx, false);
            break;
    }
});

bot.on("message", async (ctx) => {
    if (!ctx.session.isChatting || !ctx.message.text) {
        await sendDontUnderstandMessage(ctx);
        return;
    }
    await handleChatMessage(ctx);
});

bot.catch(async (error, ctx) => {
    console.error("Глобальная ошибка:", error);
    await sendErrorMessage(error, ctx);
});

bot.start()
console.log("Бот включен")

async function sendMainMenu(ctx, isNewMessage = true) {
    ctx.session.isChatting = false;

    const botMessage = `<b>🌟 Добро пожаловать в меню бота-психолога! 🌟</b>\n\nЯ здесь, чтобы поддержать тебя 😊\nВыбери интересующий раздел ниже ⬇️`;
    const menuKeyboard = new InlineKeyboard()
        .text("🆘 Я в опасности", "in_danger")
        .text("😔 Мне плохо", "feeling_bad")
        .row()
        .text("💬 Начать чат", "start_chat")
        .text("🚨 Экстренная помощь", "emergency_help")
        .row()
        .url("📝 Пройти тест на уровень стресса", process.env.STRESS_TEST_URL);

    try {
        if (isNewMessage) {
            return await ctx.reply(botMessage, {
                reply_markup: menuKeyboard,
                parse_mode: "HTML",
            });
        }
        return await ctx.editMessageText(botMessage, {
            reply_markup: menuKeyboard,
            parse_mode: "HTML",
        });
    } catch (error) {
        console.error("Ошибка в sendMainMenu:", error);
    }
}

async function sendErrorMessage(error, ctx, isNewMessage = true) {
    const errorText = `⚠️ <b>Ой, что-то пошло не так!</b> 😔\nПопробуй снова или вернись в меню командой /start`;

    try {
        if (isNewMessage && ctx?.reply) {
            await ctx.reply(errorText, { parse_mode: "HTML" });
        } else if (ctx?.editMessageText) {
            await ctx.editMessageText(errorText, { parse_mode: "HTML" });
        }
    } catch (e) {
        console.error("Ошибка при отправке сообщения об ошибке:", e);
    }

    if (error) console.error("Ошибка:", error);
}

async function sendDontUnderstandMessage(ctx) {
    try {
        await ctx.reply(
            `🤔 <b>Ой, я не понял, что ты имел в виду! Если хочешь поговорить, выбери в меню "Начать чат"</b>\n` +
                `Чтобы вернуться в меню, введи /start 🌟`,
            { parse_mode: "HTML" }
        );
    } catch (error) {
        console.error("Ошибка в sendDontUnderstandMessage:", error);
    }
}

async function handleEmergencyHelp(ctx) {
    const emergencyMessage =
        `Если срочно нужна помощь, <b>звони</b>:\n` +
        `📞 <code>112</code> — Экстренные службы\n` +
        `🩺 <code>103</code> — Скорая помощь\n` +
        `🔥 <code>101</code> — Пожарные\n` +
        `👮 <code>102</code> — Полиция`;

    const backButton = new InlineKeyboard().text("❌ Назад", "cancel");

    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(emergencyMessage, {
            reply_markup: backButton,
            parse_mode: "HTML",
        });
    } catch (error) {
        console.error("Ошибка в handleEmergencyHelp:", error);
    }
}

async function handleInDanger(ctx) {
    const inDangerMessage =
        `1. 👨‍🏫 <b>Сообщи взрослому</b>\n` +
        `Найди кого-то, кому доверяешь: родителя, учителя, старшего брата или сестру\n` +
        `Расскажи, что происходит, чтобы они помогли\n` +
        `Если рядом никого нет, сразу звони 📞 <code>112</code> — это экстренная служба России\n\n` +
        `2. 😌 <b>Сохраняй спокойствие</b>\n` +
        `Сделай глубокий вдох: считай до 4, вдыхая через нос, и до 6, выдыхая через рот\n` +
        `Повтори это 3 раза, чтобы успокоить нервы\n` +
        `Попробуй описать, что случилось, в 2-3 предложениях (например, «Меня пугают старшеклассники после уроков»)\n\n` +
        `3. 📸 <b>Документируй</b>\n` +
        `Если это безопасно, сделай фото, видео или аудиозапись происходящего\n` +
        `Например, запиши угрозы в соцсетях или сфотографируй, что происходит вокруг\n` +
        `Это может пригодиться для доказательств позже`;

    const backButton = new InlineKeyboard().text("❌ Назад", "cancel");

    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(inDangerMessage, {
            reply_markup: backButton,
            parse_mode: "HTML",
        });
    } catch (error) {
        console.error("Ошибка в handleInDanger:", error);
    }
}

async function handleFeelingBad(ctx) {
    const feelingBadMessage =
        `1. ⏸️ <b>Сделай паузу</b>\n` +
        `Отойди от того, что тревожит: выйди на улицу, выпей воды или просто посиди тихо\n` +
        `Попробуй упражнение «5-4-3-2-1», чтобы успокоиться:\n` +
        `👀 Назови 5 вещей, которые видишь вокруг\n` +
        `👂 Назови 4 звука, которые слышишь\n` +
        `✋ Назови 3 вещи, которые можешь потрогать\n` +
        `👃 Назови 2 запаха, которые чувствуешь\n` +
        `👅 Назови 1 вкус, который можешь представить\n\n` +
        `2. ✍️ <b>Расскажи о чувствах</b>\n` +
        `Выбери в главном меню кнопку "Начать чат", и напиши боту, что произошло, в таком формате:\n` +
        `«Сейчас я чувствую [эмоция], потому что [причина]. Хочу [желание]»\n` +
        `Например: «Грустно, потому что поссорился с другом. Хочу, чтобы он извинился»\n\n` +
        `3. 🧡 <b>Получи поддержку</b>\n` +
        `Позвони, если нужна помощь, ведь тебя всегда готовы поддержать:\n` +
        `📞 <code>8-800-2000-122</code> — Телефон доверия для детей и подростков\n` +
        `📞 <code>8-800-7000-600</code> — Круглосуточная помощь для всех`;

    const backButton = new InlineKeyboard().text("❌ Назад", "cancel");

    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(feelingBadMessage, {
            reply_markup: backButton,
            parse_mode: "HTML",
        });
    } catch (error) {
        console.error("Ошибка в handleFeelingBad:", error);
    }
}

async function handleStartChat(ctx) {
    ctx.session.isChatting = true;

    const backButton = new InlineKeyboard().text("❌ Назад", "cancel");
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
            `💬 <b>Режим чата включён!</b>\n` +
                `Напиши мне свои вопросы или мысли, я постараюсь помочь 😊`,
            {
                reply_markup: backButton,
                parse_mode: "HTML",
            }
        );
    } catch (error) {
        console.error("Ошибка в handleStartChat:", error);
    }
}

async function handleChatMessage(ctx) {
    ctx.session.conversationHistory.push({
        role: "user",
        content: ctx.message.text,
    });

    let waitingMessage;
    try {
        waitingMessage = await ctx.reply("🔄 <b>Обрабатываю сообщение...</b>", {
            parse_mode: "HTML",
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000); // Тайм-аут 25 секунд

        const response = await fetch(process.env.AI_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistral-large-2411",
                messages: ctx.session.conversationHistory,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Слишком много запросов к API, попробуй позже");
            }
            throw new Error(
                `Ошибка API: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        const assistantResponse = data.choices[0].message.content;
        ctx.session.conversationHistory.push({
            role: "assistant",
            content: assistantResponse,
        });

        const botMessage = `${assistantResponse}\n\nЕсли хочешь вернуться в меню, введи /start`;

        await ctx.api.editMessageText(
            ctx.chat.id,
            waitingMessage.message_id,
            botMessage,
            { parse_mode: "HTML" }
        );
    } catch (error) {
        const errorMessage =
            error.name === "AbortError"
                ? "⚠️ <b>Бот не отвечает, попробуй еще раз или позже</b>\n" + "Чтобы вернуться в меню, введи /start"
                : `⚠️ <b>Ошибка: ${error.message}</b>\nПопробуй снова или вернись в меню командой /start`;

        try {
            await ctx.api.editMessageText(
                ctx.chat.id,
                waitingMessage?.message_id,
                errorMessage,
                { parse_mode: "HTML" }
            );
        } catch (e) {
            console.error("Ошибка при редактировании сообщения:", e);
            await ctx.reply(errorMessage, { parse_mode: "HTML" });
        }
        console.error("Ошибка в handleChatMessage:", error);
    }
}
