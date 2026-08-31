import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  setDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


const params =
  new URLSearchParams(
    window.location.search
  );


const paperTrailId =
  (
    params.get("id") || ""
  )
    .trim()
    .toUpperCase();


const content =
  document.getElementById(
    "activationContent"
  );


const escapeHtml = (value) =>
  String(value ?? "")
    .replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character])
    );


function validPaperTrailId(id) {

  return /^PT-\d{6}$/.test(id);

}


async function start() {

  if (!validPaperTrailId(paperTrailId)) {

    showError(
      "This passport number isn't valid.",
      "A Paper Trails ID should look like PT-000002."
    );

    return;
  }


  try {

    /*
     * Check whether this passport has
     * already been activated.
     */

    const existingQuery = query(
      collection(db, "books"),
      where(
        "id",
        "==",
        paperTrailId
      ),
      limit(1)
    );


    const existingSnapshot =
      await getDocs(
        existingQuery
      );


    /*
     * Already activated?
     * Send the reader to the journey.
     */

    if (!existingSnapshot.empty) {

      window.location.href =
        `book.html?id=${encodeURIComponent(
          paperTrailId
        )}`;

      return;
    }


    /*
     * Otherwise show activation.
     */

    renderActivation();

  } catch (error) {

    console.error(
      "Activation check failed:",
      error
    );


    showError(
      "We couldn't check this passport.",
      "Please try again in a moment."
    );

  }

}


function renderActivation() {

  content.innerHTML = `

    <div class="passport-header">

      <span class="eyebrow">
        UNUSED BOOK PASSPORT
      </span>

      <span class="passport-number">
        ${escapeHtml(paperTrailId)}
      </span>

    </div>


    <div class="book-identity">

      <p class="book-label">
        THIS PAPER TRAIL IS WAITING
      </p>

      <h1>
        Give a book a second life.
      </h1>

    </div>


    <div class="journey-intro">

      <p>
        Have a book you loved but are
        ready to pass along?
      </p>

      <p>
        Activate this passport,
        place the sticker inside,
        and set the book free.
      </p>

    </div>


    <form
      id="activationForm"
      class="chapter-form"
    >

      <label>

        <span>
          Book title
        </span>

        <input
          id="bookTitle"
          type="text"
          maxlength="200"
          required
          placeholder="The Overstory"
        >

      </label>


      <label>

        <span>
          Author
        </span>

        <input
          id="bookAuthor"
          type="text"
          maxlength="200"
          required
          placeholder="Richard Powers"
        >

      </label>


      <label>

        <span>
          Where is the journey beginning?
        </span>

        <input
          id="bookLocation"
          type="text"
          maxlength="120"
          required
          placeholder="Portland, Oregon"
        >

      </label>


      <label>

        <span>
          Why are you setting this book free?
        </span>

        <textarea
          id="bookMessage"
          maxlength="2000"
          required
          rows="6"
          placeholder="Leave something for the reader who finds it next."
        ></textarea>

      </label>


      <button
        type="submit"
        class="button primary"
      >
        Start This Paper Trail
      </button>


      <p class="form-help">
        Once activated, this passport
        becomes permanently connected
        to this book.
      </p>

    </form>

  `;


  document
    .getElementById(
      "activationForm"
    )
    .addEventListener(
      "submit",
      activatePassport
    );

}


async function activatePassport(event) {

  event.preventDefault();


  const form =
    event.target;


  const button =
    form.querySelector(
      'button[type="submit"]'
    );


  button.disabled = true;

  button.textContent =
    "Starting the journey…";


  const title =
    document
      .getElementById(
        "bookTitle"
      )
      .value
      .trim();


  const author =
    document
      .getElementById(
        "bookAuthor"
      )
      .value
      .trim();


  const location =
    document
      .getElementById(
        "bookLocation"
      )
      .value
      .trim();


  const message =
    document
      .getElementById(
        "bookMessage"
      )
      .value
      .trim();


  try {

    /*
     * Check again before activation.
     */

    const existingQuery = query(
      collection(db, "books"),
      where(
        "id",
        "==",
        paperTrailId
      ),
      limit(1)
    );


    const existingSnapshot =
      await getDocs(
        existingQuery
      );


    if (!existingSnapshot.empty) {

      window.location.href =
        `book.html?id=${encodeURIComponent(
          paperTrailId
        )}`;

      return;
    }


    /*
     * Create the permanent book.
     *
     * We use the Paper Trails number
     * as the Firebase document ID.
     */

    const book = {

      id:
        paperTrailId,

      sequence:
        Number(
          paperTrailId.replace(
            "PT-",
            ""
          )
        ),

      title,

      author,

      location,

      message,

      status:
        "traveling",

      createdAt:
        serverTimestamp()

    };


    await setDoc(
      doc(
        db,
        "books",
        paperTrailId
      ),
      book
    );


    /*
     * The release message becomes
     * Chapter 1.
     */

    await addDoc(
      collection(
        db,
        "books",
        paperTrailId,
        "chapters"
      ),
      {

        name:
          null,

        location,

        message,

        createdAt:
          serverTimestamp()

      }
    );


    /*
     * Journey begins.
     */

    window.location.href =
      `book.html?id=${encodeURIComponent(
        paperTrailId
      )}`;


  } catch (error) {

    console.error(
      "Activation failed:",
      error
    );


    alert(
      "We couldn't start this Paper Trail yet. Please try again."
    );


    button.disabled = false;

    button.textContent =
      "Start This Paper Trail";

  }

}


function showError(
  title,
  message
) {

  content.innerHTML = `

    <p class="eyebrow">
      PAPER TRAILS
    </p>

    <h1>
      ${escapeHtml(title)}
    </h1>

    <p>
      ${escapeHtml(message)}
    </p>

    <a
      class="button primary"
      href="index.html"
    >
      Return Home
    </a>

  `;

}


start();
