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
const newLeaderAudio = new Audio('./sounds/leader.mp3');
const newLanternAudio = new Audio('./sounds/lantern.mp3');

function updateRanking() {

  firebase.firestore()
    .collection('players')
    .where('score', '>', 0)
    .orderBy('score', 'desc')
    .onSnapshot(snapshot => {
      const showList = document.getElementById('showList');
      showList.innerHTML = '';

      let html = '<table class="minimalistBlack"><thead><tr>';
      html += '<th>Position</th>';
      html += '<th>Id</th>';
      html += '<th>Name</th>';
      html += '<th>Score</th>';
      /* add further columns into here, alike the one above. */
      html += '</tr></thead><tbody>';
      let pos = 1;

      snapshot.forEach(doc => {
        let iconTrophy = pos;
        if (pos === 1) {
          console.log(firstPlayerId);
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

        html += '<tr>';

        html += '<td class="column-table">' + iconTrophy + '</td>';

        html += '<td class="column-table">' + doc.data().id + '</td>';

        html += '<td class="column-table">' + doc.data().name + '</td>';

        html += '<td class="column-score-table">' + doc.data().score + '</td>';

        html += '</tr>';
        pos++;
      });
      html += '</tbody></table>';

      showList.insertAdjacentHTML('beforeend', html);
    });
}

window.addEventListener('load', () => {
  updateRanking();
});