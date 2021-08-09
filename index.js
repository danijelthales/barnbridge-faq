require("dotenv").config()
const Discord = require("discord.js")
const client = new Discord.Client();

const replaceString = require('replace-string');
const https = require('https');
const redis = require("redis");
const axios = require('axios');
let redisClient = null;

var fs = require('fs');

var coingeckoUsd = 100;
var coingeckoEth = 0.171;
var coingeckoBtc = 0.000351;
var binanceUsd = 3.74;
var kucoinUsd = 3.74;

var tvl = 531132484;

let gasSubscribersMap = new Map();
let gasSubscribersLastPushMap = new Map();

var bondApy = '590%';

let daoBond = 214311.49;
let daoBondAPR = 280 + "%";

const clientBondPrice = new Discord.Client();
clientBondPrice.login(process.env.BOT_TOKEN_BOND);

const clientBondSupply = new Discord.Client();
clientBondSupply.login(process.env.BOT_TOKEN_SUPPLY);

const clientBondCap = new Discord.Client();
clientBondCap.login(process.env.BOT_TOKEN_CAP);

const clientBetAPY = new Discord.Client();
clientBetAPY.login(process.env.BOT_TOKEN_BET_APY);

const clientApy = new Discord.Client();
clientApy.login(process.env.BOT_TOKEN_APY);

const clientBtcPrice = new Discord.Client();
clientBtcPrice.login(process.env.BOT_TOKEN_BTC);


const clientEpoch = new Discord.Client();
clientEpoch.login(process.env.BOT_TOKEN_EPOCH);

const clientBotTokenSy = new Discord.Client();
clientBotTokenSy.login(process.env.BOT_TOKEN_SY_APY);

const clientBotTokenTX = new Discord.Client();
clientBotTokenTX.login(process.env.BOT_TOKEN_TX);

var bondMarketCap = 1000000;

var btcPrice = 13000;
var btcMarketCap = 242750958733;

const barnbridgeTransactionHashKey = 'TnxHash'
let poolAddresses = new Map();
poolAddresses.set('0x4B8d90D68F26DEF303Dcb6CFc9b63A1aAEC15840', 'cUSDC');
poolAddresses.set('0x673f9488619821aB4f4155FdFFe06f6139De518F', 'cDAI');
poolAddresses.set('0x3E3349E43e5EeaAEDC5Dc2cf7e022919a6751907', 'cUSDT');
poolAddresses.set('0x3cf46DA7D65E9aa2168a31b73dd4BeEA5cA1A1f1', 'aUSDC');
poolAddresses.set('0x6c9DaE2C40b1e5883847bF5129764e76Cb69Fc57', 'aDAI');
poolAddresses.set('0x660dAF6643191cF0eD045B861D820F283cA078fc', 'aUSDT');
poolAddresses.set('0x6324538cc222b43490dd95CEBF72cf09d98D9dAe', 'aGUSD');
poolAddresses.set('0x4dB6fb0218cE5DA392f1E6475A554BAFcb62EF30', 'aRAI');
poolAddresses.set('0xEc810FDd49e756fB7Ce87DC9D53C7cAB58EAB4Ce', 'aSUSD');
poolAddresses.set('0x62e479060c89C48199FC7ad43b1432CC585BA1b9', 'crUSDC');
poolAddresses.set('0x89d82FdF095083Ded96B48FC6462Ed5dBD14151f', 'crDAI');
poolAddresses.set('0xc45F49bE156888a1C0C93dc0fE7dC89091E291f5', 'crUSDT');


console.log("Redis URL:" + process.env.REDIS_URL);


let contentRaw = fs.readFileSync('content.json');
let answersContent = JSON.parse(contentRaw);
let qaMaps = new Map();
answersContent.forEach(a => {
    qaMaps.set(a.number, a.content);
})


