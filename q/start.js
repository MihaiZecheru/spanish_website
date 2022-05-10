function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

window.onload = () => {
  window.quizNumber = 0;
  
  let _chapter = window.localStorage.getItem('ch');

  location.hash = _chapter;

  if (_chapter === null || typeof _chapter === undefined || _chapter === "") {
    _chapter = "#ch1";
    window.localStorage.setItem('ch', "#ch1");
  }

  const chapter = _chapter.substring(3);

  // prevent user from changing hash
  window.onhashchange = () => {
    location.hash = _chapter;
  }
  
  if (chapter === "_") { // user chose all chapters
    const text = document.getElementById("h1Header").innerText;
    Client.changeElementText({id: "h1Header", text: `Spanish Quiz: All Chapters`});
    return;
  }

  // "else"
  const text = document.getElementById("h1Header").innerText;
  Client.changeElementText({id: "h1Header", text: `${text} ${capitalizeFirstLetter(chapter)}`});

  Server.logvisit();
}

class Server {
  static chapterBinKey = {
    "_": "all.json",
    "1": "chapter1.json",
    "2": "chapter2.json",
    "3": "chapter3.json",
    "4": "chapter4.json",
    "5": "chapter5.json",
    "6": "chapter6.json",
    "7": "chapter7.json"
  }
  
