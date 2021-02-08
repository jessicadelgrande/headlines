"use strict";

import { guardianKey, newsApiKey, nytimesKey } from "./keys.js";

const guardianUrl = `https://content.guardianapis.com/search?api-key=${guardianKey}&format=json&show-fields=thumbnail,lastModified,body,trailText&page-size=20`;
const newsApiUrl = `https://accesscontrolalloworiginall.herokuapp.com/http://newsapi.org/v2/top-headlines?apiKey=${newsApiKey}&country=us&sortBy=publishedAt`;
const nytimesUrl = `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${nytimesKey}`;

const popUp = document.getElementById("popUp");
const articleList = document.getElementsByClassName("article");

// loads default allResults feed
// captures user data selection from source menu
// calls appropriate fetch function based on user selection
// returns user to top of page
const displaySelection = () => {
    allResults();
    const currentSource = document.getElementById("currentNewsSource");
    currentSource.innerHTML = "All Sources";
    const selectContainer = document.getElementById("selectContainer");
    const newsSource = document.getElementsByClassName("newsSource");

    // open & close dropdown menu - managing for touchscreens
    const outerDropdownContainerItem = document.querySelector(".outerDropdownContainer li");
    const outerDropdownContainer = document.querySelector(".outerDropdownContainer");
    outerDropdownContainerItem.addEventListener("click", (e) => {
        e.preventDefault();
        outerDropdownContainer.classList.toggle("open");
    });

    const filterSourceLoop = (whereFrom) => {
        for (let i = 0; i < articleList.length; i++) {
            if (!newsSource[i].innerHTML.includes(whereFrom)) {
                articleList[i].style.display="none";
            } else {
                articleList[i].style.display="grid";
            }
        } 
    }

    selectContainer.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.target.matches("#allSources")) {
            filterSourceLoop("");
        } else if (e.target.matches("#guardianSelect")) {
            filterSourceLoop("The Guardian");
        } else if (e.target.matches("#newsApiSelect")) {
            filterSourceLoop("NewsAPI");
        } else if (e.target.matches("#nytSelect")) {
            filterSourceLoop("The New York Times");
        } else {
            console.log("something's gone wrong when trying to display the selection");
        }
        window.scrollTo(0, 0);
        const textNode = document.createTextNode(e.target.textContent);
        currentSource.replaceChild(textNode, currentSource.childNodes[0]);
    }, false);
}

// puts html on the screen
// displayData is called within each fetch function and passes in required parameters
// displayPopUpData is defined and called here - function populates and shows summary popUp window, disables scroll when popUp is open
const displayData = (thumb, description, fullLink, title, section, dateTime, newsSource) => {
    const article = document.createElement("article");
    article.className = "article";
    article.innerHTML = `
        <section class="featuredImage">
            <img id="thumbnail" src="${thumb}" />
        </section>
        <section class="articleContent">
            <h6>${section}</h6>
            <a href="#" class="articleTitle"><h3>${title}</h3></a>
        </section>
        <section class="newsSource">
            ${newsSource}
        </section>
        <section class="dateTime">
            ${dateTime}
        </section>
        <div class="clearfix"></div>
    `;
    document.getElementById("main").appendChild(article);

    const clickableTitle = article.querySelector(".articleTitle");
    const displayPopUpData = () => {
        const popUpContainer = document.createElement("div");
        popUpContainer.className = "container";
        popUpContainer.id = "popUpContainer";
        popUpContainer.innerHTML = `
            <h1>${title}</h1>
            <p>
                ${description}
            </p>
            <a href="${fullLink}" class="popUpAction" target="_blank">Read more from ${newsSource}</a>
        `;
        document.getElementById("popUp").appendChild(popUpContainer);
        document.getElementsByTagName("body")[0].style = "overflow: hidden";
    }
    clickableTitle.addEventListener("click", displayPopUpData);
}

// gather and concat the API data
const allResults = async () => {
    const tempGuardianResults = await fetchGuardianData();
    const tempNewsApiResults = await fetchNewsApiData();
    const tempNytResults = await fetchNytData();
    const standardizedResults = tempGuardianResults.concat(tempNewsApiResults, tempNytResults);
    // sort in descending date order (newest articles on top)
    standardizedResults.sort((a, b) => {
        return new Date(b.dateTime) - new Date(a.dateTime);
    });

    standardizedResults.forEach((article) => {
        displayData(
            article.thumb,
            article.description,
            article.fullLink,
            article.title,
            article.section,
            article.dateTime,
            article.newsSource
        );
    });


    popUp.classList.add("hidden"); 
    showArticlePopUp();  
}

