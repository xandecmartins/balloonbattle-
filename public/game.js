function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function Game(){

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

  console.log(firebase);
  this.database = firebase.firestore();
  this.name = null;
  this.isPaused = true;
  this.score = null;
  this.speed = null;
  this.balloonSize = null;
  this.balloonInitialWidth = null;
  this.balloonInitialHeight = null;
  this.density = null;
  this.remainingLives = 5;
  this.playElement = document.getElementById('start-btn');
  this.scoreElement = document.getElementById('score-container');
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

};
Game.prototype.pauseGame = function(){
  clearInterval(this.intervalId);
};
Game.prototype.updateScore = function(score){
  this.scoreElem.innerHTML = score;
  this.database.collection("players").doc(this.name).update({
    score: score
  })
};

Game.prototype.buildBalloon = function(color, type, points){
  var tempBalloon = new Balloon(0, -this.adjustedHeight, color, type, points);
  tempBalloon.positionX = tempBalloon.generateRandomXPos();
  //console.log(tempBalloon.positionX);
  var el = document.createElement('div');
  el.className = 'balloon '+ tempBalloon.color;
  el.style.left = tempBalloon.positionX+'px';
  el.style.bottom = tempBalloon.positionY+'px';
  el.style.backgroundSize= '100% 100%';
  el.style.width = this.adjustedWidth+'px';
  el.style.height = this.adjustedHeight+'px';
  var thiz = this;
  var index = this.balloonsArray.length;
  el.onclick = function(){
    thiz.score += thiz.balloonsArray[index].points;
    thiz.updateScore(thiz.score);
    this.parentNode.removeChild(el);
  };
  this.canvasElement.appendChild(el);
  var tempObj = {};
  tempObj.el = el;
  tempObj.speed = tempBalloon.getRandomSpeed();
  tempObj.points = tempBalloon.points;
  return tempObj;
};

Game.prototype.updateGame = function(){
  this.densityStep += this.density;
  if(this.densityStep >= 1 && this.balloonsArray.length < this.maxBalloon)
  {
    for(var i = 0; i < parseInt(this.densityStep, 10); i++)
    {
      this.balloonsArray.push(this.buildBalloon( 'green', 150));
      //console.log(tempObj.speed);
    }

    this.densityStep = 0;
  }
  for(var i = 0; i < this.balloonsArray.length; i++)
  {
    this.balloonsArray[i].el.style.bottom = (parseInt(this.balloonsArray[i].el.style.bottom, 10)+(3+this.balloonsArray[i].speed))+'px';
  }
};
Game.prototype.endGame = function(){

};
Game.prototype.initGame = function(){
  this.isPaused = true;
  this.isSpecialBalloonEnable = true;
  this.isSurpriseBalloonEnable = true;
  this.score = 0;
  this.speed = 0.01;
  this.balloonSize = 1;
  this.balloonInitialWidth = 40;
  this.balloonInitialHeight = 53;
  this.adjustedHeight = this.balloonInitialHeight*this.balloonSize;
  this.adjustedWidth = this.balloonInitialWidth*this.balloonSize;
  this.density = 1000/4000;
  this.remainingLives = 5;
  this.updateTime = 50;
  this.densityStep = 1;
  this.maxBalloon = 50;0
  this.balloonsArray = [];
  this.scoreElem = document.getElementById('score-count');

  if(this.isSpecialBalloonEnable){
    this.balloonsArray.push(this.buildBalloon( 'special', 300));
  }

  if(this.isSurpriseBalloonEnable){
    let luckyFactor = Math.random()%5==0?1:-1;
    this.balloonsArray.push(this.buildBalloon( 'surprise', 400*luckyFactor));
  }

};
function Balloon(x, y, color, points){
  this.positionX = x;
  this.positionY = y;
  this.color = color;
  this.points = points;
}
Balloon.prototype.getRandomSpeed = function(){
  return Math.floor(Math.random() * 201)/100;
};
Balloon.prototype.generateRandomXPos = function(){
  console.log('document width = ', Math.floor(Math.random() * 450));
  return Math.floor(Math.random() * 450);
};



window.addEventListener('load',function(){
  var a = new Game();


  a.initGame();
  document.getElementById('start-btn').onclick = function(){
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-content").style.display = "none";
    a.name = document.getElementById("name").value;
    a.database.collection("players").doc(a.name).set({
      name: a.name,
      id: createUUID(),
      score: 0
    })
      .then(function() {
        console.log("Document successfully written!");
      })
      .catch(function(error) {
        console.error("Error writing document: ", error);
      });
    a.startGame();
  };
});