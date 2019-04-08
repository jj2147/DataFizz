

// object oriented version. I tried.


const cheerio = require("cheerio");
const {ProxyCrawlAPI} = require('proxycrawl');
const api = new ProxyCrawlAPI({token: 'HIfghI46G91CCuU5S12Log'});
const fs = require("fs");


class Crawler {
    constructor(domain, startingURL, numberToScrape, crawlCondition, getLinks, scrapeBook) {
        this.domain = domain;
        this.startingURL = startingURL;
        this.crawlCondition = crawlCondition;
        this.getLinks = getLinks;
        this.scrapeBook = scrapeBook;
        this.numberToScrape = numberToScrape;
        this.queue = [];
        this.scrapedURLs = [];
        this.dataArray = [];
    }


    crawl(){
        let queue0 = this.queue[0];
        console.log(queue0);

        if(this.scrapedURLs.includes(queue0)) {
            this.queue.shift();
            this.crawl();
            return;
        }

        api.get(this.domain + queue0).then(response => {
            const $ = cheerio.load(response.body);

            if(this.crawlCondition($)) {
                this.dataArray.push(this.scrapeBook($, this.dataArray.length));
                this.queue.push(...this.getLinks($));        // spread!
                this.scrapedURLs.push(queue0);
                console.log("FOUND BOOK!!! queue.length: ", this.queue.length);

                if(this.scrapedURLs.length >= this.numberToScrape) {
                    fs.writeFile("./OOdata.json", JSON.stringify(this.dataArray, null, 4), (err) => {if(err) throw err});
                    return;
                }
            }

            this.queue.shift();
            this.crawl();

        }).catch(err => {
            console.log("ERROR!!!!!!!", err)
            this.queue.shift();
            this.crawl();
        });
    }


    start (){
        api.get(this.startingURL).then(response => {
            this.queue.push(...this.getLinks(cheerio.load(response.body)));
            this.crawl();
            // console.log(this.queue);                    
        });
    }

}



var bookCrawler = new Crawler(
    "https://www.amazon.com",
    "https://www.amazon.com/Becoming-Michelle-Obama/dp/1524763136/ref=tmm_hrd_swatch_0?_encoding=UTF8&qid=&sr=",
    4,
    ($) => $("#productDetailsTable:contains('ISBN-')").length,
    ($) => {
        let queue = [];
        $("a[href^='/'].a-link-normal").has("img").each((i, e) => {
            queue.push($(e).attr("href"));
        });
        return queue;
    },
    ($, id) => {
        let data = {};
        data.id = id;
        data.name = $("#productTitle").text();
        data.newPrice = Number($("#buyNewSection").find(".offer-price").text().replace(/[^0-9.-]+/g, ""));
        data.description = $("meta[name='description']").attr("content");
        data.dimensions = $("#productDetailsTable").find("b:contains('Dimensions')").parent().contents().not("b").text().trim();
        data.imageURLs = [];
        $(".imageThumb").each((i, e) => {
            data.imageURLs.push($(e).find("img").attr("src"))
        });
        data.weight = $("#productDetailsTable").find("b:contains('Weight')").parent().contents().not("b").not("a").text().replace('()', '').trim();
        return data;
    },
);


bookCrawler.start();




