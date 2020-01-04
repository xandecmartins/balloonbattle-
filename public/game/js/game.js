//<-------------------------- Config for Firebase and Musics-------------------------->

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDj_qwUrYCUsEstUJE9wo2ZpuLD_1LGjVY',
  authDomain: 'balloon-battle.firebaseapp.com',
  databaseURL: 'https://balloon-battle.firebaseio.com',
  projectId: 'balloon-battle',
  storageBucket: 'balloon-battle.appspot.com',
  messagingSenderId: '20012671944',
  appId: '1:20012671944:web:751a2fb4a307a7e04196fd',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

let database = firebase.firestore();

function getConfigServerRef() {
  return database.collection('configurations')
    .doc('configurations');
}

function getPlayerRefById(id) {
  return database.collection('players')
    .doc(id);
}

//<-------------------------- Constants and HTML Reference -------------------------->

const spriteInitialWidth = 40;
const spriteInitialHeight = 53;
const updateTime = 50;
const backgroundMusicPath = 'sounds/top-gear-soundtrack-track-1.mp3';

const canvasContainerElement = document.getElementById('canvas-container');
const startPlayElement = document.getElementById('start-btn');
const nameBoxElem = document.getElementById('name');
const scoreLabelElem = document.getElementById('score-count');
const scoreTextElem = document.getElementById('score-text');
const windLabelElem = document.getElementById('wind-label');
const windElem = document.getElementById('wind-show');

const nameLabelElem = document.getElementById('name-show');
const idLabelElem = document.getElementById('id-show');
const modalElem = document.getElementById('modal');
const modalContentElem = document.getElementById('modal-content');
const messageElem = document.getElementById('message');
const modalResultElem = document.getElementById('modal-result');
const modalContentResultElem = document.getElementById('modal-content-result');
const resultElem = document.getElementById('result');

let canvasHeight;
let canvasWidth;
let canvasElement = document.getElementById('canvas');

//<-------------------------- Util Functions -------------------------->

//src: https://gist.github.com/jed/982883
function createUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16),
  );
}

function getRandomSpeed(base_speed, minimumSpeed) {
  return Math.floor(Math.random() * base_speed) / 100 + minimumSpeed;
}

