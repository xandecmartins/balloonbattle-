// Your web app's Firebase configuration
let firebaseConfig = {
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

let firstPlayerId;
let lastPlayerId;


const updateTime = 1000;
const intervalID = setInterval(() => {
  this.updateRanking();
}, updateTime);
const newLeaderAudio = new Audio('./sounds/leader.mp3');
const rankingTable = document.getElementById('ranking-table');



function clearTable(){
  for(let i = 2; i < rankingTable.rows.length;)
  {
    rankingTable.deleteRow(i);
  }
}

function formatPopTime(popTime){
  if(popTime) {
    const diff = (new Date().getTime() - popTime) / 1000;

    if (diff > 60) {
      return '<span>> 60 sec</span> <img src="./images/iconfinder_bullet_red_35785.png" />'
    } else {
      return '<span>'+Math.round(diff)  + ' sec</span> <img src="./images/iconfinder_bullet_green_35779.png" />';
    }
  } else {
    return popTime + ' <img src="./images/iconfinder_question_64560.png" />';
  }
}

function updateRanking() {

  firebase.firestore()
    .collection('players')
    .orderBy('score', 'desc')
    .onSnapshot(snapshot => {

      clearTable();

      let pos = 1;

      snapshot.forEach(doc => {
        const row = rankingTable.insertRow(-1);
        let iconTrophy = pos;
        if (pos === 1) {
          if (firstPlayerId !== doc.data().id) {
            firstPlayerId = doc.data().id;
            newLeaderAudio.play()
              .catch((error) => {
                console.log('Problem during audio play', error);
              });
          }

          iconTrophy = '<img class="trophy" src="./images/trophy.png"/>';
          document.getElementById('nameFirst').innerText = doc.data().name;
          document.getElementById('idFirst').innerText = doc.data().id;
          document.getElementById('scoreFirst').innerText = doc.data().score;
        } else if (pos === snapshot.size) {

          if (lastPlayerId !== doc.data().id) {
            lastPlayerId = doc.data().id;
          }
          iconTrophy = '<img class="trophy" src="./images/lantern.png"/>';
          document.getElementById('nameLast').innerText = doc.data().name;
          document.getElementById('idLast').innerText = doc.data().id;
          document.getElementById('scoreLast').innerText = doc.data().score;
        }

        const positionCell = row.insertCell(0);
        positionCell.setAttribute('class', "column-table");
        positionCell.innerHTML = iconTrophy+'';

        const idCell = row.insertCell(1);
        idCell.setAttribute('class', "column-table");
        idCell.innerHTML = doc.data().id;

        const nameCell = row.insertCell(2);
        nameCell.setAttribute('class', "column-table");
        nameCell.innerHTML = doc.data().name;

        const scoreCell = row.insertCell(3);
        scoreCell.setAttribute('class', "column-score-table");
        scoreCell.innerHTML =  doc.data().score;

        const popTimeCell = row.insertCell(4);
        popTimeCell.setAttribute('class', "column-score-table");
        popTimeCell.innerHTML =  formatPopTime(doc.data().timestamp);
        console.log(formatPopTime(doc.data().timestamp));
        pos++;
      });
    });
}

window.addEventListener('load', () => {
  updateRanking();
});