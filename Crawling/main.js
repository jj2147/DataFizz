
/*
algorithm

find the link for books section homepage. (how?)
grab all relative links that have images, store in queue.
iterate queue:
    if link is book product page and hasn't already been scraped, scrape & save data, grab links on page & add to queue.
    if not book product page, do nothing.
continue until desired number of books


only crawl links that have images on book product pages to maximize the chance of the link being another book product page.
mainly going for the "Customers who bought this item also bought" links
*/


const cheerio = require("cheerio");
const { ProxyCrawlAPI } = require('proxycrawl');
const api = new ProxyCrawlAPI({ token: 'HIfghI46G91CCuU5S12Log' });
const fs = require("fs");

var queue = [];
var dataArray = [];
var scrapedURLs = [];


function getLinks($) {
    $("a").has("img").each((i, e) => {
        // if <a> has href and href is relative
        if ($(e).attr("href") && $(e).attr("href").charAt(0) === "/")
            queue.push($(e).attr("href"))
    });
}

function scrapeBook($) {

    let data = {};

    data.name = $("#productTitle").text();

    data.newPrice = $("#buyNewSection").find(".offer-price").text();

    // How do you get inside an iframe?
    // data.description = $("#bookDesc_iframe").contents().text();

    data.dimensions = $("#productDetailsTable").find("b:contains('Dimensions')").parent().contents().not("b").text().trim();

    data.imageURLs = [];
    $(".imageThumb").each((i, e) => {
        data.imageURLs.push($(e).find("img").attr("src"))
    });

    data.weight = $("#productDetailsTable").find("b:contains('Weight')").parent().contents().not("b").not("a").text().replace('()', '').trim();

    dataArray.push(data);
}


var crawl = () => {

    // console.log(queue[0]);
    console.log(queue[0]);

    api.get('https://www.amazon.com' + queue[0]).then(response => {

        const $ = cheerio.load(response.body);

        // console.log($("#productDetailsTable:contains('ISBN')").length);

        // if this is a book product page (if product details contains ISBN) and it hasn't already been scraped
        if (!scrapedURLs.includes(queue[0]) && $("#productDetailsTable:contains('ISBN')").length) {
            // scrapeBook($);
            // getLinks($);
            // scrapedURLs.push(queue[0]);
            // console.log(dataArray);
            console.log("boooooooooooooooooooooooooook");            
            console.log($("title").text());


        }

        queue.shift();
        if (queue.length > 50) crawl();
    }).catch(e => console.log(e));
};

api.get('https://www.amazon.com/gp/browse.html?node=283155').then(response => {

    getLinks(cheerio.load(response.body));

    console.log(queue.length);

    crawl();
});

    // fs.writeFile("./data.json", JSON.stringify(data, null, 4), (err) => {
    //     if(err){
    //         console.error(err);
    //         return;
    //     };
    //     console.log("File has been created");
    // });

