// Define interfaces for our data structures
interface Country {
    name: string;
    path: SVGPathElement;
    interval: number;
    dueAt: Date | null;
    repetitions: Repetition[];
}

interface Repetition {
    grade: number;
    date: Date;
    mixedUpWith: string | null;
    thinkingTime: number;
}

interface PanZoomInstance {
    getPan: () => { x: number; y: number };
    reset: () => void;
    resetZoom: () => void;
    resetPan: () => void;
    zoom: (level: number) => void;
    pan: (coordinates: { x: number; y: number }) => void;
}

// get names by getting the name property of every path in #math
let targetCountry: SVGPathElement = {} as SVGPathElement;
const elChallengeCountry = document.getElementById('challengeCountry') as HTMLElement;
const elFeedback = document.getElementById('feedback') as HTMLElement;
const elMap = document.getElementById('map') as HTMLElement;
const elGradeLED = document.getElementById('gradeLED') as HTMLElement;
const allCountries = document.getElementById('map')?.getElementsByTagName('path') as HTMLCollectionOf<SVGPathElement>;
const elTweet = document.getElementById('tweet') as HTMLElement;
let countries: Country[] = [];
let allCircles: SVGCircleElement[] = [];
let localStorageDataExists = false;

// define stats data
let statsGlobalStreak = 0;
let correctGuesses = 0;
let incorrectGuesses = 0;
let statsTrainingUnits = 0;
let statsTrainingUnitsThisSession = 0;
let statsTimeOfLastReveal: Date | null = null;
let statsThinkingTimes: number[] = [];
let countriesNrOfFailuresDict: { [key: string]: number } = {};
let confusionDict: { [key: string]: number } = {};
let nemesisDict: { [key: string]: number } = {};
let nemesis = '';

// see if we have the nr of training units last session in localstorage
let statsTrainingUnitsLastSession = localStorage.getItem('statsTrainingUnitsThisSession') ? localStorage.getItem('statsTrainingUnitsThisSession') : 'N/A';

// define stats elements
const elStatsGlobalStreak = document.getElementById('stats-global-streak') as HTMLElement;
const elStatsAccuracy = document.getElementById('stats-accuracy') as HTMLElement;
const elStatsDue = document.getElementById('stats-due') as HTMLProgressElement;
const elStatsUnits = document.getElementById('stats-units') as HTMLElement;
const elStatsUnitsThisSession = document.getElementById('stats-units-this-session') as HTMLElement;
const elStatsUnitsLastSession = document.getElementById('stats-units-last-session') as HTMLElement;
const elStatsThinkingTime = document.getElementById('stats-thinking-time') as HTMLElement;
const elStatsHardestCountry = document.getElementById('stats-hardest-country') as HTMLElement;
const elStatsMostConfusedA = document.getElementById('stats-most-confused-a') as HTMLElement;
const elStatsMostConfusedB = document.getElementById('stats-most-confused-b') as HTMLElement;
const elStatsNemesis = document.getElementById('stats-nemesis') as HTMLElement;

// load countries from localStorage (if it exists)
if (localStorage.getItem('countries')) {
    countries = JSON.parse(localStorage.getItem('countries') || '[]');
    localStorageDataExists = true;
}

