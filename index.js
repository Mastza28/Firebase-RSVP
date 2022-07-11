// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import { getAuth, EmailAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, addDoc, collection, query, orderBy, onSnapshot, doc, setDoc, where} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: "AIzaSyDMIqA5TdCLJilBQp6pmOEK5Q4g2GI5GQI",
    authDomain: "fir-web-codelab-1d3fc.firebaseapp.com",
    projectId: "fir-web-codelab-1d3fc",
    storageBucket: "fir-web-codelab-1d3fc.appspot.com",
    messagingSenderId: "274015792",
    appId: "1:274015792:web:d439a6ae1624b7a2c7aff5",
    measurementId: "G-3Y0XE132YS"
  };

  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  // Initialize the FirebaseUI widget using Firebase
  const ui = new firebaseui.auth.AuthUI(auth);

  // Called when the user clicks the RSVP button
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  // Listen to current Auth state
  onAuthStateChanged(auth, user => {
    if (user) {
      startRsvpButton.textContent = "LOGOUT" ;
      guestbookContainer.style.display = 'block' ;
      subscribeGuestbook();
      subscripeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = "RSVP" ;
      guestbookContainer.style.display = 'none' ;
      unsubscribeGuestbookt();
      unsubscribeCurrentRSVP();
    }
    });

  //Firestore setup
  //Listen for submit
  form.addEventListener('submit', async e => {
    //Prevent the default form redirect
    e.preventDefault();
    //Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid
    });
    //clear message input field
    input.value = '';
    //return false to avoid redirect
    return false;
  });

  //Listen to guestbook updates
  function subscribeGuestbook() {
    const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
    guestbookListener = onSnapshot(q, snaps => {
      //Reset page
      guestbook.innerHTML = '';
      //Loop though documents in database
      snaps.forEach(doc => {
        //Create an HTML entry for each document and add it to the chaty
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ':' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  }  

  //Unsubscripe from Guestbook
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

  //Listen for RSVP status
  rsvpYes.onclick = async () => {
  };
  rsvpNo.onclick = async () => {
  };

  //listen to RSVP responses YES
  rsvpYes.onclick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    //if they RSVP yes, save document with attendi()ng: true
    try {
      await setDoc(userRef, {
        name: auth.currentUser.displayName,
        attending: true
      });
    } catch (e) {
      console.error(e);
    }
  };

  //Listen to RSVP responses NO
  rsvpNo.onclick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    try {
      await setDoc(userRef, {
        attending: false
      });
    } catch (e) {
      console.error(e);
    }
  };

  //Listen for attendee list
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  const unsubscribe = onSnapshot(attendingQuery, snap => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + 'people going';
  });

  function subscribeCurrentRSVP(user) {
    const ref = doc(db, 'attendees', user.uid);
    rsvpListener = onSnapshot(ref, doc => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        if (attendingResponse) {
          rsvpYes.className = 'clicked';
          rsvpNo.className = '';
        } else {
          rsvpYes.className = '';
          rsvpNo.className = 'clicked';
        }
      }
    });
  }

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }


}
main();
