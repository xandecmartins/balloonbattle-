function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getLuckyFactor() {
  return Math.floor(Math.random() * 10)%2==0?1:-1;;
}

function getRandomSpeed(base_speed){
  return Math.floor(Math.random() * base_speed)/100;
};

function Game(){

  this.soundMap = {
      'normal': new Audio('sounds/balloon-pop-sound-effect.mp3'),
      'special': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
      'surprise_good': new Audio('sounds/cash-register-kaching-sound-effect-hd.mp3'),
      'surprise_bad': new Audio('sounds/explosion-sound-effect.mp3')
  };

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyDj_qwUrYCUsEstUJE9wo2ZpuLD_1LGjVY",
    authDomain: "balloon-battle.firebaseapp.com",
    databaseURL: "https://balloon-battle.firebaseio.com",
    projectId: "balloon-battle",
    storageBucket: "balloon-battle.appspot.com",
    messagingSenderId: "20012671944",
    appId: "1:20012671944:web:751a2fb4a307a7e04196fd"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  this.backMusic = null;
  this.config = {};
  this.database = firebase.firestore();
  this.docRef = this.database.collection("configurations").doc("configurations");
  this.name = null;
  this.id = null;
  this.score = null;
  this.speed = null;
  this.balloonInitialWidth = null;
  this.balloonInitialHeight = null;
  this.density = null;
  this.playElement = document.getElementById('start-btn');
  this.scoreElement = document.getElementById('score-container');
  this.nameElement = document.getElementById('name-container');
  this.livesElement = document.getElementById('lives-container');
  this.canvasElement = document.getElementById('canvas');
  this.timer = null;
  this.startedTime = null; //time from start game
  this.intervalId = null;
  this.updateTime = null;
  this.densityStep = null;
  this.balloonsArray = null;
  var thiz = this;
  this.updater = function(){
      thiz.updateGame();
  };
}
Game.prototype.startGame = function(){
  this.playElement.style.display = "none";
  this.intervalId = setInterval(this.updater, this.updateTime);
  this.backMusic = new Audio('sounds/top-gear-soundtrack-track-1.mp3');
  this.backMusic.loop = true;
  this.backMusic.volume = 0.3;
  this.backMusic.play();

};
Game.prototype.pauseGame = function(){
  clearInterval(this.intervalId);
};

Game.prototype.updateConfig = function(){
  this.docRef.onSnapshot(doc =>  {
    if (doc.exists) {
      this.config = {
        balloon_size: doc.data().balloon_size,
        special_balloon: doc.data().special_balloon,
        surprise_balloon: doc.data().surprise_balloon,
        base_speed: doc.data().base_speed,
        max_balloon_quantity: doc.data().max_balloon_quantity,
        is_paused: doc.data().is_paused,
        has_finished: doc.data().has_finished
      };
      if(!this.config.is_paused && this.backMusic){
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
        has_finished: false
      };
      console.log("Config doesn't exist on the server, using default values");
    }
  });

};

Game.prototype.updateScore = function(score, type){
  this.scoreElem.innerHTML = score;
  this.database.collection("players").doc(this.id).update({
    score: score
  });
  this.soundMap[type].play();
};

Game.prototype.updateName = function(name){
  this.nameElem.innerHTML = name;
};

Game.prototype.buildBalloon = function(color, type, points){
  var tempBalloon = new Balloon(0, -this.balloonInitialHeight*this.config.balloon_size, color, type, points);
  tempBalloon.positionX = tempBalloon.generateRandomXPos();
  //console.log(tempBalloon.positionX);
  var el = document.createElement('div');
  el.className = 'balloon '+ tempBalloon.color;
  el.style.left = tempBalloon.positionX+'px';
  el.style.bottom = tempBalloon.positionY+'px';
  el.style.backgroundSize= '100% 100%';
  el.style.width = this.balloonInitialWidth*this.config.balloon_size+'px';
  el.style.height = this.balloonInitialHeight*this.config.balloon_size+'px';
  var thiz = this;
  el.onclick = function(){
    if(!this.config.is_paused) {
      thiz.score += points;
      thiz.updateScore(thiz.score, type);
      this.parentNode.removeChild(el);
    }
  };
  this.canvasElement.appendChild(el);
  var tempObj = {};
  tempObj.el = el;
  tempObj.speed = getRandomSpeed(this.config.base_speed);
  tempObj.points = tempBalloon.points;
  return tempObj;
};

