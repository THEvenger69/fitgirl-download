import puppeteer from "puppeteer";
import promptSync from 'prompt-sync';


async function downloads(link, browser, compteur, length) {
    const page = await browser.newPage();
    await page.goto(link, { waitUntil: "domcontentloaded", timeout: 0 });

    try {
        await page.evaluate(() => {
            download(); // uniquement code navigateur ici
        });

        process.stdout.write('\x1b[1A');
        console.log(`\x1b[36m download ${compteur}/${length} started !\x1b[0m`);

    } catch (err) {
        console.log(`\x1b[31m error while downloading file ${compteur}/${length}, try manually : ${link} \x1b[0m`);
    }

    await page.close();
}

async function findLinks(page, url){

    await page.goto(url, { waitUntil: "networkidle2" });
    const liens = await page.evaluate(() => {
        const results = [];
        console.log("test")
        document.querySelectorAll("li").forEach(el => {
            console.log("el :" + el)
            const link = el.querySelector("a");
            try {
                if (link.href.slice(-3) === "rar") {
                    results.push(link.href);
                }
            } catch {
            }
        });
        return results
    });
    return liens
};
function interfaceLoad(cyan, green, yellow, red, white, reset) {
    console.clear();

    // ASCII TITLE
    console.log(cyan + `
    ╔══════════════════════════════════════════════╗
    ║               FIT-GIRL API                   ║
    ╚══════════════════════════════════════════════╝
    ` + reset);

    // Infos
    console.log(`${white}Developer:${reset} THEvenger`);
    console.log(`${white}Version:${reset} 1.0.0`);
    console.log(`${white}Database:${reset} ${green}Scraper + Archive${reset}`);
    console.log("");

    // Menu box
    console.log(cyan + `
    +──────────────────────────────────────────────+
    |                  MAIN MENU                   |
    +──────────────────────────────────────────────+
    ` + reset);

    console.log("");
}

function createUrl(name) {
    const listWords = name.split(" ");
    let game = ""
    let i = 0;
    for (const word of listWords) {
        if (i==0){
            game = word;
            i=2
        } else {
            game = game + "+" + word;
        }
    }
    return `https://fitgirl-repacks.site/?s=${game}`
}

async function choiceGame(URL, page) {
    await page.goto(URL, { waitUntil: "networkidle2" });
    const jeux = await page.evaluate(() => {
        const result = [];
        const elements = document.querySelectorAll("article").forEach(el => {
            const element = el.querySelectorAll("a").forEach(balise => {
                console.log(balise);
                if (balise.rel === "bookmark" && !balise.textContent.includes("/")) {
                    result.push({name : balise.textContent, link : balise.href})
            }
            })
        })
        return result
    })
    return jeux
}

async function gotoDownloadUrl(url2, page) {
    await page.goto(url2, { waitUntil: "networkidle2" });
    const url = await page.evaluate(() => {
        var result = "";
        const elements = document.querySelectorAll("a").forEach(el => {
            if (el.href.includes("paste.fitgirl-repacks") && el.textContent.includes("FuckingFast")) {
                console.log(el.href);
                result = el.href;
            }
        })
        return result
    })
    return url
}

async function main() {
    const cyan = "\x1b[36m";
    const green = "\x1b[32m";
    const yellow = "\x1b[33m";
    const red = "\x1b[31m";
    const white = "\x1b[37m";
    const reset = "\x1b[0m";

    const browser = await puppeteer.launch({ 
        headless: true, 
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]});
    const context = await browser.createBrowserContext()
    const page = await context.newPage();
    const prompt = promptSync();
    interfaceLoad(cyan, green, yellow, red, white, reset)
    const game = prompt("Game's name : ");
    const gameUrl = createUrl(game);
    const choices = await choiceGame(gameUrl, page);
    if (choices.length === 0) {
        console.log("No results ! Please verify the name you enter !");
    } else {
        console.clear();
        console.log(`${yellow}${choices.length}${reset} results !`);
        console.log("");
        let i = 1;
        let urls = []
        for (const el of choices) {
            console.log(`${i}. ${el.name}`);
            urls.push(el.link);
            i++;
        }
        console.log("");
        const gameFinal = prompt(`${red}Enter the number of the game ${yellow}(1-${choices.length})${reset} ${red}:${reset} `) -1;
        const downloadUrl = await gotoDownloadUrl(urls[gameFinal], page);   
        const liens = await findLinks(page, downloadUrl);
        console.clear();
        console.log(`${green} Download started !!${reset}`)
        let j = 1;
        let lenghtFiles = liens.length;
        console.log("");
        console.log("")
        for (const link of liens) {
            await downloads(link, browser, j, lenghtFiles);
            j++;
        }
    }
}

while (true) {
    await main();
}
