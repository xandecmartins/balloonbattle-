createUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

getLuckyFactor = () => {
  return Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1;
};

getRandomSpeed = (base_speed) => {
  return Math.floor(Math.random() * base_speed) / 100;
};

generateRandomXPos = (limit) => {
  return Math.floor(Math.random() * limit);
};

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

class Game {
  constructor() {
    this.soundMap = {
      'normal': new Audio('sounds/balloon-pop-sound-effect.mp3'),
      'special': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
      'surprise_good': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
      'surprise_bad': new Audio('sounds/explosion-sound-effect.mp3'),
    };

    this.backMusic = null;
    this.config = {};
    this.database = firebase.firestore();
    this.docRef = this.database.collection('configurations')
      .doc('configurations');
    this.name = null;
    this.id = null;
    this.score = null;
    this.speed = null;
    this.balloonInitialWidth = null;
    this.balloonInitialHeight = null;
    this.density = null;
    this.playElement = document.getElementById('start-btn');
    this.scoreElem = document.getElementById('score-count');
    this.nameElem = document.getElementById('name-show');
    this.canvasElement = document.getElementById('canvas');
    this.intervalId = null;
    this.updateTime = null;
    this.densityStep = null;
    this.balloonsArray = null;
    const thiz = this;
    this.updater = () => {
      thiz.updateGame();

    };
  }

  startGame() {
    this.playElement.style.display = 'none';
    this.intervalId = setInterval(this.updater, this.updateTime);
    this.backMusic = new Audio('sounds/top-gear-soundtrack-track-1.mp3');
    this.backMusic.loop = true;
    this.backMusic.volume = 0.3;
    this.backMusic.play();
  }

  pauseLocalGame() {
    clearInterval(this.intervalId);
  }

  updateConfig() {
    this.docRef.onSnapshot(doc => {
      if (doc.exists) {
        this.config = {
          balloon_size: doc.data().balloon_size,
          special_balloon: doc.data().special_balloon,
          surprise_balloon: doc.data().surprise_balloon,
          base_speed: doc.data().base_speed,
          max_balloon_quantity: doc.data().max_balloon_quantity,
          is_paused: doc.data().is_paused,
          has_finished: doc.data().has_finished,
          density: doc.data().density,
        };
        if (!this.config.is_paused && this.backMusic) {
          this.backMusic.play();
        }
        this.updateGameFromConfig();
      } else {
        this.config = {
          balloon_size: 1,
          special_balloon: true,
          surprise_balloon: true,
          base_speed: 201,
          max_balloon_quantity: 500,
          is_paused: false,
          has_finished: false,
          density: 1000 / 4000,
        };
        console.log('Config doesn\'t exist on the server, using default values');
      }
    });

  }

  updateScore(score, type) {
    this.scoreElem.innerHTML = score;
    this.database.collection('players')
      .doc(this.id)
      .update({
        score: score,
      });
    this.soundMap[type].play();
  }

  buildBalloon(color, type, points) {
    const tempBalloon = new Balloon(0, -this.balloonInitialHeight * this.config.balloon_size, color, type, points);
    tempBalloon.positionX = generateRandomXPos(450);
    //console.log(tempBalloon.positionX);
    const el = document.createElement('div');
    el.className = 'balloon ' + tempBalloon.color;
    el.style.left = tempBalloon.positionX + 'px';
    el.style.bottom = tempBalloon.positionY + 'px';
    el.style.backgroundSize = '100% 100%';
    el.style.width = this.balloonInitialWidth * this.config.balloon_size + 'px';
    el.style.height = this.balloonInitialHeight * this.config.balloon_size + 'px';
    const thiz = this;

    el.onclick = () => {
      if (!thiz.config.is_paused) {
        thiz.score += points;
        thiz.updateScore(thiz.score, type);
        this.canvasElement.removeChild(el);
      }
    };

    this.canvasElement.appendChild(el);
    return {
      el: el,
      speed: getRandomSpeed(this.config.base_speed),
      points: tempBalloon.points,
    };
  }

  updateGameFromConfig() {
    this.balloonsArray.forEach((element) => {
      element.el.style.width = this.balloonInitialWidth * this.config.balloon_size + 'px';
      element.el.style.height = this.balloonInitialHeight * this.config.balloon_size + 'px';
      element.speed = getRandomSpeed(this.config.base_speed);
    });
  }

  generateBalloons() {
    for (let i = 0; i < parseInt(this.densityStep, 10); i++) {
      let randomType = Math.floor(Math.random() * 100);
      let luckyFactor = getLuckyFactor();
      if (this.config.special_balloon && (randomType % 25 === 0)) {
        this.balloonsArray.push(this.buildBalloon('special', 'special', 300));
      } else if (this.config.surprise_balloon && (randomType % 20 === 0)) {
        this.balloonsArray.push(this.buildBalloon('surprise', luckyFactor > 0 ? 'surprise_good' : 'surprise_bad', 400 * luckyFactor));
      } else {
        this.balloonsArray.push(this.buildBalloon('green', 'normal', 150));
      }
    }
  }

  updateGame() {
    if (!this.config.is_paused && !this.config.has_finished) {
      this.densityStep += this.config.density;
      if (this.densityStep >= 1 && this.balloonsArray.length < this.config.max_balloon_quantity) {
        this.generateBalloons();
        this.densityStep = 0;
      }

      this.balloonsArray.forEach((element) => {
        element.el.style.bottom = (parseInt(element.el.style.bottom, 10) + (3 + element.speed)) + 'px';
      });
    } else if (this.backMusic) {
      this.backMusic.pause();
    }
    if (this.config.has_finished) {
      this.endGame();
    }
  }

  endGame() {
    this.pauseLocalGame();
    this.database.collection('players')
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
          document.getElementById('result').style.display = 'inline';
          document.getElementById('result').innerText += 'GAME OVER\n\n';
          if (doc.exists) {
            if (doc.data().id === this.id) {
              document.getElementById('result').innerText += 'I\'m the winner!\n ';
            }
            document.getElementById('result').innerText += ('Congratulations ' + doc.data().name + '!\n');
            document.getElementById('result').innerText += ('Winner! \n\n' + doc.data().score + ' points');
          } else {
            document.getElementById('result').innerText += 'Leader board is empty';
          }
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

    this.updateTime = 50;
    this.balloonInitialWidth = 40;
    this.balloonInitialHeight = 53;
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

window.addEventListener('load', () => {
  const a = new Game();
  a.updateConfig();
  a.initGame();

  document.getElementById('start-btn').onclick = () => {
    a.name = document.getElementById('name').value;
    if (a.name != null && a.name.trim() != '') {
      document.getElementById('modal').style.display = 'none';
      document.getElementById('modal-content').style.display = 'none';
      document.getElementById('message').style.display = 'none';
      a.id = createUUID();
      a.nameElem.innerHTML = a.name + '(...' + a.id.slice(a.id.length - 5) + ')';
      a.database.collection('players')
        .doc(a.id)
        .set({
          name: a.name,
          id: a.id,
          score: 0,
        })
        .then(() => {
          a.startGame();
        })
        .catch((error) => {
          console.error('Error writing document: ', error);
        });
    } else {
      document.getElementById('message').style.display = 'inline';
    }
  };
});