// for every path, add a <circle> at its center
for (let i = 0; i < allCountries.length; i++) {
    const country = allCountries[i];
    // get the bounding box of the path:
    const bbox = country.getBBox();
    const manualSmallCountries = [
        'Federated States of Micronesia',
        'French Polynesia',
        'Saint Helena',
        'Marshall Islands',
    ];
    const excludeCountries = [
        'Burundi',
        'Albania',
        'Macedonia',
        'Montenegro',
        'Lesotho',
        'Lebanon',
        'Rwanda',
        'Malawi',
        'Swaziland',
        'Equatorial Guinea',
        'Guinea-Bissau',
        'Israel',
        'Switzerland',
        'Sri Lanka',
        'Slovakia'
    ];
    if ((bbox.width < 8 || bbox.height < 8 || manualSmallCountries.includes(country.getAttribute('name') || '')) && !excludeCountries.includes(country.getAttribute('name') || '')) {
        // create a <circle> element:
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // set its center to the center of the bounding box:
        circle.setAttribute('cx', (bbox.x + bbox.width / 2).toString());
        circle.setAttribute('cy', (bbox.y + bbox.height / 2).toString());
        // set its radius to half the width of the bounding box:
        circle.setAttribute('r', '2');
        // set stroke width to 1
        circle.setAttribute('stroke-width', '1');
        // give it same name property as country
        circle.setAttribute('name', country.getAttribute('name') || '');
        circle.classList.add('small-country-circle');
        // append it to the <svg> element:
        document.getElementById('map')?.appendChild(circle);
        allCircles.push(circle);
    }
    // around every country smaller than 30, create a larger circle
    if (bbox.width < 3000 || bbox.height < 300) {
        // create a <circle> element:
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', (bbox.x + bbox.width / 2).toString());
        circle.setAttribute('cy', (bbox.y + bbox.height / 2).toString());

        circle.setAttribute('r', Math.min(90, Math.max(35, Math.max(bbox.width, bbox.height) / 2)).toString());
        circle.setAttribute('stroke-width', '1');
        // set id to 'finder-' + country.getAttribute('name')
        circle.setAttribute('id', 'finder-' + (country.getAttribute('name') || ''));
        circle.classList.add('finder-circle', 'shrink', 'hide');
        // set opacity 0
        document.getElementById('map')?.appendChild(circle);
    }
    // if we have not loaded data
    if (!localStorageDataExists) {
        countries.push({
            name: country.getAttribute('name') || '',
            path: country,
            interval: 10,
            dueAt: null,
            repetitions: []
        });
    } else {
        // if we have loaded data, find the country in the countries array and set its path property
        const countryObject = countries.find(function (countryObject) {
            return countryObject.name == country.getAttribute('name');
        });
        if (countryObject) {
            countryObject.path = country;
            // create proper date object from dueAt string
            if (countryObject.dueAt) {
                countryObject.dueAt = new Date(countryObject.dueAt);
            }

            // if the last repetition on the country has a grade of 1, color a light green, if its 0, color a light red
            if (countryObject.repetitions.length > 0) {
                const lastRepetition = countryObject.repetitions[countryObject.repetitions.length - 1];
                // also check if there is a circle with the same name
                const matchingCircles = allCircles.filter(function (circle) {
                    return circle.getAttribute('name') == countryObject.name;
                });
                if (lastRepetition.grade == 1) {
                    countryObject.path.classList.add('previouslyCorrect');
                    if (matchingCircles.length > 0) {
                        matchingCircles[0].classList.add('previouslyCorrect');
                    }
                } else {
                    countryObject.path.classList.add('previouslyIncorrect');
                    if (matchingCircles.length > 0) {
                        matchingCircles[0].classList.add('previouslyIncorrect');
                    }
                }

                // add the nr of incorrect and correct repetitions to stat variables
                correctGuesses += countryObject.repetitions.filter(function (repetition) {
                    return repetition.grade == 1;
                }).length;
                incorrectGuesses += countryObject.repetitions.filter(function (repetition) {
                    return repetition.grade == 0;
                }).length;

                // add relevant data to countriesNrOfFailuresDict
                if (countryObject.repetitions.filter(function (repetition) {
                    return repetition.grade == 0;
                }).length > 0) {
                    countriesNrOfFailuresDict[countryObject.name] = countryObject.repetitions.filter(function (repetition) {
                        return repetition.grade == 0;
                    }).length;
                }
                // add relevant data to confusion dict
                for (let i = 0; i < countryObject.repetitions.length; i++) {
                    const repetition = countryObject.repetitions[i];
                    if (repetition.grade == 0) {
                        const confusionKey = countryObject.name + '-' + repetition.mixedUpWith;
                        if (confusionDict[confusionKey]) {
                            confusionDict[confusionKey] += 1;
                        } else {
                            confusionDict[confusionKey] = 1;
                        }
                    }
                }

                // add relevant data to the nemesis dict
                let negativeStreak = 0;
                for (let i = countryObject.repetitions.length - 1; i >= 0; i--) {
                    const repetition = countryObject.repetitions[i];
                    if (repetition.grade == 0) {
                        negativeStreak += 1;
                    } else {
                        break;
                    }
                }
                nemesisDict[countryObject.name] = negativeStreak;

                renderFailureAndConfusion();
                statsTrainingUnits += countryObject.repetitions.length;
            }
        }
    }
}