if (process.env.REDIS_URL) {
    console.log("creating redis client");
    redisClient = redis.createClient(process.env.REDIS_URL);
    console.log("redis client " + redisClient);
    redisClient.on("error", function (error) {
        console.error('#### REDIS ERROR ####' + error);
    });

    redisClient.get("gasSubscribersMap", function (err, obj) {
        gasSubscribersMapRaw = obj;
        console.log("gasSubscribersMapRaw:" + gasSubscribersMapRaw);
        if (gasSubscribersMapRaw) {
            gasSubscribersMap = new Map(JSON.parse(gasSubscribersMapRaw));
            console.log("gasSubscribersMap:" + gasSubscribersMap);
        }
    });

    redisClient.get("gasSubscribersLastPushMap", function (err, obj) {
        gasSubscribersLastPushMapRaw = obj;
        console.log("gasSubscribersLastPushMapRaw:" + gasSubscribersLastPushMapRaw);
        if (gasSubscribersLastPushMapRaw) {
            gasSubscribersLastPushMap = new Map(JSON.parse(gasSubscribersLastPushMapRaw));
            console.log("gasSubscribersLastPushMap:" + gasSubscribersLastPushMap);
        }
    });


}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})
client.on("guildMemberAdd", function (member) {

    const exampleEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Welcome');

    exampleEmbed.addField('Hi, I am 007 FAQ bot. Welcome to the official BarnBridge Discord channel!',
        ":information_source:  There is no public sale. \n" +
        ":unicorn:  Uniswap listing of token after 26th Oct.\n" +
        ":safety_vest:  [Audited](https://github.com/BarnBridge/BarnBridge-YieldFarming/blob/master/BarnBridge-Yield-Farming-and-Incentivization-AUDIT.pdf) \n");
    exampleEmbed.addField('About Barnbridge',
        "BarnBridge is the first tokenized risk protocol. With BarnBridge, " +
        "you will be able to buy the asset you want, " +
        "at the risk you prefer. Like ETH but don't like the price swing? Hedge it and receive a more certain return. ")
    exampleEmbed.addField(':farmer_tone1:  To get $BOND token:',
        "1. Yield Farming: 8% of total supply over 1 year [LIVE] \n" +
        "2. Liquidity Pool Incentivization: 20% over 2 years [Coming 26th Oct] ");
    exampleEmbed.addField(':books:  Deep dives:',
        "1. [Yield Farming and LP Incentivization](https://medium.com/barnbridge/yield-farming-and-lp-incentivization-25eba3f55ec4)\n" +
        "2. [Barnbridge Launch](https://medium.com/barnbridge/barnbridge-this-is-houston-you-are-go-for-launch-b92e29a7dd20)");
    exampleEmbed.addField(':warning:  Check contract before deposit:',
        "1. [Yield Farming Contract](https://etherscan.io/address/0xb0Fa2BeEe3Cf36a7Ac7E99B885b48538Ab364853)\n" +
        "2. [$BOND Token Contract](https://etherscan.io/address/0x0391D2021f89DC339F60Fff84546EA23E337750f)");
    exampleEmbed.addField(':link:  Ecosystem links:',
        "[Project Explainer](https://medium.com/barnbridge/introducing-barnbridge-3f0015fef3bb)\n" +
        "[Governance Explainer](https://medium.com/barnbridge/dao-first-a-new-governance-model-863e8434bf00)\n" +
        "[Yield farming](https://app.barnbridge.com/pools)\n" +
        "[Whitepaper](https://github.com/BarnBridge/BarnBridge-Whitepaper)\n" +
        "[FAQs](https://barnbridge.gitbook.io/docs/faq)\n" +
        "[Github](https://github.com/BarnBridge)\n" +
        "[ELI5](https://twitter.com/n2ckchong/status/1318314737864638464)");
    exampleEmbed.addField('FAQ bot', "For any questions, please feel free to ask me and I will look through the list of FAQs I have. We get can get started if you send me a message with content ***help***" +
        "\n" +
        "Best, \n" +
        "BarnBridge Team");

    member.send(exampleEmbed);
});

client.on('messageReactionAdd', (reaction, user) => {
    let msg = reaction.message, emoji = reaction.emoji;
    if (emoji.name == '❌') {
        if (msg.author.username.toLowerCase().includes("faq")) {
            if (!user.username.toLowerCase().includes("faq")) {
                msg.delete({timeout: 300 /*time unitl delete in milliseconds*/});
            }
        }
    }
});

function doInnerQuestion(command, doReply, msg) {
    try {
        let answer = qaMaps.get(command * 1.0);

        const exampleEmbed = new Discord.MessageEmbed();
        exampleEmbed.setColor(answer.color);
        exampleEmbed.setTitle(answer.title);
        exampleEmbed.setDescription(answer.description);
        exampleEmbed.setURL(answer.url);

        answer.fields.forEach(function (field) {
            exampleEmbed.addField(field.title, field.value, field.inline);
        });

        if (answer.footer.title) {
            exampleEmbed.setFooter(answer.footer.title, answer.footer.value);

        }

        if (answer.image) {
            exampleEmbed.attachFiles(['images/' + answer.image])
                .setImage('attachment://' + answer.image);
        }

        if (answer.thumbnail) {
            exampleEmbed.attachFiles(['images/' + answer.thumbnail])
                .setThumbnail('attachment://' + answer.thumbnail);
        }

        if (doReply) {
            msg.reply(exampleEmbed);
        } else {
            msg.channel.send(exampleEmbed).then(function (message) {
                message.react("❌");
            }).catch(function () {
                //Something
            });
        }
        // }
    } catch (e) {
        if (doReply) {
            msg.reply("Oops, there seems to be something wrong there. \nChoose your question with ***question questionNumber***, e.g. **question 1**\nYou can get the question number via **list**");
        } else {
            msg.reply("Oops, there seems to be something wrong there. \nChoose your question with ***!FAQ question questionNumber***, e.g. **question 1**\nYou can get the question number if you send me **list** in DM");
        }
    }
}