function generateRandomXPos(limit) {
  return Math.floor(Math.random() * limit);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

//<-------------------------- Game Classes(Prototypes) -------------------------->

function HUD() {
  this.name;
  this.id;
  this.score = 0;
}

function Sprite(x, y, type, points, speed) {
  this.id = createUUID();
  this.positionX = x;
  this.positionY = y;
  this.points = points;
  this.speed = speed;
  this.type = type;
}

function Game() {
  this.config;
  this.backMusic;
  this.hud;
  this.intervalId;
  this.densityStep;
  this.spriteArray;
  this.hasLocalFinished;
}

Game.prototype.startGame = function () {
  startPlayElement.style.display = 'none';
  this.intervalId = setInterval(() => {
    this.updateGame();
  }, updateTime);
};

Game.prototype.clearPlayArea = function () {
  canvasElement.remove();
};

Game.prototype.restartGame = function () {
  startPlayElement.style.display = 'block';
  this.intervalId = setInterval(() => {
    this.updateGame();
  }, updateTime);
  this.pauseLocalGame();
  this.initGame();
  canvasElement = document.createElement('div');
  canvasElement.setAttribute('id', 'canvas');
  canvasContainerElement.appendChild(canvasElement);
  modalResultElem.style.display = 'none';
  modalContentResultElem.style.display = 'none';
  modalElem.style.display = 'block';
  modalContentElem.style.display = 'block';
  canvasElement.style.display = 'block';
};

Game.prototype.pauseLocalGame = function () {
  clearInterval(this.intervalId);
};

Game.prototype.loadServerConfig = function () {
  getConfigServerRef()
    .onSnapshot(doc => {
      if (doc.exists) {
        this.config = {
          spriteSize: doc.data().balloon_size,
          baseSpeed: doc.data().base_speed,
          maxSpriteQuantity: doc.data().max_balloon_quantity,
          isPaused: doc.data().is_paused,
          hasFinished: doc.data().has_finished,
          density: doc.data().density,
          showName: doc.data().show_name,
          showScore: doc.data().show_score,
          showId: doc.data().show_id,
          showWind: doc.data().show_wind,
          windSpeed: doc.data().wind_speed,
          gameOpen: doc.data().game_open,
          showSpriteSpeed: doc.data().show_sprite_speed,
          types: doc.data().types,
          minSpeed: doc.data().min_speed,
        };
        this.applyConfig();
      } else {
        console.error('Config doesn\'t exist on the server');
      }
    });
};

Game.prototype.updateSpritePosition = function (sprite) {
  sprite.bottom += sprite.speed;
  sprite.pos += this.config.windSpeed;
};

Game.prototype.drawSprite = function (sprite) {

  if (this.config.showSpriteSpeed) {
    sprite.el.innerHTML = Math.floor(sprite.speed * 100) / 100 + '';
  } else {
    sprite.el.innerHTML = '';
  }

  if (!this.config.types[sprite.type].enabled) {
    sprite.el.style.display = 'none';
  } else {
    sprite.el.style.display = 'block';
  }

  sprite.el.style.bottom = sprite.bottom + 'px';
  sprite.el.style.left = sprite.pos + 'px';
};

Game.prototype.updateScore = function (score, type, config) {
  scoreLabelElem.innerHTML = score;
  getPlayerRefById(this.hud.id)
    .update({
      score: score,
      timestamp: new Date().getTime(),
    })
    .then(function () {
      const soundEffect = new Audio(config.types[type].audio_path);
      soundEffect.play()
        .catch((error) => {
          console.log('Problem during audio play', error);
        });

    })
    .catch(function (error) {
      console.log('Data could not be saved.' + error);
    });
};

Game.prototype.buildSprite = function (type) {
  const transformedHeight = spriteInitialHeight * this.config.spriteSize;
  const transformedWidth = spriteInitialWidth * this.config.spriteSize;
  const sprite = new Sprite(0, -spriteInitialHeight * this.config.spriteSize, type.type, type.points,
    getRandomSpeed(this.config.baseSpeed, this.config.minSpeed));
  sprite.positionX = generateRandomXPos(canvasWidth-transformedWidth);

  const el = document.createElement('div');
  el.className = 'sprite';
  el.style.backgroundImage = 'url('+type.icon+')';
  el.style.left = sprite.positionX + 'px';
  el.style.bottom = sprite.positionY + 'px';
  el.style.backgroundSize = '100% 100%';
  el.style.width = transformedWidth + 'px';
  el.style.height = transformedHeight + 'px';
  el.style.textAlign = 'center';
  el.style.verticalAlign = 'middle';
  el.style.lineHeight = transformedHeight + 'px';

  const gameRef = this;
  el.onclick = () => {
    if (!gameRef.config.isPaused) {
      gameRef.hud.score += type.points;
      gameRef.updateScore(gameRef.hud.score, type.type, gameRef.config);
      canvasElement.removeChild(el);
    }
  };

  canvasElement.appendChild(el);
  return {
    el: el,
    speed: sprite.speed,
    points: sprite.points,
    type: sprite.type,
    bottom: sprite.positionY,
    pos: sprite.positionX,
    width: transformedWidth,
    height: transformedHeight,
  };
};

Game.prototype.applyConfig = function () {
  windElem.innerHTML = this.config.windSpeed;
  if (this.config.hasFinished) {
    modalElem.style.display = 'none';
    modalContentElem.style.display = 'none';
    this.endGame();
  } else if (this.hasLocalFinished) {
    this.restartGame();
  }

  if (!this.config.isPaused && this.backMusic && this.backMusic.paused && !this.hasLocalFinished) {
    this.playBackgroundMusic();
  } else if (this.config.isPaused) {
    this.pauseBackgroundMusic();
  }

  if (this.config.showId) {
    idLabelElem.style.display = 'block';
  } else {
    idLabelElem.style.display = 'none';
  }

  if (this.config.showName) {
    nameLabelElem.style.display = 'block';
  } else {
    nameLabelElem.style.display = 'none';
  }

  if (this.config.showWind) {
    windLabelElem.style.display = 'inline';
  } else {
    windLabelElem.style.display = 'none';
  }

  if (this.config.showScore) {
    scoreLabelElem.style.display = 'inline';
    scoreTextElem.style.display = 'inline';
  } else {
    scoreLabelElem.style.display = 'none';
    scoreTextElem.style.display = 'none';
  }

  this.spriteArray.forEach((element) => {
    let transformedHeight = spriteInitialHeight * this.config.spriteSize;
    let transformedWidth = spriteInitialWidth * this.config.spriteSize;

    element.el.style.width = transformedWidth + 'px';
    element.width = transformedWidth;

    element.el.style.height = transformedHeight + 'px';
    element.height = transformedHeight;

    element.speed = getRandomSpeed(this.config.baseSpeed, this.config.minSpeed);
    element.points = this.config.types[element.type].points;

    element.el.backgroundImage = 'url('+this.config.types[element.type].icon+')';
  });
};

//Source https://codetheory.in/weighted-biased-random-number-generation-with-javascript-based-on-probability/
Game.prototype.randomType = function () {

  const weight = Object.values(this.config.types)
    .map(function (type) {
      return type.prob;
    });

  const typeList = Object.values(this.config.types)
    .map(function (type) {
      return type.type;
    });

  const total_weight = weight.reduce(function (prev, cur, i, arr) {
    return prev + cur;
  });

  const random_num = rand(0, total_weight);
  let weight_sum = 0;

  for (let i = 0; i < weight.length; i++) {
    weight_sum += weight[i];
    weight_sum = +weight_sum.toFixed(2);

    if (random_num <= weight_sum) {
      return typeList[i];
    }
  }
};

Game.prototype.generateSprites = function () {
  for (let i = 0; i < parseInt(this.densityStep, 10); i++) {
    this.spriteArray.push(this.buildSprite(this.config.types[this.randomType()]));
  }
};

Game.prototype.moveSprites = function () {
  this.spriteArray.forEach((sprite) => {
    this.updateSpritePosition(sprite);
    this.drawSprite(sprite);
  });
};

Game.prototype.checkLastBalloon = function () {
  if (this.spriteArray.length === this.config.maxSpriteQuantity
    && Math.min.apply(Math, this.spriteArray.map(el => el.bottom)) >= canvasHeight + spriteInitialHeight * this.config.spriteSize) {
    this.pauseLocalGame();
    this.showResult(this.buildWaitMessage());
  }
};

Game.prototype.updateGame = function () {
  if (!this.config.isPaused && !this.config.hasFinished) {
    this.densityStep += this.config.density;
    if (this.densityStep >= 1 && this.spriteArray.length < this.config.maxSpriteQuantity) {
      this.generateSprites();
      this.densityStep = 0;
    }
    this.moveSprites();
  } else {
    this.pauseBackgroundMusic();
  }

  this.checkLastBalloon();
};

Game.prototype.buildGameOverMessage = function (firstPlayerDoc) {
  let gameOverText = 'GAME OVER\n\n';
  if (firstPlayerDoc.exists) {
    if (firstPlayerDoc.data().id === this.hud.id) {
      gameOverText += 'I\'m the winner!\n ';
    }
    gameOverText += ('Congratulations ' + firstPlayerDoc.data().name + '!\n');
    gameOverText += ('Winner! \n\n' + firstPlayerDoc.data().score + ' points');
  } else {
    gameOverText += 'Leader board is empty';
  }
  return gameOverText;
};

Game.prototype.buildWaitMessage = function () {
  let gameOverText = 'GAME OVER\n\n At least for you, for now...\n\n';
  gameOverText += ('Wait for the final result\n');
  gameOverText += ('No worries, you did great!');
  return gameOverText;
};

Game.prototype.showResult = function (text) {
  this.pauseBackgroundMusic();

  canvasElement.style.display = 'none';
  modalResultElem.style.display = 'block';
  modalContentResultElem.style.display = 'block';
  resultElem.style.display = 'block';
  resultElem.innerText = text;
};

Game.prototype.endGame = function () {
  this.pauseBackgroundMusic();
  this.hasLocalFinished = true;
  this.pauseLocalGame();
  this.clearPlayArea();
  database.collection('players')
    .orderBy('score', 'desc')
    .limit(1)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        this.showResult(this.buildGameOverMessage(doc));
      });

    })
    .catch((error) => {
      console.log('Error getting document:', error);
    });
};