Game.prototype.updateGameFromConfig = function(){
  for(var i = 0; i < this.balloonsArray.length; i++)
  {
    this.balloonsArray[i].el.style.width = this.balloonInitialWidth*this.config.balloon_size+'px';
    this.balloonsArray[i].el.style.height = this.balloonInitialHeight*this.config.balloon_size+'px';
    this.balloonsArray[i].speed = getRandomSpeed(this.config.base_speed);
  }
};

Game.prototype.updateGame = function(){
  if(!this.config.is_paused && !this.config.has_finished){
  this.densityStep += this.density;
  if(this.densityStep >= 1 && this.balloonsArray.length < this.config.max_balloon_quantity)
  {
    for(let i = 0; i < parseInt(this.densityStep, 10); i++)
    {
      let randomType = Math.floor(Math.random() * 100);
      let luckyFactor = getLuckyFactor();
      if(this.config.special_balloon && (randomType%25===0)){
        this.balloonsArray.push(this.buildBalloon( 'special', 'special', 300));
      } else if(this.config.surprise_balloon && (randomType%20===0)){
        this.balloonsArray.push(this.buildBalloon( 'surprise', luckyFactor>0?'surprise_good':'surprise_bad',400*luckyFactor));
      } else {
        this.balloonsArray.push(this.buildBalloon( 'green', 'normal',150));
      }
      //console.log(tempObj.speed);
    }

    this.densityStep = 0;
  }

    for(var i = 0; i < this.balloonsArray.length; i++)
    {
      this.balloonsArray[i].el.style.bottom = (parseInt(this.balloonsArray[i].el.style.bottom, 10)+(3+this.balloonsArray[i].speed))+'px';
    }
  } else if(this.backMusic){
    this.backMusic.pause();
  }
  if(this.config.has_finished){
    this.endGame();
  }
};
Game.prototype.endGame = function(){
  this.pauseGame();
  this.database.collection('players').orderBy('score', 'desc').limit(1).get().then(function(snapshot) {
    snapshot.forEach(function(doc) {
      if (this.backMusic) {
        this.backMusic.pause();
      }
      document.getElementById("canvas").style.display = "none";
      document.getElementById("modal-result").style.display = "grid";
      document.getElementById("modal-content-result").style.display = "grid";
      document.getElementById("result").style.display = "inline";
      document.getElementById("result").innerText += "END OF GAME\n\n";
      if (doc.exists) {
        if (doc.data().id === this.id) {
          document.getElementById("result").innerText += "I'm the winner!\n ";
        }
        document.getElementById("result").innerText += ('Congratulations ' + doc.data().name + '!\n');
        document.getElementById("result").innerText += ('Winner! \n\n' + doc.data().score + ' points')
      } else {
        document.getElementById("result").innerText += "Leaderboard is empty";
      }
    });

  }).catch(function(error) {
    console.log("Error getting document:", error);
  });
};
Game.prototype.initGame = function(){
  this.score = 0;
  this.balloonInitialWidth = 40;
  this.balloonInitialHeight = 53;
  this.density = 1000/4000;
  this.updateTime = 50;
  this.densityStep = 1;
  this.balloonsArray = [];
  this.scoreElem = document.getElementById('score-count');
  this.nameElem = document.getElementById('name-show');
};
function Balloon(x, y, color, points){
  this.positionX = x;
  this.positionY = y;
  this.color = color;
  this.points = points;
}

Balloon.prototype.generateRandomXPos = function(){
  //console.log('document width = ', Math.floor(Math.random() * 450));
  return Math.floor(Math.random() * 450);
};

window.addEventListener('load',function(){

  var a = new Game();
  a.updateConfig();
  a.initGame();

  document.getElementById('start-btn').onclick = function(){
    a.name = document.getElementById("name").value;
    if(a.name != null && a.name.trim() != ''){
      document.getElementById("modal").style.display = "none";
      document.getElementById("modal-content").style.display = "none";
      document.getElementById("message").style.display = "none";
      a.updateName(a.name);
      a.id = createUUID();
      a.database.collection("players").doc(a.id).set({
        name: a.name,
        id: a.id,
        score: 0
      })
        .then(function() {
          a.startGame();
        })
        .catch(function(error) {
          console.error("Error writing document: ", error);
        });
    } else {
      document.getElementById("message").style.display = "inline";
    }
  };
});