client.on("message", msg => {

        if (!msg.author.username.toLowerCase().includes("faq")) {

            if (!(msg.channel.type == "dm")) {
                // this is logic for channels
                if (msg.content.toLowerCase().trim() == "!faq") {
                    msg.reply("Hi, I am 007 FAQ bot. I will be very happy to assist you, just ask me for **help** in DM.");
                } else if (msg.content.toLowerCase().trim() == "!faq help") {
                    msg.reply("I can only answer a predefined question by its number or by alias in a channel, e.g. **question 1**, or **gas price**. \n For more commands and options send me **help** in DM");
                } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("!faq question")) {
                    doQuestion(msg, "!faq question", false);
                } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("!faq q ")) {
                    doQuestion(msg, "!faq q", false);
                } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("!faq q")) {
                    const args = msg.content.slice('!faq q'.length);
                    if (!isNaN(args)) {
                        doInnerQuestion(args, false, msg);
                    }
                } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("!faq show chart")) {
                    let content = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '');
                    const args = content.slice("!faq show chart".length).split(' ');
                    args.shift();
                    const command = args.shift().trim();
                    doShowChart(command, msg, false);
                } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("!faq ")) {
                    let found = checkAliasMatching(false);
                    if (!found) {
                        let notFoundMessage = "Oops, I don't know that one. DM me ***list*** or ***aliases*** to see which questions and commands I know.";
                        msg.channel.send(notFoundMessage).then(function (message) {
                            message.react("❌");
                        }).catch(function () {
                            //Something
                        });
                    }
                }
            } else {
                try {

                    // this is the logic for DM
                    console.log("I got sent a DM:" + msg.content);

                    let found = checkAliasMatching(true);
                    // if alias is found, just reply to it, otherwise continue

                    if (!found) {
                        if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("unsubscribe")) {
                            gasSubscribersMap.delete(msg.author.id);
                            gasSubscribersLastPushMap.delete(msg.author.id);
                            if (process.env.REDIS_URL) {
                                redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                });
                                redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                });
                            }
                            msg.reply("You are now unsubscribed from gas updates");
                        } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("subscribe gas")) {
                            const args = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').slice("subscribe gas".length).split(' ');
                            args.shift();
                            const command = args.shift().trim();
                            if (command && !isNaN(command)) {
                                gasSubscribersMap.set(msg.author.id, command);
                                gasSubscribersLastPushMap.delete(msg.author.id);
                                if (process.env.REDIS_URL) {
                                    redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                    });
                                    redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                    });
                                }
                                msg.reply(" I will send you a message once safe gas price is below " + command + " gwei , and every hour after that that it remains below that level. \nTo change the threshold level for gas price, send me a new subscribe message with the new amount.\n" +
                                    "To unsubscribe, send me another DM **unsubscribe**.");
                            } else {
                                msg.reply(command + " is not a proper integer number.");
                            }
                        } else if (msg.content.toLowerCase().trim() == "aliases") {
                            showAllAliases(true);
                        } else if (msg.content.toLowerCase().trim() == "help") {
                            doFaqHelp();
                        } else if (msg.content.startsWith("help ")) {
                            const args = msg.content.slice("help".length).split(' ');
                            args.shift();
                            const command = args.shift().trim();
                            if (command == "question") {
                                msg.reply("Choose your question with ***question questionNumber***, e.g. ***question 1***\nYou can get the question number via **list** command");
                            } else if (command == "category") {
                                msg.reply("Choose your category with ***category categoryName***, e.g. ***category BONDS***\nCategory name is fetched from **categories** command");
                            } else if (command == "search") {
                                msg.reply("Search for questions with ***search searchTerm***, e.g. ***search bond price***");
                            } else {
                                msg.reply("I don't know that one. Try just **help** for known commands");
                            }
                        } else if (msg.content.toLowerCase().trim() == "list" || msg.content.toLowerCase().trim() == "questions") {
                            listQuestions();
                        } else if (msg.content.toLowerCase().startsWith("question ")) {
                            console.log("question asked:" + msg.content);
                            doQuestion(msg, "question", true);
                        } else if (msg.content.toLowerCase().startsWith("q ")) {
                            console.log("question asked:" + msg.content);
                            doQuestion(msg, "q", true);
                        } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("q")) {
                            const args = msg.content.slice('q'.length);
                            if (!isNaN(args)) {
                                doInnerQuestion(args, true, msg);
                            }
                        } else if (msg.content == "categories") {
                            listCategories();
                        } else if (msg.content.toLowerCase().startsWith("category")) {

                            const args = msg.content.slice("category".length).split(' ');
                            args.shift();
                            const command = args.shift();

                            let rawdata = fs.readFileSync('categories/categories.json');
                            let categories = JSON.parse(rawdata);

                            const exampleEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle('Questions in category ' + command + ':');

                            let found = false;
                            categories.forEach(function (category) {
                                if (category.name == command) {
                                    found = true;
                                    category.questions.forEach(function (question) {
                                        exampleEmbed.addField(question, qaMaps.get(question).description, false);
                                    });
                                }
                            });

                            if (!found) {
                                exampleEmbed.addField('\u200b', "That doesn't look like a known category. Use a category name from **categories** command, e.g. **category BONDS**");
                            } else {
                                exampleEmbed.addField('\u200b', 'Choose your question with e.g. **question 1**');
                            }
                            msg.reply(exampleEmbed);

                        } else if (msg.content.toLowerCase().startsWith("search ")) {

                            const args = msg.content.slice("search".length).split(' ').slice(1);
                            const searchWord = msg.content.substring("search".length + 1);
                            doSearch(searchWord, args);

                        } else if (msg.content.toLowerCase().trim().replace(/ +(?= )/g, '').startsWith("show chart")) {
                            let content = msg.content.toLowerCase().trim().replace(/ +(?= )/g, '');
                            const args = content.slice("show chart".length).split(' ');
                            args.shift();
                            const command = args.shift().trim();
                            doShowChart(command, msg, true);
                        } else {
                            if (!msg.author.username.toLowerCase().includes("faq")) {
                                if (msg.content.endsWith("?")) {
                                    const args = msg.content.substring(0, msg.content.length - 1).split(' ');
                                    const searchWord = msg.content;
                                    doCustomQuestion(searchWord, args);
                                } else {
                                    msg.reply("Oops, I don't know that one. Try **help** to see what I do know, or if you want to ask a custom question, make sure it ends with a question mark **?**");
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                    msg.reply("Unknown error ocurred.  Try **help** to see what I do know, or if you want to ask a custom question, make sure it ends with a question mark **?**");
                }
            }
        }

        function showAllAliases(isDM) {
            let rawdata = fs.readFileSync('categories/aliases.json');
            let aliases = JSON.parse(rawdata);
            let questionMap = new Map();
            aliases.forEach(function (alias) {
                let aliasQuestion = questionMap.get(alias.number);
                if (aliasQuestion) {
                    aliasQuestion.push(alias.alias);
                    questionMap.set(alias.number, aliasQuestion);
                } else {
                    let aliasQuestion = new Array();
                    aliasQuestion.push(alias.alias);
                    questionMap.set(alias.number, aliasQuestion);
                }
            });

            let exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Known aliases')
                .setURL('https://github.com/dgornjakovic/barnbridge-faq');
            exampleEmbed.setDescription('Hello, here are the aliases I know:');

            let counter = 0;
            let pagenumber = 2;
            for (let [questionNumber, questions] of questionMap) {
                let questionsString = "";
                questions.forEach(function (q) {
                    questionsString += (isDM ? "" : "!faq ") + q + "\n";
                })
                let answer = qaMaps.get(questionNumber);
                exampleEmbed.addField(answer.title + ' ' + answer.description, questionsString);

                counter++;
                if (counter == 10) {
                    if (isDM) {
                        msg.reply(exampleEmbed);
                    } else {
                        msg.channel.send(exampleEmbed).then(function (message) {
                            message.react("❌");
                        }).catch(function () {
                            //Something
                        });
                    }
                    exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Known aliases page ' + pagenumber)
                        .setURL('https://github.com/dgornjakovic/barnbridge-faq');
                    exampleEmbed.setDescription('Hello, here are the aliases I know:');
                    pagenumber++;
                    counter = 0;
                }

            }

            if (isDM) {
                msg.reply(exampleEmbed);
            } else {
                msg.channel.send(exampleEmbed).then(function (message) {
                    message.react("❌");
                }).catch(function () {
                    //Something
                });
            }
        }

        function checkAliasMatching(doReply) {
            let potentialAlias = msg.content.toLowerCase().replace("!faq", "").trim();
            let rawdata = fs.readFileSync('categories/aliases.json');
            let aliases = JSON.parse(rawdata);
            let found = false;
            aliases.forEach(function (alias) {
                if (alias.alias.toLowerCase().trim() == potentialAlias) {
                    found = true;
                    msg.content = "!faq question " + alias.number;
                    doQuestion(msg, "!faq question", doReply);
                }
            });
            return found;
        }

        function doFaqHelp() {
            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Barnbridge Frequently Asked Questions')
                .setURL('https://barnbridge.gitbook.io/docs/faq');

            exampleEmbed.setDescription('Hello, here is list of commands I know:');
            exampleEmbed.addField("list", "Lists all known questions");
            exampleEmbed.addField("categories", "Lists all categories of known questions");
            exampleEmbed.addField("category categoryName", "Lists all known questions for a given category name, e.g. ** category *bonds* **");
            exampleEmbed.addField("question questionNumber", "Shows the answer to the question defined by its number, e.g. ** question *7* **");
            exampleEmbed.addField("search searchTerm", "Search all known questions by given search term, e.g. ** search *bond price* **");
            exampleEmbed.addField("aliases", "List all known aliases");
            exampleEmbed.addField("subscribe gas gasPrice",
                "I will inform you the next time safe gas price is below your target gasPrice, e.g. **subscribe gas 30** will inform you if safe gas price is below 30 gwei");
            exampleEmbed.addField("show chart 24H",
                "Shows the BOND chart in the last 24h. Other options are shown in the response (7D, 1M, ....)");
            exampleEmbed.addField("\u200b", "*Or just ask me a question and I will do my best to find a match for you, e.g. **What is the current gas price?***");

            msg.reply(exampleEmbed);
        }

        function listQuestions() {
            let exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Frequently Asked Questions')
                .setURL('https://barnbridge.gitbook.io/docs/faq');

            let counter = 0;
            let pagenumber = 2;
            qaMaps.forEach((value, key) => {
                exampleEmbed.addField(key, value.description, false)
                counter++;
                if (counter == 20) {
                    msg.reply(exampleEmbed);
                    exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Frequently Asked Questions page ' + pagenumber)
                        .setURL('https://barnbridge.gitbook.io/docs/faq');
                    pagenumber++;
                    counter = 0;
                }
            })
            msg.reply(exampleEmbed);
        }

        function listCategories() {
            let rawdata = fs.readFileSync('categories/categories.json');
            let categories = JSON.parse(rawdata);

            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Categories');

            categories.forEach(function (category) {
                exampleEmbed.addField(category.name, category.desc, false);
            });

            exampleEmbed.addField('\u200b', "Choose the category with **category categoryName**, e.g. **category BONDS*");
            msg.reply(exampleEmbed);
        }

        function doSearch(searchWord, args) {
            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Questions found for ***' + searchWord + '***:');

            const Match = class {
                constructor(title, value) {
                    this.title = title;
                    this.value = value;
                }

                matchedCount = 0;
                title;
                value;
            };

            const fullMatches = [];
            const partialMatches = [];
            qaMaps.forEach((value, key) => {
                let res = value.description;
                if (res.includes(searchWord)) {
                    res = replaceString(res, searchWord, '**' + searchWord + '**');
                    fullMatches.push(new Match(file.substring(0, file.lastIndexOf(".")), res));
                } else {
                    let matchedCount = 0;
                    args.sort(function (a, b) {
                        return a.length - b.length;
                    });
                    args.forEach(function (arg) {
                        if (res.toLowerCase().includes(arg.toLowerCase())) {
                            res = replaceString(res, arg, '**' + arg + '**');
                            res = replaceString(res, arg.toLowerCase(), '**' + arg.toLowerCase() + '**');
                            res = replaceString(res, arg.toUpperCase(), '**' + arg.toUpperCase() + '**');
                            matchedCount++;
                        }
                    });
                    if (matchedCount > 0) {
                        let match = new Match(key, res);
                        match.matchedCount = matchedCount;
                        partialMatches.push(match);
                    }
                }
            })


            if (fullMatches.length == 0 && partialMatches.length == 0) {
                exampleEmbed.setTitle('No questions found for ***' + searchWord + '***. Please refine your search.');
            } else {

                let counter = 0;
                fullMatches.forEach(function (match) {
                    counter++;
                    if (counter < 6) {
                        exampleEmbed.addField(match.title, match.value, false);
                    }
                });

                partialMatches.sort(function (a, b) {
                    return b.matchedCount - a.matchedCount;
                });
                partialMatches.forEach(function (match) {
                    counter++;
                    if (counter < 6) {
                        exampleEmbed.addField(match.title, match.value, false);
                    }
                });

                exampleEmbed.addField('\u200b', 'Choose your question with e.g. **question 1**');
            }
            msg.reply(exampleEmbed);

        }

        function doCustomQuestion(searchWord, args) {
            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Looks like you asked a custom question. This is the best I could find for your query:');

            const Match = class {
                constructor(title, value) {
                    this.title = title;
                    this.value = value;
                }

                matchedCount = 0;
                title;
                value;
            };

            const fullMatches = [];
            const partialMatches = [];
            qaMaps.forEach((value, key) => {
                let res = value.description;
                if (res.includes(searchWord)) {
                    res = replaceString(res, searchWord, '**' + searchWord + '**');
                    fullMatches.push(new Match(file.substring(0, file.lastIndexOf(".")), res));
                } else {
                    let matchedCount = 0;
                    args.sort(function (a, b) {
                        return a.length - b.length;
                    });
                    args.forEach(function (arg) {
                        if (res.toLowerCase().includes(arg.toLowerCase())) {
                            res = replaceString(res, arg, '**' + arg + '**');
                            res = replaceString(res, arg.toLowerCase(), '**' + arg.toLowerCase() + '**');
                            res = replaceString(res, arg.toUpperCase(), '**' + arg.toUpperCase() + '**');
                            matchedCount++;
                        }
                    });
                    if (matchedCount > 0) {
                        let match = new Match(key, res);
                        match.matchedCount = matchedCount;
                        partialMatches.push(match);
                    }
                }
            })


            if (fullMatches.length == 0 && partialMatches.length == 0) {
                exampleEmbed.setTitle('No questions found for ***' + searchWord + '***. Please refine your search.');
            } else {

                let counter = 0;
                fullMatches.forEach(function (match) {
                    counter++;
                    if (counter < 6) {
                        exampleEmbed.addField(match.title, match.value, false);
                    }
                });

                partialMatches.sort(function (a, b) {
                    return b.matchedCount - a.matchedCount;
                });
                partialMatches.forEach(function (match) {
                    counter++;
                    if (counter < 6) {
                        exampleEmbed.addField(match.title, match.value, false);
                    }
                });

                exampleEmbed.addField('\u200b', 'Choose your question with e.g. **question 1**');
            }
            msg.reply(exampleEmbed);
        }


        function doQuestion(msg, toSlice, doReply) {
            const args = msg.content.slice(toSlice.length).split(' ');
            args.shift();
            const command = args.shift();
            doInnerQuestion(command, doReply, msg);
        }

    }
)


