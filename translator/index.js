window.onload = () => {
  Server.getJsonFromApi();
  Server.setMostRecentQuery('');

  // when the user presses tab, set the entry box to focus
  document.addEventListener('keypress', event => {
    if (event.code === 'Tab') {
      document.getElementById('queryBox').focus();
    }
  })

  Server.logvisit();
}

class Server {
  static logvisit(today = new Date()) {
    const date = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
    let visits = 0;
    fetch('https://spanishmzecheru.fireapis.com/visits/1', {
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

            fetch('https://spanishmzecheru.fireapis.com/visits/1', {
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

  static valueExistsInKey(word, translation) {
    return this.getWordBank()[word].includes(translation); // true or false
  }
  static setMostRecentQuery(q) {
    window.localStorage.setItem('mostRecentQuery', q.query);
  }

  static getMostRecentQuery() {
    return window.localStorage.getItem('mostRecentQuery');
  }

  static getWordBank() {
    return JSON.parse(window.localStorage.getItem('wordBank'));
  }

  static getJsonFromApi() {
    const xhr = new XMLHttpRequest();
    const url = "https://api.jsonbin.io/v3/b/6211d38fca70c44b6e9ebc8c/latest";

    xhr.responseType = 'json';
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        // adds the word bank to temp local storage
        window.localStorage.setItem('wordBank', JSON.stringify(xhr.response.record));
      }
    }
    xhr.open('GET', url);
    xhr.setRequestHeader("X-Master-Key", "$2b$10$n6W.cXqGgN1v2iLJLZO4p.NuiBp6RPQVZJRJcr7z8uuHF3pADzgWO");
    xhr.send();
  }

  static getQuery(query) {
    if (document.getElementById("output").textContent === 'Please wait...') { // if the api is currently updating the json, don't proceed until it's finished
      return 'Please wait...'; // will display please wait on the output div
    }
    if (query === '' || query === ' ') {
      return 'Default all adjectives to singular masculine, do not conjugate verbs'; // nothing will be shown to the output div
    }

    const wordBank = Server.getWordBank();
    Server.setMostRecentQuery({ query: query });

    const noneFoundMessage = "The word/phrase you're looking could not be found. Would you like to add a translation?";
    const enterValuePrompt = `Your word/phrase is "${query}".\n\nEnter the translation you were looking for:`;
    const noTranslationGivenMessage = `No translation was provided for the word "${query}".\n\nDo you want to give a translation?`;

    const response = wordBank[query];

    // query does not exist in word bank; show error
    if (typeof response === 'undefined') {
      const _prompt = confirm(noneFoundMessage); // askOkCancel() equiv
      if (_prompt) {
        let _continue = true;
        let translation = null;
        do {
          translation = prompt(enterValuePrompt); // popup with input field
          if (translation === '' || translation === null) {
            const _confirm = confirm(noTranslationGivenMessage);
            if (!_confirm) { // user does not want to give a translation
              return 'N/A';
            } // '_continue' is still true and the user will be asked for a translation again
          } else {
            _continue = false;
          }
        } while (_continue);
        this.addKVpair(query, translation);
        return ['await request finish']; // parent func will check for list, if list don't show 'undefined'
      } else { return 'N/A'; };
    } else { return response.join(", "); }
  }

  static addKVpair(key, value) {
    const _key = key.trim().toLowerCase(); // remove whitespaces
    const _value = value.trim().toLowerCase();

    /* update json in api */

    const url = "https://api.jsonbin.io/v3/b/6211d38fca70c44b6e9ebc8c";
    let _WORDBANK = JSON.parse(window.localStorage.getItem('wordBank'));

    let addedKey = true;
    let addedValue = true;

    // trans for key
    if (Object.keys(_WORDBANK).includes(_key)) {
      if (Server.valueExistsInKey(_key, _value) === false) { // if value not in key
        _WORDBANK[_key].push(_value); // append new translation
      } else {
        addedKey = false;
      }
    } else {
      _WORDBANK[_key] = [_value]; // set translation for '_key'
      // value was added to key
    }

    // trans for value
    if (Object.keys(_WORDBANK).includes(_value)) {
      if (Server.valueExistsInKey(_value, _key) === false) { // if key not in value
        _WORDBANK[_value].push(_key); // append new translation
      } else {
        addedValue = false;
      }
    } else {
      _WORDBANK[_value] = [_key]; // set translation for '_value'
      // key was added to value
    }

    if (addedKey === false && addedValue === false) { Client.display(`Both words/phrases already exist`); return; }; // nothing to add

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        // update localstorage
        this.getJsonFromApi();
        // announce completion
        Client.display(`Added "${_key}" and "${_value}"`);
      }
    }
    xhr.open('PUT', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-Master-Key", "$2b$10$n6W.cXqGgN1v2iLJLZO4p.NuiBp6RPQVZJRJcr7z8uuHF3pADzgWO");
    xhr.send(JSON.stringify(_WORDBANK));
  }
}

function replaceSpecialChars(str) {
  const rchars = [{initial: 'ñ', replace: 'n'}, {initial: 'á', replace: 'a'}, {initial: 'é', replace: 'e'}, {initial: 'í', replace: 'i'}, {initial: 'ó', replace: 'o'}, {initial: 'ú', replace: 'u'}];
  
  for (let i = 0; i < rchars.length; i++) {
    str = str.replaceAll(rchars[i].initial, rchars[i].replace);
  }
  
  return str;
}

class Client {
  static onEnter(event) {
    event.preventDefault();
    //window.history.back();

    const query = replaceSpecialChars(document.getElementById("queryBox").value.toLowerCase().trim());

    // clear field
    const form = document.querySelector("#FORM");
    form.reset();

    const response = Server.getQuery(query.toLowerCase().trim());
    if (Array.isArray(response)) {
      // 'array' type is only given if 'request finish' is being awaited
      this.display('Please wait...');
    } else { this.display(response); }; // display the response
  }

  static display(text) {
    document.getElementById("output").innerHTML = ''; // clear div
    let output = document.createElement("p");	// create new element for output div
    output.innerText = text; // creating new element each time might cause trouble. refactor for performance boost

    // style
    output.style.fontSize = "20px";
    output.style.fontWeight = "bold";

    // add the element to the div
    document.getElementById("output").appendChild(output); // Add the object to the DOM
  }
};

class Buttons {
  // for first func
  static _continueMessage = `You are about to add a new translation for a word or phrase. Press 'ok' to continue`;
  static _addWordMessage = `Enter a new word/phrase to create a translation, or enter an already existing word/phrase to add a translation`;
  static _addTranslationMessage = (word) => { return `Add a translation for this word/phrase: ${word}` };
  static _createTranslationMessage = (word) => { return `Create a translation for this word/phrase: ${word}` };
  static _mostRecentQuery = null;

  // for second func
  static _chooseWordToEditMessage = 'Enter the word you would like to edit: ';
  static _chooseTranslationToEditMessage = (translations) => { // list of values for key
    let _translations = [];
    translations.forEach(translation => {
      _translations.push(`[${translations.indexOf(translation)}] ${translation}`);
    }); // will look like [0] gato, [1] gatito
    return `This word has the following translations:\n\n${_translations.join(", ")}\n\nEnter the number of the translation you would like to edit`
  };

  static _editPrompt(word, translation) {
    return `Is this translation (${translation}) for the word/phrase (${word}) correct?\n\nIf not, enter a new translation or enter a period (.) to delete this translation or a comma (,) to remove the word and all of its translations:`;
  }



  static addWord() {
    this._mostRecentQuery = Server.getMostRecentQuery(); // autofill value is previous query as it's most likely to be edited
    if (typeof this._mostRecentQuery === 'undefined') {
      this._mostRecentQuery = '';
    }
    try {
      const kv = JSON.parse(this._getWordAndTranslation(this._mostRecentQuery));

      if (kv.word === '' || kv.word === null || kv.translation === '' || kv.translation === null || typeof kv.translation !== 'string' || typeof kv.word !== 'string') { return; } // return because user did provie key and value

      const k = kv.word;
      const v = kv.translation;
      Server.addKVpair(k, v);
    } catch (err) {
      // this will fail if the user did not provide a key AND a value. if true, do not proceed
      return;
    }
  }

  static rating(_mrq) {
    const _contMsg = `If you have found a word with one or more incorrect definitions, you may edit the word's definitions in the next step. Press 'ok' to continue`;
    const _giveIntNotice = `Enter a whole number`;
    const _givenIntMustBeInList = `Given number must be from brackets above`;

    const _continue = confirm(_contMsg);
    // if mrq is undef, display string
    if (_continue) {
      const wordToEdit = (prompt(this._chooseWordToEditMessage, (_mrq === 'undefined') ? '' : _mrq)).trim().toLowerCase();
      if (wordToEdit === null || wordToEdit === '' || wordToEdit === ' ') {
        return;
      }
      const _translations = Server.getWordBank()[wordToEdit];
      if (typeof _translations === 'undefined' || _translations === 'undefined') {
        Client.display(`The word/phrase you're trying to edit does not exist (${wordToEdit})`);
        return;
      };

      let _wordBank = Server.getWordBank();

      let index = 0; // will be changed if there are more than 1 translations for wordToEdit

      if (_wordBank[wordToEdit].length !== 1) { // no need to have user select
        let _CONTINUE = false;
        do {
          const translationToEditIndex = (prompt(this._chooseTranslationToEditMessage(_translations), (_CONTINUE === true) ? _giveIntNotice : (_CONTINUE === null) ? _givenIntMustBeInList : '')).trim();

          if (translationToEditIndex === null || translationToEditIndex === '' || translationToEditIndex === ' ') { return; };
          if (isNaN(translationToEditIndex) === false) { // means there is a number
            // user gave number, continue
            index = parseInt(translationToEditIndex);
            // check if given index exists
            const indexNum = _translations.length - 1;
            if (index > indexNum || index < 0) { // error handling
              // index does not exist
              _CONTINUE = null; // next loop will show _givenIntMustBeInList msg
            } else { _CONTINUE = false; }; // 'break'
          } else { _CONTINUE = true; }; //
        } while (_CONTINUE || _CONTINUE === null);
      };

      /* at this point, translationToEditIndex is an integer, and an index that exists */

      // show edit menu
      const currentTranslation = _wordBank[wordToEdit][index];
      const newTranslation = prompt(this._editPrompt(wordToEdit, currentTranslation), currentTranslation).trim().toLowerCase(); // word to autofill will be word at the index the user passed for the word they wish to edit

      // catch invalid responses
      if (newTranslation === null || newTranslation === '' || newTranslation === ' ') {
        return false; // invalid response
      }

      if (newTranslation === false) { return; }; // invalid response; catch error

      if (newTranslation === '.') {
        if (_wordBank[wordToEdit].length === 1) {
          Client.display(`The translation "${currentTranslation}" was not deleted from "${wordToEdit}" because there is only one translation for "${wordToEdit}"\nConsider replacing the translation instead`);
          return;
        }
        _wordBank[wordToEdit].splice(index, 1);
      } else if (newTranslation === ',') {
        Client.display(`The word/phrase "${wordToEdit}" and all of its translations have been successfully removed.`)
        delete _wordBank[wordToEdit]; // remove the key and all of its values from the word bank
      } else {
        _wordBank[wordToEdit][index] = newTranslation;
      }

      // add updated word bank to the jsonbin
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'text';
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          // update localstorage
          Server.getJsonFromApi();
          // success message
          Client.display(`Updated word "${wordToEdit}". Translations for "${wordToEdit}" are now:\n${_wordBank[wordToEdit].join(", ")}`);
        }
      };

      xhr.open("PUT", "https://api.jsonbin.io/v3/b/6211d38fca70c44b6e9ebc8c", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-Master-Key", "$2b$10$n6W.cXqGgN1v2iLJLZO4p.NuiBp6RPQVZJRJcr7z8uuHF3pADzgWO");
      xhr.send(JSON.stringify(_wordBank));
    }
  }

  static _getWordAndTranslation(_MRQ) { // mrq is most recent query
    const _confirm = confirm(this._continueMessage);
    if (_confirm) {
      // if _MRQ if undef do not insert 'undefined', instead insert empty string
      const _word = prompt(this._addWordMessage, (_MRQ === 'undefined') ? '' : _MRQ);
      if (_word !== null && _word !== '' && _word !== ' ') {
        if (Object.keys(Server.getWordBank()).includes(_word)) {
          const _translation = prompt(this._addTranslationMessage(_word));
          return JSON.stringify({ word: _word, translation: _translation });
        } else {
          const _translation = prompt(this._createTranslationMessage(_word));
          return JSON.stringify({ word: _word, translation: _translation });
        }
      }
    } else { return false; }
  }
}