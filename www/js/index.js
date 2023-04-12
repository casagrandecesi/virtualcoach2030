/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

// Vedi https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

// Vedi https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
function getMonday(d) {
    d = new Date(d);
    let day = d.getDay();
    let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getSunday(d) {
    d = getMonday(d);
    return new Date(d.setDate(d.getDate() + 6));
}

function isoString(d) {
    return d.toISOString().split("T")[0];
}

function prettyString(d) {
    let weekdays = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
    let months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
    return weekdays[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()];
}

function getToday() {
    return new Date();
    //return new Date(Date.parse("2023-04-17"));
}

function maxChallenge() {
    let res = 0;
    for (let i = 0; i < GOALS.length; ++i) (function () {
        res += CHALLENGES[GOALS[i]].length;
    })();
    return res;
}

// Restituisce un array con il goal (numero sotto forma di stringa)
// e la challange della settimana, oppure false se tutte le challenge
// sono state usate.
function estraiChallenge() {
    let store = window.localStorage;
    let archive = JSON.parse(store.getItem("challengeArchive"));
    if (archive !== null && archive.length == maxChallenge()) {
        return false;
    }
    let goal = GOALS.random();
    let challenge = CHALLENGES[goal].random();
    while (archive !== null && archive.includes(challenge)) {
        goal = GOALS.random();
        challenge = CHALLENGES[goal].random();
    }
    if (archive === null)
        archive = [];
    archive.push(challenge);
    let today = getToday();
    let monday = getMonday(today);
    let sunday = getSunday(today);
    store.setItem("challengeMonday", isoString(monday));
    store.setItem("challengeSunday", isoString(sunday));
    store.setItem("currentChallenge", challenge);
    store.setItem("currentGoal", goal);
    store.setItem("challengeArchive", JSON.stringify(archive));
    return [goal, challenge];
}

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

function primaPagina() {
    let store = window.localStorage;
    let currentChallenge = store.getItem("currentChallenge");
    let page = "pageChallenge.html";
    let today = getToday();
    if (currentChallenge !== null) {
        let sunday = store.getItem("challengeSunday");
        let today = isoString(getToday());
        if (today === sunday) {
            let result = store.getItem("challengeResult");
            if (result === "OK")
                page = "pageResultOK.html";
            else if (result == "KO")
                page = "pageResultKO.html";
            else
                page = "pageFeedback.html";
        }
    } else if ([4, 5, 6, 0].includes(today.getDay())) {
        // Giovedì, vemerdì sabeto e domenica non faccio iniziare nuove challenge
        page = "pageAspetta.html";
    }
    myNavigator.pushPage(page, { animation: 'fade' });
}

function initPageTutorial() {
    let store = window.localStorage;
    let count = 1;
    function next() {
        ++count;
        if (count === 2) {
            textTutor.innerHTML = "2) La domenica successiva annota il tuo successo o il tuo insuccesso.";
            imgTutor.src = "img/screen02.png";
        } else if (count === 3) {
            textTutor.innerHTML = "3) Tieni traccia dei tuoi progressi con le statistiche.";
            imgTutor.src = "img/screen03.png";
        } else {
            store.setItem("tutorial", "fatto");
            primaPagina();
        }
    }
    buttonTutor.onclick = next;
    imgTutor.onclick = next;
}

function initPageAbout() {
    buttonAboutOk.onclick = function () {
        myNavigator.popPage();
    };
}

function setWeek(monday, sunday, element) {
    let weekdays = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
    let mondayStr = weekdays[monday.getDay()] + " " + monday.getDate();
    let sundayStr = weekdays[sunday.getDay()] + " " + sunday.getDate();
    element.innerHTML = mondayStr + " - " + sundayStr;
}

function initPageChallenge() {
    let store = window.localStorage;
    buttonStats.onclick = function () {
        myNavigator.pushPage('pageStats.html', { animation: 'slide' });
    };
    buttonAbout.onclick = function () {
        myNavigator.pushPage('pageAbout.html', { animation: 'slide' });
    };
    let current = store.getItem("currentChallenge");
    if (current !== null) {
        let goal = store.getItem("currentGoal");
        let challenge = store.getItem("currentChallenge");
        let monday = new Date(Date.parse(store.getItem("challengeMonday")));
        let sunday = new Date(Date.parse(store.getItem("challengeSunday")));
        immagineChallenge.src = "img/goal" + goal + ".jpg";
        descrizioneChallenge.innerHTML = challenge;
        setWeek(monday, sunday, weekChallenge);
    } else {
        let challenge = estraiChallenge();
        if (challenge !== false) {
            immagineChallenge.src = "img/goal" + challenge[0] + ".jpg";
            descrizioneChallenge.innerHTML = challenge[1];
            let today = getToday();
            let monday = getMonday(today);
            let sunday = getSunday(today);
            setWeek(monday, sunday, weekChallenge);
        } else {
            titoloChallenge.innerHTML = "Complimenti!!!"
            weekChallenge.innerHTML = "";
            immagineChallenge.src = "img/trophy.png";
            descrizioneChallenge.innerHTML = "Hai superato tutte le challenge!";
        }
    }
}

function initPageFeedback() {
    let store = window.localStorage;
    let challenge = store.getItem("currentChallenge");
    let archive = JSON.parse(store.getItem("challengeArchive"));
    let goal = store.getItem("currentGoal");
    let monday = new Date(Date.parse(store.getItem("challengeMonday")));
    let sunday = new Date(Date.parse(store.getItem("challengeSunday")));
    let stats = JSON.parse(store.getItem("challengeStats")) || {};
    buttonAboutFeedback.onclick = function () {
        myNavigator.pushPage('pageAbout.html', { animation: 'slide' });
    };
    buttonFeedbackOK.onclick = function () {  
        store.removeItem("currentChallenge");
        stats[goal] = (stats[goal] || 0) + 1;
        store.setItem("challengeResult", "OK");
        store.setItem("challengeStats", JSON.stringify(stats));
        myNavigator.pushPage('pageResultOK.html', { animation: 'slide' });
    };
    buttonFeedbackKO.onclick = function () {
        store.removeItem("currentChallenge");
        store.setItem("challengeResult", "KO");
        // Rimuoviamo la challenge dall'archivio, così può essere riproposta
        archive = archive.splice(archive.indexOf(challenge), 1);
        myNavigator.pushPage('pageResultKO.html', { animation: 'slide' });
    };
    immagineFeedback.src = "img/goal" + goal + ".jpg";
    descrizioneFeedback.innerHTML = challenge;
    setWeek(monday, sunday, weekFeedback);
}

function initPageStats() {
    let store = window.localStorage;
    buttonStatsBack.onclick = function () {
        myNavigator.popPage();
    };
    buttonAboutStats.onclick = function () {
        myNavigator.pushPage('pageAbout.html', { animation: 'slide' });
    };
    let html = '<table>';
    let stats = JSON.parse(store.getItem("challengeStats")) || {};
    for (let i = 0; i < GOALS.length; ++i) (function () {
        let goal = GOALS[i];
        html += '<tr>';
        html += '<td><img src="img/goal' + goal + '.jpg"></td>';
        let fatti = stats[goal] || 0;
        let perc = Math.round(fatti * 100 / CHALLENGES[goal].length);
        html += '<td class="right">' + perc + '%</td>';
        html += '</tr>';
    })();
    html += '</table>';
    statsDiv.innerHTML = html;
}

function initPageResultKO() {
    let today = getToday();
    today.setDate(today.getDate() + 1);
    nextChallengeKO.innerHTML = prettyString(today);
    let media = new Media("snd/positive.mp3");
    media.play();
}

function initPageResultOK() {
    let today = getToday();
    today.setDate(today.getDate() + 1);
    nextChallengeOK.innerHTML = prettyString(today);
    let media = new Media("snd/negative.mp3");
    media.play();
}

function initPageAspetta() {
    let today = getToday();
    while (today.getDay() !== 1)
        today.setDate(today.getDate() + 1);
    nextChallengeAspetta.innerHTML = prettyString(today);
}

document.addEventListener('show', function (event) {
    let page = event.target;
    let store = window.localStorage;
    if (page.id === "pageSplash") {
        setTimeout(function () {
            if (store.getItem("tutorial") !== null)
                primaPagina();
            else
                myNavigator.pushPage('pageTutorial.html', { animation: 'fade' });
        }, 2500);
    } else if (page.id === 'pageTutorial') {
        initPageTutorial();
    } else if (page.id === 'pageChallenge') {
        initPageChallenge();
    } else if (page.id === 'pageFeedback') {
        initPageFeedback();
    } else if (page.id === 'pageAbout') {
        initPageAbout();
    } else if (page.id === 'pageStats') {
        initPageStats();
    } else if (page.id === 'pageResultKO') {
        initPageResultKO();
    } else if (page.id === 'pageResultOK') {
        initPageResultOK();
    } else if (page.id === 'pageAspetta') {
        initPageAspetta();
    }
});