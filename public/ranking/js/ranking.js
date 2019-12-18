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

console.log('Initialisation Successful!');
firebase.firestore()
  .collection('players')
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
      html += '<tr>';

      html += '<td>' + pos + '</td>';

      html += '<td>' + doc.data().id + '</td>';

      html += '<td>' + doc.data().name + '</td>';

      html += '<td>' + doc.data().score + '</td>';

      html += '</tr>';
      pos++;
    });
    html += '</tbody></table>';

    showList.insertAdjacentHTML('beforeend', html);
  });