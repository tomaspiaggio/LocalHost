const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export async function luma(city: string): Promise<{title: string, description: string, events: string} | undefined> {
    try {
        const parsed = city.toLowerCase().replaceAll(" ", "+")
        const rawResponse = await fetch(`https://api.lu.ma/search/get-results?query=${parsed}`, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "x-luma-client-type": "luma-web",
                "x-luma-previous-path": "/sd",
                "x-luma-web-url": "https://lu.ma/buenos-aires",
                "cookie": process.env.LUMA_COOKIE,
                "Referer": "https://lu.ma/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        })
        const response = await rawResponse.json()

        if (response.discover_entities == null || response.discover_entities.length === 0) return

        const eventsPage = `https://lu.ma/${response.discover_entities[0].slug}`
        const rawDomResponse = await fetch(eventsPage)
        const domResponse = await rawDomResponse.text()
        const dom = new JSDOM(domResponse)
        const title = (dom.window.document.querySelector("h1") as HTMLHeadingElement).textContent
        const description = (dom.window.document.querySelector(".desc") as HTMLDivElement).textContent
        const events = (dom.window.document.querySelector(".timeline") as HTMLDivElement).textContent?.trim()

        return {title, description, events}
    } catch (err) {
        console.error(err)
    }
}