setInterval(function () {
    https.get('https://api.coingecko.com/api/v3/coins/barnbridge', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            try {
                let result = JSON.parse(data);

                coingeckoUsd = result.market_data.current_price.usd;
                coingeckoEth = result.market_data.current_price.eth;
                coingeckoEth = Math.round(((coingeckoEth * 1.0) + Number.EPSILON) * 1000) / 1000;
                coingeckoBtc = result.market_data.current_price.btc;
                coingeckoBtc = Math.round(((coingeckoBtc * 1.0) + Number.EPSILON) * 1000000) / 1000000;
                bondMarketCap = result.market_data.market_cap.usd;
            } catch (e) {
                console.log(e);
            }

        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

}, 20 * 1000);

setInterval(function () {
    try {
        https.get('https://www.gasnow.org/api/v3/gas/price', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    let result = JSON.parse(data);
                    gasPrice = result.data.standard / 1000000000;
                    fastGasPrice = result.data.fast / 1000000000;
                    lowGasPrice = result.data.slow / 1000000000;
                    instantGasPrice = result.data.rapid / 1000000000;
                    gasPrice = Math.round(((gasPrice * 1.0) + Number.EPSILON) * 10) / 10;
                    fastGasPrice = Math.round(((fastGasPrice * 1.0) + Number.EPSILON) * 10) / 10;
                    lowGasPrice = Math.round(((lowGasPrice * 1.0) + Number.EPSILON) * 10) / 10;
                    instantGasPrice = Math.round(((instantGasPrice * 1.0) + Number.EPSILON) * 10) / 10;
                } catch (e) {
                    console.log(e);
                }
            });
        });
    } catch (e) {
        console.log(e);
    }

}, 30 * 1000);


