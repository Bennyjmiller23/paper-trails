import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("releaseForm");
const countEl = document.getElementById("bookCount");

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));


async function getNextPaperTrailId() {
  const booksRef = collection(db, "books");

  const latest = await getDocs(
    query(
      booksRef,
      orderBy("sequence", "desc"),
      limit(1)
    )
  );

  const nextSequence = latest.empty
    ? 1
    : Number(latest.docs[0].data().sequence || 0) + 1;

  return {
    id: `PT-${String(nextSequence).padStart(6, "0")}`,
    sequence: nextSequence
  };
}


async function updateBookCount() {
  const snapshot = await getDocs(collection(db, "books"));

  if (countEl) {
    countEl.textContent = snapshot.size;
  }
}


function showPassport(book) {

  const modal = document.createElement("div");

  modal.className = "modal";

  modal.innerHTML = `
    <div class="passport-card">

      <button class="close" aria-label="Close">
        ×
      </button>

      <p class="eyebrow">
        YOUR BOOK PASSPORT IS READY
      </p>

      <h2>${esc(book.title)}</h2>

      <p>
        ${esc(book.author)}
      </p>

      <div class="passport-grid">

        <div>

          <p>
            <strong>Passport No.</strong><br>
            ${book.id}
          </p>

          <p>
            <strong>Journey begins</strong><br>
            ${esc(book.location)}
          </p>

          <p>
            <strong>Your note</strong><br>
            <em>“${esc(book.message)}”</em>
          </p>

          <button
            class="button primary"
            id="printPassport">
            Print Passport
          </button>

        </div>

        <div class="qr">
          <div id="qrcode"></div>
        </div>

      </div>

      <p class="small-note">
        Scan this code to follow the book's journey.
      </p>

    </div>
  `;

  document.body.appendChild(modal);


  const journeyUrl =
    `${window.location.origin}/book.html?id=${encodeURIComponent(book.id)}`;


  new QRCode(
    document.getElementById("qrcode"),
    {
      text: journeyUrl,
      width: 160,
      height: 160
    }
  );


  modal.querySelector(".close").onclick = () => {
    modal.remove();
  };


  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });


  modal.querySelector("#printPassport").onclick = () => {
    window.print();
  };
}


form.addEventListener("submit", async (event) => {

  event.preventDefault();

  const button =
    form.querySelector('button[type="submit"]');

  button.disabled = true;

  button.textContent =
    "Creating your Paper Trail…";


  try {

    const {
      id,
      sequence
    } = await getNextPaperTrailId();


    const book = {

      id,

      sequence,

      title:
        document.getElementById("title").value.trim(),

      author:
        document.getElementById("author").value.trim(),

      location:
        document.getElementById("location").value.trim(),

      message:
        document.getElementById("message").value.trim(),

      status:
        "traveling",

      createdAt:
        serverTimestamp()
    };


    // Create the permanent book record.
    await setDoc(
  doc(db, "books", id),
  book
);


    // Create the first chapter of the journey.
    await addDoc(
      collection(
        db,
        "books",
        id,
        "chapters"
      ),
      {
        location: book.location,

        message: book.message,

        createdAt:
          serverTimestamp()
      }
    );


    form.reset();

    await updateBookCount();

    showPassport(book);


  } catch (error) {

    console.error(
      "Paper Trails Firebase error:",
      error
    );

    alert(
      "We couldn't create the Paper Trail yet. " +
      "Please check that Firestore is enabled and the rules are published."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Create Book Passport";
  }

});


updateBookCount().catch((error) => {

  console.error(
    "Could not load book count:",
    error
  );

  if (countEl) {
    countEl.textContent = "—";
  }

});
