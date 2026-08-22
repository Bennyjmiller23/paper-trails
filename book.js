import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const bookId = params.get("id");

const content = document.getElementById("content");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));


async function loadBook() {

  if (!bookId) {
    showError(
      "No book was specified.",
      "Scan a Paper Trails QR code or enter a Paper Trails ID."
    );
    return;
  }

  try {

  const booksQuery = query(
  collection(db, "books"),
  where("id", "==", bookId),
  limit(1)
);

const booksSnapshot = await getDocs(booksQuery);

if (booksSnapshot.empty) {
  showError(
    "We couldn't find that book.",
    "Check the Paper Trails number and try again."
  );
  return;
}

const bookDocument = booksSnapshot.docs[0];

const book = bookDocument.data();

    if (!bookSnapshot.exists()) {
      showError(
        "We couldn't find that book.",
        "Check the Paper Trails number and try again."
      );
      return;
    }

    const book = bookSnapshot.data();

    const chaptersReference = collection(
      db,
      "books",
      bookId,
      "chapters"
    );

    const chaptersQuery = query(
      chaptersReference,
      orderBy("createdAt", "asc")
    );

    const chaptersSnapshot =
      await getDocs(chaptersQuery);

    const chapters = chaptersSnapshot.docs.map(
      (chapter) => ({
        id: chapter.id,
        ...chapter.data()
      })
    );

    renderJourney(book, chapters);

  } catch (error) {

    console.error(
      "Paper Trails error:",
      error
    );

    showError(
      "Something went wrong.",
      "We couldn't load this book's journey right now."
    );
  }
}


function renderJourney(book, chapters) {

  const places = new Set(
    chapters
      .map((chapter) => chapter.location)
      .filter(Boolean)
  );

  content.innerHTML = `

    <p class="eyebrow">
      PAPER TRAIL ${escapeHtml(book.id)}
    </p>

    <div class="journey-top">

      <div>

        <h2>
          ${escapeHtml(book.title)}
        </h2>

        <p>
          ${escapeHtml(book.author)}
        </p>

      </div>

      <span class="passport">
        TRAVELING
      </span>

    </div>

    <div class="journey-stats">

      <div>
        <strong>
          ${chapters.length}
        </strong>

        <span>
          reader entries
        </span>
      </div>

      <div>
        <strong>
          ${places.size}
        </strong>

        <span>
          places
        </span>
      </div>

      <div>
        <strong>
          ${escapeHtml(book.location)}
        </strong>

        <span>
          started here
        </span>
      </div>

    </div>

    <div class="timeline">

      ${
        chapters.length
          ? chapters.map(
              (chapter, index) => `

                <div>

                  <span class="dot"></span>

                  <div>

                    <strong>
                      Chapter ${index + 1}
                    </strong>

                    <small>
                      ${escapeHtml(
                        chapter.location ||
                        "Somewhere"
                      )}
                    </small>

                    ${
                      chapter.name
                        ? `<small>by ${escapeHtml(
                            chapter.name
                          )}</small>`
                        : `<small>Anonymous reader</small>`
                    }

                    <p>
                      “${escapeHtml(
                        chapter.message
                      )}”
                    </p>

                  </div>

                </div>

              `
            ).join("")
          : `
              <p>
                This book is waiting for its first chapter.
              </p>
            `
      }

    </div>

    <div class="chapter-action">

      <p class="eyebrow">
        YOU FOUND THIS BOOK
      </p>

      <h3>
        Add your chapter.
      </h3>

      <p>
        Tell the next reader where this book has been
        and what it meant to you.
      </p>

      <button
        class="button primary"
        id="addChapterButton"
      >
        Add Your Chapter
      </button>

    </div>

    <div
      id="chapterFormContainer"
      style="display:none"
    ></div>

  `;

  document
    .getElementById("addChapterButton")
    .addEventListener(
      "click",
      showChapterForm
    );
}


function showChapterForm() {

  const container =
    document.getElementById(
      "chapterFormContainer"
    );

  container.style.display = "block";

  container.innerHTML = `

    <div class="chapter-form">

      <p class="eyebrow">
        YOUR CHAPTER
      </p>

      <h3>
        Where did this book find you?
      </h3>

      <form id="chapterForm">

        <label>

          Your name
          <span class="optional">
            optional
          </span>

          <input
            id="readerName"
            type="text"
            maxlength="80"
            placeholder="Leave blank to stay anonymous"
          >

        </label>

        <label>

          Where are you?
          <input
            id="readerLocation"
            type="text"
            maxlength="120"
            required
            placeholder="Portland, Oregon"
          >

        </label>

        <label>

          Your message

          <textarea
            id="readerMessage"
            maxlength="2000"
            required
            placeholder="What would you like the next reader to know?"
          ></textarea>

        </label>

        <div class="chapter-form-actions">

          <button
            type="submit"
            class="button primary"
          >
            Add My Chapter
          </button>

          <button
            type="button"
            class="button secondary"
            id="cancelChapter"
          >
            Cancel
          </button>

        </div>

        <p class="form-help">
          Your name is optional. The location and message
          become part of this book's permanent journey.
        </p>

      </form>

    </div>

  `;

  document
    .getElementById("cancelChapter")
    .addEventListener(
      "click",
      () => {
        container.style.display = "none";
        container.innerHTML = "";
      }
    );

  document
    .getElementById("chapterForm")
    .addEventListener(
      "submit",
      saveChapter
    );

  container.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


async function saveChapter(event) {

  event.preventDefault();

  const form = event.target;

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  submitButton.disabled = true;

  submitButton.textContent =
    "Adding your chapter…";

  const name =
    document
      .getElementById("readerName")
      .value
      .trim();

  const location =
    document
      .getElementById("readerLocation")
      .value
      .trim();

  const message =
    document
      .getElementById("readerMessage")
      .value
      .trim();

  try {

    await addDoc(
      collection(
        db,
        "books",
        bookId,
        "chapters"
      ),
      {
        name: name || null,

        location,

        message,

        createdAt:
          serverTimestamp()
      }
    );

    await loadBook();

  } catch (error) {

    console.error(
      "Could not add chapter:",
      error
    );

    alert(
      "We couldn't add your chapter. " +
      "Please try again."
    );

    submitButton.disabled = false;

    submitButton.textContent =
      "Add My Chapter";
  }
}


function showError(title, message) {

  content.innerHTML = `

    <p class="eyebrow">
      PAPER TRAILS
    </p>

    <h2>
      ${escapeHtml(title)}
    </h2>

    <p>
      ${escapeHtml(message)}
    </p>

    <a
      class="button primary"
      href="index.html#journey"
    >
      Find a book
    </a>

  `;
}


loadBook();
