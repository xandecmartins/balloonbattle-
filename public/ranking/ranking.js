// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "[KEY]",
  authDomain: "balloon-battle.firebaseapp.com",
  databaseURL: "https://balloon-battle.firebaseio.com",
  projectId: "balloon-battle",
  storageBucket: "balloon-battle.appspot.com",
  messagingSenderId: "20012671944",
  appId: "1:20012671944:web:751a2fb4a307a7e04196fd"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

console.log("Initialisation Successful!");
firebase.firestore().collection('players').orderBy('score', 'desc').get().then(snapshot => {
  var showList = document.getElementById('showList');
  var html = '<table><thead><tr>';
  html += '<th>Id</th>';
  html += '<th>Name</th>';
  html += '<th>Score</th>';
  /* add further columns into here, alike the one above. */
  html += '</tr></thead><tbody>';
  snapshot.forEach(doc => {
    html += '<tr>';

    html += '<td>' + doc.data().id + '</td>';

    html += '<td>' + doc.data().name + '</td>';

    html += '<td>' + doc.data().score + '</td>';

    html += '</tr>';
  });
  html += '</tbody></table>';
  showList.insertAdjacentHTML("beforeend", html);
});