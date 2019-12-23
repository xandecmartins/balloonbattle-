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

const soundMap = {
  'normal': new Audio('sounds/balloon-pop-sound-effect.mp3'),
  'special': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
  'surprise_good': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
  'surprise_bad': new Audio('sounds/explosion-sound-effect.mp3'),
  'background_music': new Audio('sounds/top-gear-soundtrack-track-1.mp3'),
};

//<-------------------------- Util Functions -------------------------->

//src: https://gist.github.com/jed/982883
function createUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16),
  );
}

function getLuckyFactor() {
  return Math.floor(Math.random() * 10) % 2 === 0 ? 1 : -1;
}

function getRandomSpeed(base_speed) {
  return Math.floor(Math.random() * base_speed) / 100;
}

function generateRandomXPos(limit) {
  return Math.floor(Math.random() * limit);
}

//<-------------------------- Constants and HTML Reference -------------------------->

const spriteInitialWidth = 40;
const spriteInitialHeight = 53;
const updateTime = 50;
let canvasHeight = 450;

const canvasElement = document.getElementById('canvas');
const startPlayElement = document.getElementById('start-btn');
const nameBoxElem = document.getElementById('name');
const scoreLabelElem = document.getElementById('score-count');
const scoreTextElem = document.getElementById('score-text');
const nameLabelElem = document.getElementById('name-show');
const idLabelElem = document.getElementById('id-show');
const modalElem = document.getElementById('modal');
const modalContentElem = document.getElementById('modal-content');
const messageElem = document.getElementById('message');
const modalResultElem = document.getElementById('modal-result');
const modalContentResultElem = document.getElementById('modal-content-result');
const resultElem = document.getElementById('result');

//<-------------------------- Game Classes -------------------------->

class HUD {
  name;
  id;
  score;

  constructor() {
    this.score = 0;
  }

}

class Sprite {
  id;
  positionX;
  positionY;
  color;
  type;
  points;
  speed;

  constructor(x, y, color, type, points, speed) {
    this.id = createUUID();
    this.positionX = x;
    this.positionY = y;
    this.color = color;
    this.points = points;
    this.speed = speed;
    this.type = type;
  }
}

class Game {

  config;
  backMusic;
  hud;

  intervalId;
  densityStep;
  spriteArray;

  startGame() {
    startPlayElement.style.display = 'none';
    this.intervalId = setInterval(() => {
      this.updateGame();
    }, updateTime);
  }

  pauseLocalGame() {
    clearInterval(this.intervalId);
  }

  loadServerConfig() {
    getConfigServerRef()
      .onSnapshot(doc => {
        if (doc.exists) {
          this.config = {
            spriteSize: doc.data().balloon_size,
            specialSprite: doc.data().special_balloon,
            surpriseSprite: doc.data().surprise_balloon,
            baseSpeed: doc.data().base_speed,
            maxSpriteQuantity: doc.data().max_balloon_quantity,
            isPaused: doc.data().is_paused,
            hasFinished: doc.data().has_finished,
            density: doc.data().density,
            showName: doc.data().show_name,
            showScore: doc.data().show_score,
            showId: doc.data().show_id,
          };
          this.applyConfig();
        } else {
          this.config = {
            spriteSize: 1,
            specialSprite: true,
            surpriseSprite: true,
            baseSpeed: 201,
            maxSpriteQuantity: 500,
            isPaused: false,
            hasFinished: false,
            density: 1000 / 4000,
            showName: true,
            showScore: true,
            showId: true,
          };
          console.log('Config doesn\'t exist on the server, using default values');
        }
      });

  }

  updateScore(score, type) {
    scoreLabelElem.innerHTML = score;
    getPlayerRefById(this.hud.id)
      .update({
        score: score,
      })
      .then(function () {
        soundMap[type].play();
      })
      .catch(function (error) {
        console.log('Data could not be saved.' + error);
      });

  }

  buildSprite(color, type, points) {
    const sprite = new Sprite(0, -spriteInitialHeight * this.config.spriteSize, color, type, points,
      getRandomSpeed(this.config.baseSpeed));
    sprite.positionX = generateRandomXPos(parseInt(canvasElement.style.width, 10) * 0.95);

    const el = document.createElement('div');
    el.className = 'sprite ' + sprite.color;
    el.style.left = sprite.positionX + 'px';
    el.style.bottom = sprite.positionY + 'px';
    el.style.backgroundSize = '100% 100%';
    el.style.width = spriteInitialWidth * this.config.spriteSize + 'px';
    el.style.height = spriteInitialHeight * this.config.spriteSize + 'px';

    const gameRef = this;
    el.onclick = () => {
      if (!gameRef.config.isPaused) {
        gameRef.hud.score += points;
        gameRef.updateScore(gameRef.hud.score, type);
        canvasElement.removeChild(el);
      }
    };

    canvasElement.appendChild(el);
    return {
      el: el,
      speed: sprite.speed,
      points: sprite.points,
      type: type,
      bottom: sprite.positionY,
    };
  }

