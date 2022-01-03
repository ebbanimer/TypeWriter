var titleDisplay = document.getElementById('text-title');
var authorDisplay = document.getElementById('author');
var storyDisplay = document.getElementsByClassName('chosen-text');

const playBtn = document.getElementById('play-btn');
var selectStory = document.getElementById('text-select');
var typeBar = document.getElementById('type-here');

var grossWpm = document.getElementById('gross-wpm');
var netWpm = document.getElementById('net-wpm');
var accuracy = document.getElementById('accuracy');
var errors = document.getElementById('errors');

var ignoreCasing = document.getElementById('ignore-casing')
const swe = document.getElementById('swe');
const eng = document.getElementById('eng');

var charIndex = 0;
var currentChar;
var arrayStory;
const errorSound = new Audio('audio/error-sound.wav')

let startTime = null;
let endTime = null;
var typedChars = 0;
var correctChars = 0;
var incorrectChars = 0;

var wpmArray = []
const canvas = document.getElementById('canvas');  
const ctx = canvas.getContext( "2d" );  
const bottom = 150;
const left = 0;
const right = 300;
const height = 150;
const width = 300;

fillCanvas();

// Function to fill canvas property with reference lines.
function fillCanvas(){
    ctx.beginPath();
    ctx.strokeStyle = "#FFF";
    ctx.moveTo(left, (height) / 4 * 3);
    ctx.lineTo(right, (height) / 4 * 3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "#FFF";
    ctx.moveTo(left, (height) / 2);
    ctx.lineTo(right, (height) / 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "#FFF";
    ctx.moveTo(left, (height) / 4);
    ctx.lineTo(right, (height) / 4);
    ctx.stroke();
}

var xhr = new XMLHttpRequest();
xhr.open('GET', 'texts.json', true);
xhr.responseType = 'json';

// Retrieve stories from JSON file
xhr.onload = function(){
    if(this.status == 200){
        const allStories = this.response;

        var engStories = []
        var sweStories = []

        // Split the stories in three arrays. One for all, one for eng and one for swe.
        allStories.forEach(story => {
            if (story.language == "english"){
                engStories.push(story)   
            } else if (story.language == "swedish"){
                sweStories.push(story)
            }
        })

        // Call selectLanguage function with the arrays as parameters
        selectLanguage(allStories, engStories, sweStories)
    }
}

xhr.send()

// Function to select language
function selectLanguage (allStories, engStories, sweStories) {
    
    let selected = document.querySelector("input[name='lang']:checked");

    // If no radio button is selected, call populateStories with all stories from JSON. If any button
    // is selected, assign the dedicated language array and pass it to populateStories.
    if (!selected){
        populateStories(allStories)
    }

    swe.addEventListener('change', () => {
        populateStories(sweStories);
    })

    eng.addEventListener('change', () => {
        populateStories(engStories);
    })

}

// Function to populate dropdown-list with all corresponding stories.
function populateStories(stories){
    let option;
    selectStory.innerHTML = ''    // Clear out previous optiontags
    for (let i = 0; i < stories.length; i++){
            option = document.createElement('option');
            option.text = stories[i].title;
            option.value = stories[i].id;
            selectStory.add(option);
    }

    // Display first story in the text area
    titleDisplay.innerHTML = stories[0].title;
    authorDisplay.innerHTML = stories[0].author + " (" +stories[0].poem.split(' ').length+ " words, " +stories[0].poem.length+ " chars)";
    storyDisplay.innerHTML = stories[0].poem;

    // Call resetvalues to create span and clear out previous game-data
    resetValues();

    // If the user changes text, call loadText function with selected target.
    selectStory.addEventListener('change', (ev) => {
        var selectedOption = ev.target.value
        loadText(stories, selectedOption);
    })

}


// Function to load the selected text
function loadText(stories, selectedOption){

    // Filter through the given story array and find the matching story id. If it is a match, change the
    // text to the selected one.
    stories.filter(story => {
        if (selectedOption == story.id) {
            titleDisplay.innerHTML = story.title;
            authorDisplay.innerHTML = story.author + " (" +story.poem.split(' ').length+ " words, " +story.poem.length+ " chars)";
            storyDisplay.innerHTML = story.poem;

            resetValues();   // Reset values from previous data & create new spans
        }
    })
}


// Convert story to a string and then to an array, in order to wrap each character in a span-element. 
function createSpan (){

    let text = document.querySelector('.chosen-text');
    let strText = storyDisplay.innerHTML;
    let splitText = strText.split('');
    text.textContent = '';

    for (let i = 0; i < splitText.length; i++){
        text.innerHTML += "<span>" + splitText[i] + "</span>"
    }
}

// Function to play the game
function game(e){

    ++typedChars

    // If the key corresponds to the current character, add correct. If not, add incorrect and play error-sound.
    if (ignoreCasing.checked){
        if (e.key.toLowerCase() === currentChar.innerText.toLowerCase()) {
            currentChar.classList.remove('highlighted');
            currentChar.classList.add('correct');
            ++correctChars
        } else {
            errorSound.play();
            errorSound.currentTime = 0;
            currentChar.classList.remove('highlighted');
            currentChar.classList.add('incorrect');
            ++incorrectChars
        }
    } else {
        if (e.key === currentChar.innerText){
            currentChar.classList.remove('highlighted');
            currentChar.classList.add('correct');
            ++correctChars
        } else {
            errorSound.play();
            errorSound.currentTime = 0;
            currentChar.classList.remove('highlighted');
            currentChar.classList.add('incorrect');
            ++incorrectChars
        }
    }

    currentChar = arrayStory[++charIndex]; // Increase the char-index to highlight next character

    if (charIndex < arrayStory.length){
        currentChar.classList.add('highlighted');    // When character-index is less than the array of story,
    }                                                // highlight next character

    if (e.code === 'Space'){
        typeBar.value = null;   // Clear the input field after each space
    }

    stats(typedChars, correctChars, incorrectChars);  // Pass in data to print the stats

    // If the current character-index is greater than the length of the story, stop the game
    if (charIndex == arrayStory.length){             
        stopGame();
    }

}


// Function to print the statistics
function stats(typedChars, correctChars, incorrectChars){

    // Calculate elapsed_minutes by getting the current time and withdraw start-time
    endTime = new Date().getTime();
    elapsed_time = endTime - startTime;
    elapsed_minutes = (elapsed_time / 1000) / 60;

    var _accuracy = (correctChars / typedChars) * 100; // Multiply by 100 to get percentage
    var grossWPM = (typedChars / 5) / elapsed_minutes;
    var netWPM = grossWPM - (incorrectChars / elapsed_minutes);

    if (netWPM < 0) {
        netWpm.innerHTML = 0;     // This to avoid showing negative netWPM
    } else {
        netWpm.innerHTML = Math.floor(netWPM);
    }

    errors.innerHTML = incorrectChars;
    grossWpm.innerHTML = Math.floor(grossWPM);
    accuracy.innerHTML = Math.floor(_accuracy) + "%"; 
    drawGraph(grossWPM)           // Call drawGraph function with grossWPM as parameter

}

// Function to dynamically draw the canvas
function drawGraph (grossWPM){
    
    // Push grossWPM into the array to have an array with all grossWPM. Multiply by 1.5 to get same
    // scaling to the canvas-window (150x300)
    wpmArray.push(grossWPM * 1.5) 

    ctx.clearRect( 0, 0, 300, 150 );  // Clear the canvas to avoid multiple lines
    fillCanvas()  // Fill canvas with reference lines again

    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 3;

    // Start the linegraph on the left with the height of height-firstWPM 
    ctx.moveTo(left, (height - wpmArray[0]));  
    // For each WPM in the array (besides the first one, since we start there), draw a line to the right and 
    // height for each coordinate in the array
    for(var i = 1; i < wpmArray.length; i++){
        ctx.lineTo(right / wpmArray.length * i, (height - wpmArray[i]));
    }
    ctx.stroke();
}

// Once playbutton is clicked there is not a current game, start the game. If there is an ongoing game,
// stop the game. 
playBtn.addEventListener('click', () => {
    if (!startTime){
        startGame();
    } else {
        stopGame();
    }
})

// Function to start the game. Get start-time, add the eventlistener and able the typebar.
function startGame () {
    resetValues();
    startTime = new Date().getTime();
    playBtn.src="../img/stop_adobespark.png";
    typeBar.disabled = false;
    typeBar.focus()
    typeBar.addEventListener('keypress', keyListener);
}

// The function that is used to listen to the keys
function keyListener(e){
    game(e);
}

// Function to stop the game. Remove the eventlistener and disable the typebar
function stopGame(){
    playBtn.src="../img/start_adobespark.png";
    typeBar.value = "Game Ended"
    typeBar.disabled = true;
    typeBar.removeEventListener('keypress', keyListener)
    startTime = null;
}

// Function to reset all values which is used when the user selects a new story
function resetValues (){
    createSpan();

    arrayStory = document.querySelectorAll('span');
    charIndex = 0;
    currentChar = arrayStory[charIndex];
    currentChar.classList.add('highlighted');

    typeBar.removeEventListener('keypress', keyListener)
    typeBar.disabled = true;
    typeBar.value = '';
    _accuracy = 0;
    incorrectChars = 0;
    correctChars = 0;
    typedChars = 0;
    endTime = null;
    startTime = null;
    playBtn.src="../img/start_adobespark.png";
    errors.innerHTML = 0;
    accuracy.innerHTML = 0;
    grossWpm.innerHTML = 0;
    netWpm.innerHTML = 0;
    ctx.clearRect( 0, 0, 300, 150 );  
    wpmArray = [];
    fillCanvas();

}