// fetch data from The New York Times API
const fetchNytData = async () => {
    try {
        const rawResponse = await fetch(nytimesUrl);
        const jsonResponse = await rawResponse.json();
        const nytResults = jsonResponse.results;
        const mappedNytResults = nytResults.map((result) => {
            const thumb = result.multimedia[2].url;
            const description = result.abstract;
            const fullLink = result.url;
            const title = result.title;
            const section = result.section.toUpperCase();
            const dateTime = new Date(Date.parse(result.updated_date));
            const newsSource = "The New York Times"
            return {
                thumb,
                description,
                fullLink,
                title,
                section,
                dateTime,
                newsSource
            };
        });
        
        showArticlePopUp();
        return mappedNytResults;
    } catch (err) {
        console.log("i am an error", err);
        alert("Sorry, we're not able to load The New York Times data right now.");
    }
}

// fetch data from Guardian API
const fetchGuardianData = async () => {
    try {
        const rawResponse = await fetch(guardianUrl);
        const jsonResponse = await rawResponse.json();
        const guardianResults = await jsonResponse.response.results;
        const mappedGuardianResults = guardianResults.map((result) => {
            const thumb = result.fields.thumbnail;
            const description = result.fields.trailText;
            const fullLink = result.webUrl;
            const title = result.webTitle;
            const section = result.sectionName.toUpperCase();
            const dateTime = new Date(Date.parse(result.fields.lastModified));
            const newsSource = "The Guardian";
            return {
                thumb,
                description,
                fullLink,
                title,
                section,
                dateTime,
                newsSource
            };
        });

        showArticlePopUp();
        return mappedGuardianResults;
    } catch (err) {
        console.log("i am an error", err);
        alert("Sorry, we're not able to load the Guardian data right now.");
    }
}

// fetch data from NewsAPI
const fetchNewsApiData = async () => {
    try {
        const rawResponse = await fetch(newsApiUrl);
        const jsonResponse = await rawResponse.json();
        const newsApiResults = await jsonResponse.articles;
        const mappedNewsApiResults = newsApiResults.map((result) => {
            const thumb = result.urlToImage;
            const description = result.description;
            const fullLink = result.url;
            const title = result.title;
            const section = result.source.name.toUpperCase();
            const dateTime = new Date(Date.parse(result.publishedAt));
            const newsSource = "NewsAPI"
            return {
                thumb,
                description,
                fullLink,
                title,
                section,
                dateTime,
                newsSource
            };
        });

        showArticlePopUp();
        return mappedNewsApiResults;
    } catch (err) {
        console.log("i am an error", err);
        alert("Sorry, we're not able to load the NewsAPI data right now.");
    }
}

// displays summary popUp when user clicks article title
const showArticlePopUp = () => {
    const popUpTitles = document.getElementsByClassName("articleTitle");
    const titleArray = Array.from(popUpTitles);
    titleArray.forEach((popUpTitle) => {
        popUpTitle.addEventListener("click", (e) => {
            e.preventDefault();
            popUp.classList.remove("loader", "hidden");
        });
    });
}

// closes popUp when user clicks X button
// restores scroll on body when popUp is closed
const closePopUp = () => {
    const closeBtn = document.getElementById("closePopUp");
    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        popUp.classList.add("loader", "hidden");
        popUp.removeChild(popUpContainer);
        document.getElementsByTagName("body")[0].style = "overflow: auto";
    });
}

// returns the page to the main feed when logo is clicked
const mainFeed = () => {
    let logo = document.getElementById("logoContainer");
    logo.addEventListener("click", () => {
        window.location.reload();
    });
}

// changes colour of header & atom background on each page load
// stores current colour to local storage
// checks local storage to avoid duplication of previous colour
const colours = ["redorange", "#ffa028", "yellow", "green", "#0d9ddb"];
let currentColour = +(localStorage.previousBGColour || -1)+1;
currentColour = currentColour >= colours.length ? 0 : currentColour;
document.querySelector("header").style.backgroundColor = colours[currentColour];
document.querySelector(".atom").style.backgroundColor = colours[currentColour];
localStorage.previousBGColour = currentColour;


const onLoadHandler = () => {

    closePopUp();
    displaySelection();
    mainFeed();

}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadHandler);
} else {
    popUp.classList.remove("hidden");
	onLoadHandler();
}