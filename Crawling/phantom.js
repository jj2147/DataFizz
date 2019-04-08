
// A very contrived method to navigate from amazon's homepage to the main books page.


const phantom = require('phantom');

async function amazon() {
    const instance = await phantom.create();

    const page = await instance.createPage();

    const requestArr = [];

    await page.open('https://www.amazon.com/');

    await page.includeJs("https://code.jquery.com/jquery-3.3.1.slim.min.js");

    await page.on('onResourceRequested', function(requestData) {
        requestArr.push(requestData.url);
    });

    await page.evaluate(function() {
        $("#twotabsearchtextbox").val("books");     // put "books" in search box
        $("form.nav-searchbar").submit();           // submit search box
    });         //alternatively, select 'Books' from the dropdown and submit the search box

    await instance.exit();

    return requestArr[requestArr.length - 1];   // the last element would be the request from the search box
}

module.exports = amazon;    //exporting the returned URL causes async issues