  applyConfig() {

    if(this.config.hasFinished){
      modalElem.style.display = 'none';
      modalContentElem.style.display = 'none';
      this.endGame();
    } else {
      modalResultElem.style.display = 'none';
      modalContentResultElem.style.display = 'none';
    }

    if (!this.config.isPaused && !this.config.hasFinished && this.backMusic) {
      this.backMusic.play();
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

    if (this.config.showScore) {
      scoreLabelElem.style.display = 'inline';
      scoreTextElem.style.display = 'inline';
    } else {
      scoreLabelElem.style.display = 'none';
      scoreTextElem.style.display = 'none';
    }

    this.spriteArray.forEach((element) => {
      element.el.style.width = spriteInitialWidth * this.config.spriteSize + 'px';
      element.el.style.height = spriteInitialHeight * this.config.spriteSize + 'px';
      element.speed = getRandomSpeed(this.config.baseSpeed);
    });
  }

  generateSprites() {
    for (let i = 0; i < parseInt(this.densityStep, 10); i++) {
      let randomType = Math.floor(Math.random() * 100);
      if (this.config.specialSprite && (randomType % 20 === 0)) {
        this.spriteArray.push(this.buildSprite('special', 'special', 300));
      } else if (this.config.surpriseSprite && (randomType % 15 === 0)) {
        let luckyFactor = getLuckyFactor();
        this.spriteArray.push(this.buildSprite('surprise', luckyFactor > 0 ? 'surprise_good' : 'surprise_bad', 400 * luckyFactor));
      } else {
        this.spriteArray.push(this.buildSprite('green', 'normal', 150));
      }
    }
  }

  moveSprites() {
    this.spriteArray.forEach((element) => {
      const newPos = parseInt(element.el.style.bottom, 10) + (3 + element.speed);
      element.el.style.bottom = newPos + 'px';
      element.bottom = newPos;
      if (element.type === 'special' && !this.config.specialSprite) {
        element.el.style.display = 'none';
      } else if (element.type === 'special') {
        element.el.style.display = 'block';
      }

      if (element.type.startsWith('surprise') && !this.config.surpriseSprite) {
        element.el.style.display = 'none';
      } else if (element.type.startsWith('surprise')) {
        element.el.style.display = 'block';
      }
    });
  }

  updateGame() {
    if (!this.config.isPaused && !this.config.hasFinished) {
      this.densityStep += this.config.density;
      if (this.densityStep >= 1 && this.spriteArray.length < this.config.maxSpriteQuantity) {
        this.generateSprites();
        this.densityStep = 0;
      }
      this.moveSprites();

    } else if (this.config.isPaused && this.backMusic) {
      this.backMusic.pause();
    }

    if (this.spriteArray.length === this.config.maxSpriteQuantity
      && Math.min.apply(Math, this.spriteArray.map(el => el.bottom)) >= canvasHeight + spriteInitialHeight * this.config.spriteSize) {
      this.pauseLocalGame();
      this.showResult(this.buildWaitMessage());
    }
  }

  buildGameOverMessage(firstPlayerDoc) {
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
  }

  buildWaitMessage() {
    let gameOverText = 'GAME OVER\n\n At least for you, for now...\n\n';
    gameOverText += ('Wait for the final result\n');
    gameOverText += ('No worries, you did great!');
    return gameOverText;
  }

  showResult(text) {
    if (this.backMusic) {
      this.backMusic.pause();
    }

    canvasElement.style.display = 'none';
    modalResultElem.style.display = 'block';
    modalContentResultElem.style.display = 'block';
    resultElem.style.display = 'block';
    resultElem.innerText = text;
  }

  endGame() {
    this.pauseLocalGame();
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
  }

  initGame() {
    this.spriteArray = [];
    this.hud = new HUD();
    this.densityStep = 1;
    canvasHeight = parseInt(canvasElement.style.height.replace('px', ''), 10);

    this.backMusic = soundMap['background_music'];
    this.backMusic.loop = true;
    this.backMusic.volume = 0.3;
    this.backMusic.play();
  }
}

//<-------------------------- Env event setup and load -------------------------->

function handleStartButtonClick(game) {
  let name = nameBoxElem.value + '';
  if (name && name.trim().length !== 0) {
    game.hud.id = createUUID();
    game.hud.name = name;

    database.collection('players')
      .doc(game.hud.id)
      .set({
        name: game.hud.name,
        id: game.hud.id,
        score: game.hud.score,
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
  } else {
    messageElem.style.display = 'block';
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