Game.prototype.playBackgroundMusic = function () {
  this.pauseBackgroundMusic();
  this.backMusic = new Audio(backgroundMusicPath);
  this.backMusic.loop = true;
  this.backMusic.volume = 0.3;
  this.backMusic.play()
    .catch((error) => {
      console.log('Problem during audio play', error);
    });
};

Game.prototype.pauseBackgroundMusic = function () {
  if (this.backMusic) {
    this.backMusic.pause();
  }
};

Game.prototype.initGame = function () {
  this.hasLocalFinished = false;
  this.spriteArray = [];
  this.hud = new HUD();
  scoreLabelElem.innerHTML = this.hud.score;
  nameLabelElem.innerHTML = '';
  windElem.innerHTML = '0';
  this.densityStep = 1;

  if (!canvasHeight) {
    canvasHeight = parseInt(canvasElement.style.height.replace('px', ''), 10);
  }
  if (!canvasWidth) {
    canvasWidth = parseInt(canvasElement.style.width.replace('px', ''), 10);
  }
};

//<-------------------------- Env event setup and load -------------------------->

function validateStart(game, name) {
  const messages = [];
  if (!game.config.gameOpen) {
    messages.push('* Wait until the next session, the game is closed');
  }

  if (!name || name.trim().length === 0) {
    messages.push('* Please, inform your name to start');
  }
  return messages;
}

function handleStartButtonClick(game) {

  let name = nameBoxElem.value + '';
  const messages = validateStart(game, name);
  if (messages.length) {
    messageElem.style.display = 'block';
    messageElem.innerText = messages.join('\n');
  } else {
    game.playBackgroundMusic();
    game.hud.id = createUUID();
    game.hud.name = name.trim();

    database.collection('players')
      .doc(game.hud.id)
      .set({
        name: game.hud.name,
        id: game.hud.id,
        score: game.hud.score,
        timestamp: new Date().getTime(),
      })
      .then(() => {
        game.startGame();
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });

    modalElem.style.display = 'none';
    modalContentElem.style.display = 'none';
    messageElem.style.display = 'none';
    nameLabelElem.innerHTML = game.hud.name;
    idLabelElem.innerHTML = 'player id: ' + game.hud.id;
  }
}

function setupInitialEvents(game) {
  startPlayElement.onclick = () => {
    handleStartButtonClick(game);
  };

  nameBoxElem.addEventListener('keyup', function (event) {
    event.preventDefault();
    if (event.key === 'Enter') {
      handleStartButtonClick(game);
    }
  });
}

//<-------------------------- Main start -------------------------->

window.addEventListener('load', () => {
  const game = new Game();
  game.loadServerConfig();
  game.initGame();
  setupInitialEvents(game);
});