// now, we can load the zoom/pan library and set it up
const panZoomLibrary = svgPanZoom('#map', {
    panEnabled: true,
    controlIconsEnabled: true,
    zoomEnabled: true,
    dblClickZoomEnabled: true,
    zoomScaleSensitivity: 0.2,
    minZoom: 0.5,
    maxZoom: 10,
    fit: true,
    center: true,
    beforeZoom: function () { },
    onZoom: function () { },
    beforePan: function () { },
    onPan: function () {
        // get the actual pan
        const pan = panZoomLibrary.getPan();
    }
}) as PanZoomInstance;

calculateAccuracy();
elStatsUnits.innerHTML = statsTrainingUnits.toString();
elStatsUnitsLastSession.innerHTML = statsTrainingUnitsLastSession;

// listen to all clicks - if the click is on the svg, display the title of the clicked sub-object
document.getElementById('map')?.addEventListener('click', function (e: MouseEvent) {
    // if we're not currently awaiting a click, return instantly
    if (elFeedback.innerHTML != 'Waiting for click...') {
        return;
    }
    // find the path that was clicked on, and log its html 'name' property:
    const clickedCountry = e.target as SVGPathElement;
    const clickedName = clickedCountry.getAttribute('name');
    if (clickedName) {
        // difference in seconds between now and statsTimeOfLastReveal, max at 60s
        const thinkingTime = Math.min((new Date().getTime() - (statsTimeOfLastReveal?.getTime() || 0)) / 1000, 60);
        statsThinkingTimes.push(thinkingTime);
        // calculate avg thinking time, round to 2 after decimal
        elStatsThinkingTime.innerHTML = (statsThinkingTimes.reduce(function (a, b) {
            return a + b;
        }) / statsThinkingTimes.length).toFixed(2) + 's';
        calculateAccuracy();
        iterateTrainingUnitCounter();

        let guessedRight = false;
        if (clickedName === targetCountry.getAttribute('name')) {
            guessedRight = true;
        }
        // handle SR 
        // find the country in the countries array
        let targetCountryObject = countries.find(function (country) {
            return country.name == targetCountry.getAttribute('name');
        });

        if (targetCountryObject) {
            targetCountryObject.repetitions.push({
                grade: guessedRight ? 1 : 0,
                date: new Date(),
                mixedUpWith: guessedRight ? null : clickedName,
                thinkingTime: thinkingTime,
            });

            // if correct, double interval, if incorrect, half it (minimum 10)
            if (guessedRight) {
                statsGlobalStreak += 1;
                generateTwitterLink();
                correctGuesses += 1;
                // set this country's nemesisDict entry to 0
                nemesisDict[targetCountryObject.name] = 0;
                renderStreak();
                renderFailureAndConfusion();

                // get the streak: how many of the last repetitions are all correct, uniterrupted?
                let streak = 0;
                for (let i = targetCountryObject.repetitions.length - 1; i >= 0; i--) {
                    const repetition = targetCountryObject.repetitions[i];
                    if (repetition.grade == 1) {
                        streak++;
                    } else {
                        break;
                    }
                }

                targetCountryObject.interval *= Math.pow(2, streak);
                // special case when the country is new: set the interval to two minutes immediately
                if (targetCountryObject.repetitions.length == 1) {
                    targetCountryObject.interval = 120;
                }
            } else {
                // set country value for countriesNrOfFailuresDict +1 or to 1 if key doesn't exist
                countriesNrOfFailuresDict[targetCountryObject.name] = countriesNrOfFailuresDict[targetCountryObject.name] ? countriesNrOfFailuresDict[targetCountryObject.name] + 1 : 1;
                // same for confusion dict
                const confusionKey = targetCountryObject.name + '-' + clickedName;
                confusionDict[confusionKey] = confusionDict[confusionKey] ? confusionDict[confusionKey] + 1 : 1;

                nemesisDict[targetCountryObject.name] = nemesisDict[targetCountryObject.name] ? nemesisDict[targetCountryObject.name] + 1 : 1;

                renderFailureAndConfusion();
                statsGlobalStreak = 0;
                generateTwitterLink();
                incorrectGuesses += 1;
                renderStreak();
                targetCountryObject.interval /= 2;
                if (targetCountryObject.interval < 10) {
                    targetCountryObject.interval = 10;
                }
                if (targetCountryObject.interval > 100) {
                    targetCountryObject.interval = 100;
                }
            }
            targetCountryObject.dueAt = new Date(new Date().getTime() + targetCountryObject.interval * 1000);

            // save obj to localStorage
            localStorage.setItem('countries', JSON.stringify(countries));

            // check if correct
            // give feedback accordingly
            // if correct ,set country green
            // if incorrect, set targetCountry red and clickedCountry blue
            // after 2 seconds, pick new challenge:
            if (guessedRight) {
                elFeedback.innerHTML = 'Correct!';
                elGradeLED.style.backgroundColor = '#6bb66b';
                // remove and add .correct class
                clickedCountry.classList.remove('correct', 'incorrect');
                clickedCountry.classList.add('correct');
                setTimeout(function () {
                    pickRandomChallenge();
                }, 2000);
            } else {
                elFeedback.innerHTML = `Incorrect! That's ${clickedName}.`;

                // check if target country is in current viewport
                function isElementInViewport(el: SVGPathElement): boolean {
                    const svgRect = el.ownerSVGElement?.getBoundingClientRect();
                    const pathRect = el.getBoundingClientRect();
                    if (!svgRect) return false;
                    return (
                        pathRect.top >= svgRect.top &&
                        pathRect.left >= svgRect.left &&
                        pathRect.bottom <= svgRect.bottom &&
                        pathRect.right <= svgRect.right
                    );
                }

                if (!isElementInViewport(targetCountry)) {
                    // reset view
                    panZoomLibrary.reset();
                }
                elGradeLED.style.backgroundColor = '#b66b6b';
                targetCountry.classList.remove('incorrect', 'correct');
                targetCountry.classList.add('incorrect');

                // find svg circle with name finder-$targetCountry
                const targetCircle = document.getElementById('finder-' + targetCountry.getAttribute('name'));
                // set it visible, and remove and add in .shrink 
                if (targetCircle) {
                    targetCircle.classList.remove('shrink', 'hide');
                    targetCircle.classList.add('shrink');
                }

                clickedCountry.classList.add('selected');
                setTimeout(function () {
                    if (targetCircle) {
                        targetCircle.classList.add('hide');
                    }
                    clickedCountry.classList.remove('selected');
                    pickRandomChallenge();
                }, 2001);
            }
        }
    }
});

