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

const balloonInitialWidth = 40;
const balloonInitialHeight = 53;
const updateTime = 50;

class Game {

  config;
  backMusic;
  name;
  id;
  score;

  intervalId;
  densityStep;
  balloonsArray;

  canvasElement = document.getElementById('canvas');
  playElement = document.getElementById('start-btn');
  scoreElem = document.getElementById('score-count');
  scoreTextElem = document.getElementById('score-text');
  nameElem = document.getElementById('name-show');
  idElem = document.getElementById('id-show');

  constructor() {
    const thiz = this;
    this.updater = () => {
      thiz.updateGame();
    };
  }

  startGame() {
    this.playElement.style.display = 'none';
    this.intervalId = setInterval(this.updater, updateTime);
    this.backMusic = soundMap['background_music'];
    this.backMusic.loop = true;
    this.backMusic.volume = 0.3;
    this.backMusic.play();
  }

  pauseLocalGame() {
    clearInterval(this.intervalId);
  }

  loadServerConfig() {
    getConfigServerRef()
      .onSnapshot(doc => {
        if (doc.exists) {
          this.config = {
            balloonSize: doc.data().balloon_size,
            specialBalloon: doc.data().special_balloon,
            surpriseBalloon: doc.data().surprise_balloon,
            baseSpeed: doc.data().base_speed,
            maxBalloonQuantity: doc.data().max_balloon_quantity,
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
            balloonSize: 1,
            specialBalloon: true,
            surpriseBalloon: true,
            baseSpeed: 201,
            maxBalloonQuantity: 500,
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
    this.scoreElem.innerHTML = score;
    getPlayerRefById(this.id)
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

  buildBalloon(color, type, points) {
    const tempBalloon = new Balloon(0, -balloonInitialHeight * this.config.balloonSize, color, type, points);
    tempBalloon.positionX = generateRandomXPos(parseInt(this.canvasElement.style.width,10)*0.95);

    const el = document.createElement('div');
    el.className = 'balloon ' + tempBalloon.color;
    el.style.left = tempBalloon.positionX + 'px';
    el.style.bottom = tempBalloon.positionY + 'px';
    el.style.backgroundSize = '100% 100%';
    el.style.width = balloonInitialWidth * this.config.balloonSize + 'px';
    el.style.height = balloonInitialHeight * this.config.balloonSize + 'px';

    const thiz = this;
    el.onclick = () => {
      if (!thiz.config.isPaused) {
        thiz.score += points;
        thiz.updateScore(thiz.score, type);
        this.canvasElement.removeChild(el);
      }
    };

    this.canvasElement.appendChild(el);
    return {
      el: el,
      speed: getRandomSpeed(this.config.baseSpeed),
      points: tempBalloon.points,
      type: type,
    };
  }

  applyConfig() {
    if (!this.config.isPaused && !this.config.hasFinished && this.backMusic) {
      this.backMusic.play();
    }

    if(this.config.showId){
      this.idElem.style.display = 'block';
    } else {
      this.idElem.style.display = 'none';
    }

    if(this.config.showName){
      this.nameElem.style.display = 'block';
    } else {
      this.nameElem.style.display = 'none';
    }

    if(this.config.showScore){
      this.scoreElem.style.display = 'inline';
      this.scoreTextElem.style.display = 'inline';
    } else {
      this.scoreElem.style.display = 'none';
      this.scoreTextElem.style.display = 'none';
    }


    this.balloonsArray.forEach((element) => {
      element.el.style.width = balloonInitialWidth * this.config.balloonSize + 'px';
      element.el.style.height = balloonInitialHeight * this.config.balloonSize + 'px';
      element.speed = getRandomSpeed(this.config.baseSpeed);
    });
  }

  generateBalloons() {
    for (let i = 0; i < parseInt(this.densityStep, 10); i++) {
      let randomType = Math.floor(Math.random() * 100);
      let luckyFactor = getLuckyFactor();
      if (this.config.specialBalloon && (randomType % 25 === 0)) {
        this.balloonsArray.push(this.buildBalloon('special', 'special', 300));
      } else if (this.config.surpriseBalloon && (randomType % 20 === 0)) {
        this.balloonsArray.push(this.buildBalloon('surprise', luckyFactor > 0 ? 'surprise_good' : 'surprise_bad', 400 * luckyFactor));
      } else {
        this.balloonsArray.push(this.buildBalloon('green', 'normal', 150));
      }
    }
  }

  updateGame() {
    if (!this.config.isPaused && !this.config.hasFinished) {
      this.densityStep += this.config.density;
      if (this.densityStep >= 1 && this.balloonsArray.length < this.config.maxBalloonQuantity) {
        this.generateBalloons();
        this.densityStep = 0;
      }

      this.balloonsArray.forEach((element) => {
        const newPos = parseInt(element.el.style.bottom, 10) + (3 + element.speed);
        element.el.style.bottom = newPos + 'px';
        if (element.type === 'special' && !this.config.specialBalloon) {
          element.el.style.display = 'none';
        } else if (element.type === 'special') {
          element.el.style.display = 'block';
        }

        if (element.type.startsWith('surprise') && !this.config.surpriseBalloon) {
          element.el.style.display = 'none';
        } else if (element.type.startsWith('surprise')) {
          element.el.style.display = 'block';
        }
      });
    } else if (this.config.isPaused && this.backMusic) {
      this.backMusic.pause();
    }
    if (this.config.hasFinished) {
      this.endGame();
    }
  }

  buildGameOverMessage(firstPlayerDoc) {
    let gameOverText = 'GAME OVER\n\n';
    if (firstPlayerDoc.exists) {
      if (firstPlayerDoc.data().id === this.id) {
        gameOverText += 'I\'m the winner!\n ';
      }
      gameOverText += ('Congratulations ' + firstPlayerDoc.data().name + '!\n');
      gameOverText += ('Winner! \n\n' + firstPlayerDoc.data().score + ' points');
    } else {
      gameOverText += 'Leader board is empty';
    }
    return gameOverText;
  }

  endGame() {
    this.pauseLocalGame();
    database.collection('players')
      .orderBy('score', 'desc')
      .limit(1)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          if (this.backMusic) {
            this.backMusic.pause();
          }
          document.getElementById('canvas').style.display = 'none';
          document.getElementById('modal-result').style.display = 'grid';
          document.getElementById('modal-content-result').style.display = 'grid';
          document.getElementById('result').style.display = 'block';
          document.getElementById('result').innerText = this.buildGameOverMessage(doc);
        });

      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }

  initGame() {
    this.balloonsArray = [];
    this.score = 0;
    this.densityStep = 1;

  }
}

class Balloon {
  constructor(x, y, color, points) {
    this.positionX = x;
    this.positionY = y;
    this.color = color;
    this.points = points;
  }
}

function handleStartButtonClick(game) {
  let name = document.getElementById('name').value + '';
  if (name && name.trim().length !== 0) {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-content').style.display = 'none';
    document.getElementById('message').style.display = 'none';
    game.id = createUUID();
    game.name = name;
    game.nameElem.innerHTML = game.name;
    game.idElem.innerHTML = 'player id: ' + game.id;
    database.collection('players')
      .doc(game.id)
      .set({
        name: game.name,
        id: game.id,
        score: 0,
      })
      .then(() => {
        game.startGame();
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  } else {
    document.getElementById('message').style.display = 'block';
  }

}

function setupInitialEvents(game) {
  document.getElementById('start-btn').onclick = () => {
    handleStartButtonClick(game);
  };

  document.getElementById('name')
    .addEventListener('keyup', function (event) {
      event.preventDefault();
      if (event.key === 'Enter') {
        handleStartButtonClick(game);
      }
    });
}

window.addEventListener('load', () => {
  const game = new Game();
  game.loadServerConfig();
  game.initGame();
  setupInitialEvents(game);
});