  static getKVpairsAsList (chapter, resolve) {
    const TOAST = new bootstrap.Toast(document.getElementById("toast-xhr-fail-warning"));
    TOAST.show();

    const xhr = new XMLHttpRequest();
    const url = `https://raw.githubusercontent.com/MihaiZecheru/jsons/main/spanishQuiz/${this.chapterBinKey[chapter]}`;
    xhr.responseType = 'json';
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const wordBank = xhr.response;
        const kvPairs = Object.entries(wordBank);
        // window.localStorage.setItem('chapterBank', JSON.stringify(kvPairs))
        resolve(kvPairs);
        return;
      }
    }
    xhr.open('GET', url);
    xhr.send();
  }

  static logvisit(today = new Date()) {
    const date = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
    let visits = 0;
    fetch('https://spanishmzecheru.fireapis.com/visits/2', {
        method: 'GET',
        headers: {
            'X-API-ID': '395',
            'X-CLIENT-TOKEN': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcGlfa2V5IjoiZTdiNjlkMjItZDk1NC00ZDQxLTgwNzUtZTI2ZmRhOTkyYmExIiwidGVuYW50X2lkIjo1MDksImp0aV9rZXkiOiJlMWQ0NDc4Ny1iOGNmLTRlMjQtOTlmMS05Y2IyMzZjNzAxODEifQ.45OvRBu20_jHlT90tFNTBj--StROJiIn2MQ-2coc-e4',
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            visits = data.visits + 1;

            if (visits === 0) return; // operation failed

            const body = { "visits": visits, "mostrecentvisit": date }

            fetch('https://spanishmzecheru.fireapis.com/visits/2', {
                method: 'PUT',
                headers: {
                    'X-API-ID': '395',
                    'X-CLIENT-TOKEN': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcGlfa2V5IjoiZTdiNjlkMjItZDk1NC00ZDQxLTgwNzUtZTI2ZmRhOTkyYmExIiwidGVuYW50X2lkIjo1MDksImp0aV9rZXkiOiJlMWQ0NDc4Ny1iOGNmLTRlMjQtOTlmMS05Y2IyMzZjNzAxODEifQ.45OvRBu20_jHlT90tFNTBj--StROJiIn2MQ-2coc-e4',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .catch(err => console.log(err));
        })
        .then(err => console.log(err));
  }
}

class Quiz {
  constructor (chapter) {
    // this obj attributes: chapter, quiz, _qaps, correct, wrong, questionNum, remainingNum

    this.correct = 0;
    this.wrong = 0;
    this.score = 0;
    this.questionNum = 1;
    this.remainingNum = 14;

    this.chapter = chapter;

    // create map for question-answer pairs
    // then setup screen, passing in the first question in the generated list

    const createAttrsProxyFunc = (questions, qaps) => {
      this.createAttrs(questions, qaps);
      const firstQuestion = this.questions[0];
      this.setupScreen(firstQuestion);
    }
    
    const returnPromise = () => {
      return new Promise(resolve => {
        this.generateQuestions(this.chapter, resolve);
      });
    }
    
    async function afterQuestionGen () {
      await returnPromise()
        .then((result) => {
          createAttrsProxyFunc(result[0], result[1]); // questions and qaps
        })
    }
    
    const questionsAndQap = afterQuestionGen();
  }

  createAttrs(q, qaps) {
    this.questions = q;
    this._qaps = qaps;
  }

  generateQuestions(chapter, _resolve) {
    // get random words from chapter list
    const qap = new Map();
    
    // list will look like [[key, value], [key, value], [key, value]]
    function returnPromise() {      
      return new Promise((resolve, reject) => {
        Server.getKVpairsAsList(chapter, resolve);
      });
    }

    async function afterPromiseResolve () {
      const kvps = await returnPromise();
      if (kvps === false) {
        console.log('false')
      }

      // gen 15 questions
      let _qaps = [];
      for(let i=0;i<15;i++) {
        const kvp = kvps[Math.floor(Math.random() * kvps.length)];
        if (_qaps.includes(kvp)) {
          i--;
          continue; // prevent duplicates
        }
        _qaps.push(kvp);
      }
  
      // map all 15 questions
      _qaps.forEach(qa => {
        qap.set(qa[0], qa[1]); // 0 = key, 1 = value
      })
  
      let _questions = [];
      for (let [key, value] of qap) {
        _questions.push(key);
      }
      _resolve([_questions, qap]);
    }

    afterPromiseResolve();
  }

  setupScreen(firstQuestion) {
    // make sure all screen stats are set to their default state
    this.updateStats();
    
    // reveal divs
    const statsbox = document.getElementById("statsbox");
    
    statsbox.style.display = "flex";
    statsbox.style.flexDirection = "row";
    statsbox.style.flexWrap = "wrap";
    statsbox.style.alignItems = "center";
    statsbox.style.justifyContent = "space-between";
    
    document.getElementById("wordPromptBox").style.display = "block";
    document.getElementById("responsebox").style.display = "block";

    // display word
    Quiz.displayWord(firstQuestion);
  }

  checkAnswer (userGuess, word, correctAnswers) {
    const failMessage = `Wrong guess for "${word}"\nYou guessed: ${userGuess}\nValid Answers: ${correctAnswers.join(", ")}`;

    const correctMessage = `"${userGuess}" was correct`;

    // check answer
    if (correctAnswers.includes(userGuess)) { // guess is correct
      Quiz._updateResponseText(correctMessage);
      this.correct += 1;
    } else { // guess is wrong
      Quiz._updateResponseText(failMessage);
      this.wrong += 1;
    }

    this.questionNum += 1;
    this.remainingNum -= 1;

    this.updateStats();
    
    this.nextQuestion();
  }

  updateStats() {
    function updateChild (child, x, childIsScore=false) {
      const currentText = child.textContent;
      const sepLoc = currentText.indexOf(':');

      // remove number from text
      const baseText = currentText.substring(0, sepLoc + 2);

      // update object with given new-value
      child.textContent = baseText + x; // x is given number

      if (childIsScore) {
        child.textContent += '%';
      }

      // apply previous styles
      child.style.fontSize = "15pt";
      child.style.margin = "30px";
    }
    
    const box = document.getElementById("statsbox");

    for (let child of box.children) {
      let text = child.textContent;
      if (text.startsWith("Correct:")) { // "correct" element
        updateChild(child, this.correct);
      } else if (text.startsWith("Wrong:")) { // "wrong" element
        updateChild(child, this.wrong);
      } else if (text.startsWith("Score:")) { // "score" element
        // calculate percentage, ternary op is to handle 0/0 error
        this.score = (this.score.toString() === "0") ? "0.00" : ((this.correct / (this.questionNum - 1)) * 100).toFixed(2);
        updateChild(child, this.score, true);
      } else if (text.startsWith("Question:")) { // "question" element
        updateChild(child, this.questionNum);
      } else if (text.startsWith("Remaining:")) { // "remaining" element
        updateChild(child, this.remainingNum);
      }
    }
  }

  static _updateResponseText (text) {
    document.getElementById("rbChild").textContent = text;
  }

  nextQuestion() {
    // remove used question from list
    this.questions.shift();

    if (this.questions.length === 0) {
      this.endQuiz();
      return;
    }

    // display new word
    const newWord = this.questions[0];
    Quiz.displayWord(newWord);
  }

  static displayWord(word) { // for wordpromptbox
    const box = document.getElementById("wpbChild");
    box.textContent = word; // change word
    box.lineHeight = "50px"; // center word in div
  }

  endQuiz() {
    // clear quiz divs
    document.getElementById("statsbox").style.display = "none";
    document.getElementById("wordPromptBox").style.display = "none";
    // document.getElementById("responsebox").style.display = "none";

    function sleep(ms) {
      return new Promise(resolve => {
        setTimeout(resolve, ms)
      });
    }
    
    // display quiz-score
    const message = `Chapter ${this.chapter} quiz is over. You got ${this.score + '%'} correct\nPress enter to take this quiz again`;

    // wait 3.25 seconds before replacing the message. This gives user time to see if they were right/wrong on the last question
    sleep(2250)
      .then(() => {
        Quiz._updateResponseText(message);
        delete window.quiz;
      });
  }
}

class Client {
  static onEnter (event, chapter) {
    event.preventDefault(); // do not append query to URL
    // get query
    const query = 
document.getElementById("queryBox").value.toLowerCase().trim();
    
    // clear input box
    const form = document.querySelector("#FORM");
    form.reset();

    if ((query === '') && (typeof window.quiz !== 'undefined')) {
      // if a quiz is active, return at blank 'enter' event
      return;
    }

    // onscreen message: 'type start to start the quiz'
    var result;
    if (window.quizNumber === 0) {
      // no previous quizzes have been given, so check for the start message
      result = this.clearElement("startTag").success;
    } else if (window.quizNumber > 0 && typeof window.quiz === 'undefined') {
      result = true;
    }
    
    if (result) {
      // chapter example: '1'
      const quiz = new Quiz(window.localStorage.getItem('ch').substring(3));
      window.quiz = quiz;
      window.quizNumber += 1;
      
    } else {
      const quiz = window.quiz;
      const questionWord = quiz.questions[0];
      const answers = quiz._qaps.get(questionWord);
      quiz.checkAnswer(query, questionWord, answers); // userGuess, word, correctAnswers
    }
  }

  static setupQuizScreen() {
    document.getElementById("");
  }

  static clearElement (id) {
    try {
      document.getElementById(id).remove();
      return {success: true}
    } catch (err) {
      return {success: false, error: err};
    }
  }

  static changeElementText(obj) {
    const id = obj?.id;
    const text = obj?.text;

    if (typeof id === 'undefined' || typeof text === 'undefined') {
      throw 'Invalid Id/text'
    }

    // update the element text
    document.getElementById(id).innerText = text;
  }
}