function pickRandomChallenge(): void {
    // check whether to include tiny countries by checking state of #tiny-country-check
    const includeTinyCountries = (document.getElementById('tiny-country-check') as HTMLInputElement).checked;
    let countriesToPickFrom = countries;
    // also, if it's beginning of the session (less than 10 training units), include both tiny countries and hard countries
    const isBeginningOfSession = statsTrainingUnitsThisSession < 10;
    if (!includeTinyCountries || isBeginningOfSession) {
        // exclude everything that's included in the allCircles list
        // check by matching country.name against the the .name property of the objects in allCircles
        countriesToPickFrom = countries.filter(function (country) {
            for (let i = 0; i < allCircles.length; i++) {
                const circle = allCircles[i];
                if (circle.getAttribute('name') == country.name) {
                    return false;
                }
            }
            return true;
        });
        if (isBeginningOfSession) {
            //  exclude nemesisDict entries:
            countriesToPickFrom = countriesToPickFrom.filter(function (country) {
                return nemesisDict[country.name] < 2 || !nemesisDict[country.name];
            });
        }
    }
    zoomToWorld();
    elFeedback.innerHTML = 'Waiting for click...';
    elGradeLED.style.backgroundColor = '#e0e0e0';
    // pick from countries array, where dueAt is in the past or null
    // with 80% chance, try to find something that was seen before first
    // this logic is a bit bad (had the same problem with q) — because we have a preferred set, but also have to handle the case that one is empty
    let dueCountries: Country[] = [];

    function getDueCountries(countriesToPickFrom: Country[]): Country[] {
        return countriesToPickFrom.filter(function (country) {
            if (country.dueAt == null) {
                return false;
            }
            const isDue = country.dueAt.getTime() < new Date().getTime();
            return isDue;
        });
    }

    if (Math.random() < 0.8) {
        dueCountries = getDueCountries(countriesToPickFrom);
    }

    if (dueCountries.length == 0) {
        const newCountries = countriesToPickFrom.filter(function (country) {
            return country.dueAt == null;
        });
        dueCountries = newCountries;
    }

    // if still none, we're either genuinely done, or we need to get a previously seen after all
    if (dueCountries.length == 0) {
        dueCountries = getDueCountries(countriesToPickFrom);
    }

    // set value property of elStatsDue progress to 255-due:
    elStatsDue.value = 255 - dueCountries.length;
    generateTwitterLink();

    // handle no due countries
    if (dueCountries.length == 0) {
        alert('You are done for now. Not bad.');
        return;
    }

    targetCountry = dueCountries[Math.floor(Math.random() * dueCountries.length)].path;
    elChallengeCountry.innerHTML = targetCountry.getAttribute('name') || '';

    statsTimeOfLastReveal = new Date();
}