function handleGasSubscription() {
    //https://www.gasnow.org/api/v3/gas/price
    //https://www.gasnow.org/api/v3/gas/price
    try {

        gasSubscribersMap.forEach(function (value, key) {
            try {
                if ((gasPrice * 1.0) < (value * 1.0)) {
                    if (gasSubscribersLastPushMap.has(key)) {
                        var curDate = new Date();
                        var lastNotification = new Date(gasSubscribersLastPushMap.get(key));
                        var hours = Math.abs(curDate - lastNotification) / 36e5;
                        if (hours > 1) {
                            if (client.users.cache.get(key)) {
                                client.users.cache.get(key).send('gas price is now below your threshold. Current safe gas price is: ' + gasPrice);
                                gasSubscribersLastPushMap.set(key, new Date().getTime());
                                if (process.env.REDIS_URL) {
                                    redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                    });
                                    redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                    });
                                }
                            } else {
                                console.log("User:" + key + " is no longer in this server");
                                gasSubscribersLastPushMap.delete(key);
                                gasSubscribersMap.delete(key);
                                if (process.env.REDIS_URL) {
                                    redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                    });
                                    redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                    });
                                }
                            }
                        }
                    } else {
                        if (client.users.cache.get(key)) {
                            client.users.cache.get(key).send('gas price is now below your threshold. Current safe gas price is: ' + gasPrice);
                            gasSubscribersLastPushMap.set(key, new Date());
                            if (process.env.REDIS_URL) {
                                redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                });
                                redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                });
                            }
                        } else {
                            console.log("User:" + key + " is no longer in this server");
                            gasSubscribersLastPushMap.delete(key);
                            gasSubscribersMap.delete(key);
                            if (process.env.REDIS_URL) {
                                redisClient.set("gasSubscribersMap", JSON.stringify([...gasSubscribersMap]), function () {
                                });
                                redisClient.set("gasSubscribersLastPushMap", JSON.stringify([...gasSubscribersLastPushMap]), function () {
                                });
                            }
                        }
                    }
                } else {
                    //console.log("Not sending a gas notification for: " + key + " because " + value + " is below gas " + gasPrice);
                }
            } catch (e) {
                console.log("Error occured when going through subscriptions for key: " + key + "and value " + value + " " + e);
            }
        });
    } catch (e) {
        console.log(e);
    }

}


