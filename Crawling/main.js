
// This crawler checks if a page is a book product (listing) page. (physical books only)
// If so, scrape data and get links on page, and recurse.


const cheerio = require("cheerio");
const {ProxyCrawlAPI} = require('proxycrawl');      //bypass Amazon's bot detection
const api = new ProxyCrawlAPI({token: 'HIfghI46G91CCuU5S12Log'});
const fs = require("fs");
const phantomFunction = require("./phantom.js");


var queue = [];
var scrapedURLs = [];
var dataArray = [];


// gets all relative links that are associated with images. these links have a good chance to lead to books.
function getLinks($) {
    $("a[href^='/']").has("img").each((i, e) => {
        queue.push($(e).attr("href"));
    });
}


function scrapeBook($) {
    let data = {};

    data.id = dataArray.length;

    data.name = $("#productTitle").text();

    data.newPrice = Number($("#buyNewSection").find(".offer-price").text().replace(/[^0-9.-]+/g, ""));

    // how to get the full description inside the iframe? async problem?
    // data.description = $("#bookDesc_iframe").contents().text();     ??

    data.description = $("meta[name='description']").attr("content");

    data.dimensions = $("#productDetailsTable").find("b:contains('Dimensions')").parent().contents().not("b").text().trim();

    data.imageURLs = [];        // need page interaction to get full images (more phantom?)
    $(".imageThumb").each((i, e) => {
        data.imageURLs.push($(e).find("img").attr("src"))
    });

    data.weight = $("#productDetailsTable").find("b:contains('Weight')").parent().contents().not("b").not("a").text().replace('()', '').trim();

    dataArray.push(data);
}


function crawl() {

    let queue0 = queue[0];      //for faster results, set this to around queue[40]. book links are near the bottom of the starting page
    console.log(queue0);

    if(scrapedURLs.includes(queue0)) {    //if already scraped, go next
        queue.shift();
        crawl();
        return;
    }

    api.get('https://www.amazon.com' + queue0).then(response => {
        const $ = cheerio.load(response.body);

        // only crawl book product pages because they usually have links to other books 
        // such as the "Customers who bought this item also bought" section
        // this should prevent the crawler from crawling off to the abyss
        if($("#productDetailsTable:contains('ISBN-')").length) {    // this is a book product page (the '-' excludes kindle books)
            scrapeBook($);
            getLinks($);
            scrapedURLs.push(queue0);
            console.log("FOUND BOOK!!! queue.length: ", queue.length);

            if(scrapedURLs.length >= 10) {       //finished crawl
                fs.writeFile("./data.json", JSON.stringify(dataArray, null, 4), (err) => {if(err) throw err});
                return;
            }
        }

        queue.shift();
        crawl();

    }).catch(err => {
        console.log("ERROR!!!!!!!", err)    //sometimes request times out
        queue.shift();
        crawl();
    });

};


(async () => {
    let mainBooksURL = await phantomFunction();
    console.log("starting point:", mainBooksURL);
    let response = await api.get(mainBooksURL);
    getLinks(cheerio.load(response.body));
    crawl();
    // console.log(queue);
    
})();