pickRandomChallenge();

const elZoomMiddleAmerica = document.getElementById('zoom-middle-america') as HTMLElement;
// implement zooming the svg around Element with name `Cuba`
elZoomMiddleAmerica.addEventListener('click', function () {
    panZoomLibrary.resetZoom();
    panZoomLibrary.resetPan();
    panZoomLibrary.zoom(9);
    panZoomLibrary.pan({
        x: -1642,
        y: -2832
    });

    // hide all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'none';
    }
});

const elZoomWorld = document.getElementById('zoom-world') as HTMLElement;
elZoomWorld.addEventListener('click', function () {
    zoomToWorld();
});

const elZoomMediterranean = document.getElementById('zoom-mediterranean') as HTMLElement;
elZoomMediterranean.addEventListener('click', function () {
    panZoomLibrary.zoom(8);
    panZoomLibrary.pan({
        x: -2641,
        y: -1735
    });
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'block';
    }
});

function zoomToWorld(): void {
    panZoomLibrary.reset();
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'block';
    }
}

const elZoomSEA = document.getElementById('zoom-sea') as HTMLElement;
elZoomSEA.addEventListener('click', function () {
    zoomToSEA();
});

function zoomToSEA(): void {
    panZoomLibrary.zoom(6);
    panZoomLibrary.pan({
        x: -3043,
        y: -1591
    });
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'block';
    }
}

const elZoomAfrica = document.getElementById('zoom-africa') as HTMLElement;
elZoomAfrica.addEventListener('click', function () {
    panZoomLibrary.zoom(4);
    panZoomLibrary.pan({
        x: -1164,
        y: -1172
    });

    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'block';
    }
});

const elZoomOceania = document.getElementById('zoom-oceania') as HTMLElement;
elZoomOceania.addEventListener('click', function () {
    panZoomLibrary.zoom(4);
    panZoomLibrary.pan({
        x: -2255,
        y: -1108
    });
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i];
        currentCircle.style.display = 'block';
    }
});

function calculateAccuracy(): void {
    // calculate accuracy out of number of correct and incorrect guesses, round to two after decimal
    const accuracy = Math.round(correctGuesses / (correctGuesses + incorrectGuesses) * 10000) / 100;
    elStatsAccuracy.innerHTML = accuracy + ' %';
}