function getNumberLabel(labelValue) {

    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9

        ? Math.round(Math.abs(Number(labelValue)) / 1.0e+9) + "B"
        // Six Zeroes for Millions
        : Math.abs(Number(labelValue)) >= 1.0e+6

            ? Math.round(Math.abs(Number(labelValue)) / 1.0e+6) + "M"
            // Three Zeroes for Thousands
            : Math.abs(Number(labelValue)) >= 1.0e+3

                ? Math.round(Math.abs(Number(labelValue)) / 1.0e+3) + "K"

                : Math.abs(Number(labelValue));

}


function doShowChart(type, msg, fromDM) {
    try {
        const exampleEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(type + ' BOND price chart');
        exampleEmbed.addField("Possible options:", "realtime, 24H, 7D, 1M, 3M, 6M, YTD, 1Y, ALL");
        exampleEmbed.attachFiles(['charts/chart' + type.toLowerCase() + '.png'])
            .setImage('attachment://' + 'chart' + type.toLowerCase() + '.png');
        if (fromDM) {
            msg.reply(exampleEmbed);
        } else {
            msg.channel.send(exampleEmbed).then(function (message) {
                message.react("❌");
            }).catch(function () {
                //Something
            });
        }
    } catch (e) {
        console.log("Exception happened when showing the chart");
        console.log(e);
    }
}

const puppeteer = require('puppeteer');

async function getChart(type) {
    try {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        const page = await browser.newPage();
        await page.setViewport({width: 1000, height: 926});
        await page.goto("https://coincodex.com/crypto/bond/?period=" + type, {waitUntil: 'networkidle2'});
        await page.waitForSelector('.chart');

        const rect = await page.evaluate(() => {
            const element = document.querySelector('.chart');
            const {x, y, width, height} = element.getBoundingClientRect();
            return {left: x, top: y, width, height, id: element.id};
        });

        await page.screenshot({
            path: 'charts/chart' + type.toLowerCase() + '.png',
            clip: {
                x: rect.left - 0,
                y: rect.top - 0,
                width: rect.width + 0 * 2,
                height: rect.height + 0 * 2
            }
        });
        browser.close();
    } catch (e) {
        console.log("Error happened on getting chart.");
        console.log(e);
    }
}


setInterval(function () {
    try {
        handleGasSubscription();
    } catch (e) {
        console.log(e);
    }
}, 60 * 1000);