function iterateTrainingUnitCounter(): void {
    statsTrainingUnits += 1;
    statsTrainingUnitsThisSession += 1;
    // save to localstorage
    localStorage.setItem('statsTrainingUnitsThisSession', statsTrainingUnitsThisSession.toString());
    elStatsUnits.innerHTML = statsTrainingUnits.toString();
    elStatsUnitsThisSession.innerHTML = statsTrainingUnitsThisSession.toString();
}

function renderFailureAndConfusion(): void {
    // find the most commonly incorrectly guessed country from  countriesNrOfFailuresDict- has to be more than 2 wrong
    let mostCommonlyIncorrectlyGuessedCountry = null;
    let mostCommonlyIncorrectlyGuessedCountryNrOfFailures = 0;
    for (const [key, value] of Object.entries(countriesNrOfFailuresDict)) {
        if (value > mostCommonlyIncorrectlyGuessedCountryNrOfFailures && value > 2) {
            mostCommonlyIncorrectlyGuessedCountry = key;
            mostCommonlyIncorrectlyGuessedCountryNrOfFailures = value;
        }
    }
    elStatsHardestCountry.innerHTML = mostCommonlyIncorrectlyGuessedCountry || '-';

    // find the most common confusion from confusionDict
    let mostCommonConfusion = null;
    let mostCommonConfusionNrOfConfusions = 0;
    for (const [key, value] of Object.entries(confusionDict)) {
        if (value > mostCommonConfusionNrOfConfusions && value > 1) {
            mostCommonConfusion = key;
            mostCommonConfusionNrOfConfusions = value;
        }
    }
    if (mostCommonConfusion != null) {
        elStatsMostConfusedA.innerHTML = mostCommonConfusion.split('-')[0];
        elStatsMostConfusedB.innerHTML = mostCommonConfusion.split('-')[1];
    } else {
        elStatsMostConfusedA.innerHTML = '-';
        elStatsMostConfusedB.innerHTML = '-';
    }

    // find the highest value in the nemesisDict, using reduce
    nemesis = Object.keys(nemesisDict).reduce(function (a, b) {
        return nemesisDict[a] > nemesisDict[b] ? a : b;
    });
    if (nemesisDict[nemesis] > 0) {
        elStatsNemesis.innerHTML = nemesis;
        generateTwitterLink();
    }
}

function renderStreak(): void {
    // generate .progress-bar-iterator, as many as streak counter, add into  elStatsGlobalStreak
    elStatsGlobalStreak.innerHTML = '';
    for (let i = 0; i < statsGlobalStreak; i++) {
        const elProgressBarIterator = document.createElement('div');
        elProgressBarIterator.classList.add('progress-bar-iterator');
        // set the width according to amount of bars (more = slimmer), minimum is 3px, maximum is 20px - we don't want the sum to exceed 800px:
        const width = Math.min(20, Math.max(3, 800 / statsGlobalStreak));
        elProgressBarIterator.style.width = width + 'px';
        elProgressBarIterator.style.minWidth = width + 'px';
        elStatsGlobalStreak.appendChild(elProgressBarIterator);
    }
}

function generateTwitterLink(): void {
    // dynamically generate from
    // I&#39;m playing World Map Practice 🌍 &#010;🧠 Memorized Countries: 35 out of 255&#010;👑 Streak: 3 &#010;💀 My Nemesis: Guayana
    // replace 35, 3, Guayana
    const memorizedCountries = elStatsDue.value;
    const streak = statsGlobalStreak;
    const tweetString = `I'm playing World Map Practice:\n🧠 Memorized Countries: ${memorizedCountries} out of 255\n🏃‍♀️ Practiced ${statsTrainingUnits} times\n🎯 Accuracy: ${elStatsAccuracy.innerHTML}\n👑 Streak: ${streak} \n💀 Having a hard time with: ${nemesis}\n`;

    // set data-text of #tweet
    elTweet.setAttribute('data-text', tweetString);
} 