setInterval(function () {
    https.get('https://api.coingecko.com/api/v3/coins/bitcoin', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            try {
                let result = JSON.parse(data);
                btcPrice = result.market_data.current_price.usd;
                btcPrice = Math.round(((btcPrice * 1.0) + Number.EPSILON) * 100) / 100;
                btcMarketCap = result.market_data.market_cap.usd;
            } catch (e) {
                console.log(e);
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

}, 50 * 1000);


setInterval(function () {

    clientBtcPrice.guilds.cache.forEach(function (value, key) {
        try {
            value.members.cache.get("768970849549156392").setNickname("$" + btcPrice);
            value.members.cache.get("768970849549156392").user.setActivity("marketcap=$" + getNumberLabel(btcMarketCap), {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 45 * 1000);


setInterval(function () {

    clientEpoch.guilds.cache.forEach(function (value, key) {
        try {

            var today = new Date();
            while (today > payday) {
                payday.setDate(payday.getDate() + 7);
            }
            var difference = payday.getTime() - today.getTime();
            var seconds = Math.floor(difference / 1000);
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            var days = Math.floor(hours / 24);
            hours %= 24;
            minutes %= 60;
            seconds %= 60;

            value.members.cache.get("772028195264266240").setNickname("TVL=$" + getNumberLabel(tvl));
            value.members.cache.get("772028195264266240").user.setActivity(days + " days " + hours + " hours " + minutes + " minutes ", {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 30 * 1000);

setInterval(function () {

    clientApy.guilds.cache.forEach(function (value, key) {
        try {

            value.members.cache.get("774419786935173140").setNickname("APR");
            value.members.cache.get("774419786935173140").user.setActivity("USDC/BOND=" + bondApy
                + ", DAO=" + daoBondAPR, {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 60 * 1000);


setInterval(function () {

    clientBondPrice.guilds.cache.forEach(function (value, key) {
        try {
            value.members.cache.get("768970504735817750").setNickname("$" + coingeckoUsd);
            value.members.cache.get("768970504735817750").user.setActivity("Ξ" + coingeckoEth + ' ₿' + coingeckoBtc, {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 30 * 1000);


var payday = new Date('2020-10-19 00:00');
var bondbetpayday = new Date('2021-02-07 22:20');

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function getAPY() {
    try {
        console.log("Fetching APY");
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        const page = await browser.newPage();
        await page.setViewport({width: 1000, height: 926});
        await page.goto("https://app.barnbridge.com/yield-farming", {waitUntil: 'networkidle2'});
        await delay(5000);

        var prices = await page.evaluate(() => {
            var div = document.querySelectorAll('.s_p1__2yd3a');

            var prices = []
            div.forEach(element => {
                prices.push(element.textContent);
            });

            return prices
        })

        bondApy = prices[10].replace(/,/g, '').replace(/\%/g, '') * 1.0;
        bondApy = bondApy + "%";
        browser.close()
    } catch (e) {
        console.log("Error happened on getting data from barnbridge.");
        console.log(e);
    }
}

setInterval(getAPY, 1000 * 30);

let bondStakingApy = 20;
setInterval(function () {
    try {
        https.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0391d2021f89dc339f60fff84546ea23e337750f&address=0xb0fa2beee3cf36a7ac7e99b885b48538ab364853&tag=latest', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    let result = JSON.parse(data);
                    var results = result.result / 1000000000000000000;
                    bondStakingApy = 52 * 5000 * 100 / results;
                    bondStakingApy = Math.round(((bondStakingApy * 1.0) + Number.EPSILON) * 100) / 100 + '%';
                } catch (e) {
                    console.log(e);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } catch (e) {
        console.log(e);
    }
}, 50 * 1000);


let cSupply = 869164.76;
setInterval(function () {
    try {
        https.get('https://tokenapi.barnbridge.com/circulating-supply', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    let result = JSON.parse(data) * 1.0;
                    cSupply = result.toFixed(2);
                } catch (e) {
                    console.log(e);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } catch (e) {
        console.log(e);
    }
}, 50 * 1000);


setInterval(function () {

    clientBondSupply.guilds.cache.forEach(function (value, key) {
        try {
            value.members.cache.get("798924765728342047").setNickname("Circulating Supply");
            value.members.cache.get("798924765728342047").user.setActivity(numberWithCommas(cSupply) + " $BOND", {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 30 * 1000);

setInterval(function () {

    clientBondCap.guilds.cache.forEach(function (value, key) {
        try {
            value.members.cache.get("804654823030128660").setNickname("Market Cap");
            value.members.cache.get("804654823030128660").user.setActivity("$" + numberWithCommas(bondMarketCap), {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 30 * 1000);

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

client.login(process.env.BOT_TOKEN);


let lockedBondBet = 3714;
setInterval(function () {
    try {
        https.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0391d2021f89dc339f60fff84546ea23e337750f&address=0xeA7EaEcBff99cE2412E794437325F3BD225EE78F&tag=latest', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    let result = JSON.parse(data).result / 1e18;
                    if (!isNaN(result)) {
                        lockedBondBet = result.toFixed(2);
                    }
                } catch (e) {
                    console.log(e);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } catch (e) {
        console.log(e);
    }
}, 150 * 1000);


setInterval(function () {

    clientBetAPY.guilds.cache.forEach(function (value, key) {
        try {

            var today = new Date();
            while (today > bondbetpayday) {
                bondbetpayday.setDate(bondbetpayday.getDate() + 7);
            }
            var difference = bondbetpayday.getTime() - today.getTime();
            var seconds = Math.floor(difference / 1000);
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            var days = Math.floor(hours / 24);
            hours %= 24;
            minutes %= 60;
            seconds %= 60;

            value.members.cache.get("806453685495529512").setNickname("Bond.Bet");
            value.members.cache.get("806453685495529512").user.setActivity(days + "D:" + hours + "H:" + minutes + "M deposited=" + lockedBondBet + " $BOND", {type: 'PLAYING'});
        } catch (e) {
            console.log(e);
        }
    });

}, 30 * 1000);


setInterval(function () {
    try {
        https.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0391d2021f89dc339f60fff84546ea23e337750f&address=0x10e138877df69Ca44Fdc68655f86c88CDe142D7F&tag=latest', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    let result = JSON.parse(data).result / 1e18;
                    if (!isNaN(result)) {
                        daoBond = result.toFixed(2);
                        daoBondAPR = 1742.86 * 365 * 100 / daoBond;
                        daoBondAPR = daoBondAPR.toFixed(2) + "%";
                    }
                } catch (e) {
                    console.log(e);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } catch (e) {
        console.log(e);
    }
}, 80 * 1000);


function doSYAPY() {
    try {
        https.get('https://api.barnbridge.com/api/smartyield/pools', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    tvl = 0;
                    let r = JSON.parse(data).data;
                    var increment = 120 / (r.length);
                    var counter = 1;
                    for (var c in r) {
                        let result = r[c];
                        let juniorApy = result.state.juniorApy * 100.0;
                        juniorApy = juniorApy.toFixed(2);
                        let seniorApy = result.state.seniorApy * 100.0;
                        seniorApy = seniorApy.toFixed(2);
                        tvl += (result.state.seniorLiquidity * 1.0);
                        tvl += (result.state.juniorLiquidity * 1.0);
                        let lockedinpool = result.state.juniorLiquidity * 1.0;
                        let dailyReward = 1428.5714 * coingeckoUsd;
                        let additionalApy = dailyReward * 365 / lockedinpool * 101;
                        additionalApy = additionalApy.toFixed(2);
                        setTimeout(function () {
                            clientBotTokenSy.guilds.cache.forEach(function (value, key) {
                                value.members.cache.get("828030565945049088").setNickname("Compound SY APY");
                                let symbol = result.underlyingSymbol;
                                let additionalApyText = " (+" + additionalApy + " %)";
                                additionalApyText = symbol.toLowerCase().includes("usdc") ? additionalApyText : "";
                                value.members.cache.get("828030565945049088")
                                    .user.setActivity(
                                    symbol + " Senior APY = " + seniorApy + "%  " + symbol + " Junior APY = " + juniorApy + "%" + additionalApyText, {type: 'PLAYING'});
                            });
                        }, increment * counter * 1000);
                        counter++;
                    }
                    tvl = tvl.toFixed(2);
                } catch (e) {
                    console.log(e);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } catch (e) {
        console.log(e);
    }
}

setInterval(function () {
    doSYAPY();
}, 1000 * 120);

setTimeout(function () {
    doSYAPY();
}, 1000 * 10);

clientBotTokenTX.once('ready', () => {
    console("on start tx");
    getPoolTransactions();
});


setInterval(function () {
    try {
        console.log("starting pool transactions")
        getPoolTransactions();
    } catch (e) {
        console.log(e);
    }
}, 60 * 10 * 1000);

async function getPoolTransactions() {
    for (const poolAddress of poolAddresses.keys()) {
        redisClient.llen(barnbridgeTransactionHashKey, function (err, listSize) {
            console.log("key is " + poolAddress + " size of redis is" + listSize);
        });
        axios.get('https://api.barnbridge.com/api/smartyield/pools/' +
            poolAddress
            + '/transactions?limit=10000&page=1&transactionType=all'
        )
            .then(function (response) {
                console.log("i got the data");
                if (response.data.data) {
                    response.data.data.forEach(function (transaction) {
                        redisClient.lrange(barnbridgeTransactionHashKey, 0, -1, function (err, transactionHashArray) {
                            if (!transactionHashArray.includes(transaction.transactionHash)) {
                                console.log("found new transaction" + transaction.transactionHash);
                                clientBotTokenTX.guilds.cache.forEach(function (guildValue, key) {
                                    const channel = guildValue.channels.cache.find(channel => channel.name.toLowerCase().includes('tx-alerts'));
                                    if (channel) {
                                        var message = new Discord.MessageEmbed()
                                            .addFields(
                                                {
                                                    name: ':lock: New SMART Yield Transaction :lock:',
                                                    value: "\u200b"
                                                },
                                                {
                                                    name: ':link: URL:',
                                                    value: "[" + transaction.transactionHash + "](https://etherscan.io/tx/" + transaction.transactionHash + ")"
                                                },
                                                {
                                                    name: ':coin: Token:',
                                                    value: poolAddresses.get(poolAddress)
                                                },
                                                {
                                                    name: ':arrows_counterclockwise: Transaction Type:',
                                                    value: transaction.transactionType
                                                },
                                                {
                                                    name: ':dollar: Amount:',
                                                    value: getNumberLabel(transaction.amount)
                                                },
                                                {
                                                    name: ':alarm_clock: Block Timestamp:',
                                                    value: new Date(transaction.blockTimestamp * 1000)
                                                }
                                            )
                                            .setColor("#0037ff")
                                        channel.send(message);
                                    }
                                });
                                redisClient.lpush(barnbridgeTransactionHashKey, transaction.transactionHash);

                            }
                        });
                    });
                }
            })
            .catch(function (error) {
                console.log('error in transactions ' + error);
            });
    }
}

