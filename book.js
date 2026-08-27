import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
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

    const firebaseBookId = bookDocument.id;

    const chaptersReference = collection(
      db,
      "books",
      firebaseBookId,
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

    console.error("Paper Trails error:", error);

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

  const readerCount = chapters.length;

  const placeCount = places.size;

  const latestChapter =
    chapters.length
      ? chapters[chapters.length - 1]
      : null;


  content.innerHTML = `

    <div class="passport-header">

      <span class="eyebrow">
        YOU FOUND A PAPER TRAIL
      </span>

      <span class="passport-number">
        ${escapeHtml(book.id)}
      </span>

    </div>


    <div class="book-identity">

      <p class="book-label">
        THIS BOOK IS TRAVELING
      </p>

      <h1>
        ${escapeHtml(book.title)}
      </h1>

      <p class="book-author">
        ${escapeHtml(book.author)}
      </p>

    </div>

<div class="book-passport">

  <div class="passport-copy">

    <span class="eyebrow">
      PAPER TRAILS BOOK PASSPORT
    </span>

    <h2>
      ${escapeHtml(book.title)}
    </h2>

    <p>
      ${escapeHtml(book.author)}
    </p>

    <p class="passport-id">
      ${escapeHtml(book.id)}
    </p>

    <p class="passport-origin">
      Released from ${escapeHtml(book.location)}
    </p>

    <p class="passport-instruction">
      Scan to follow this book's journey.
    </p>

  </div>

  <div
    id="bookQrCode"
    class="book-qr"
  ></div>

</div>
    <div class="journey-intro">

      <p>
        This isn't just a book.
        It's a story that's being passed
        from reader to reader.
      </p>

      <p>
        Follow its journey below — and
        leave something behind for the
        next person who finds it.
      </p>

    </div>


    <div class="journey-stats">

      <div class="stat">

        <strong>
          ${readerCount}
        </strong>

        <span>
          ${readerCount === 1
            ? "reader"
            : "readers"}
        </span>

      </div>


      <div class="stat">

        <strong>
          ${placeCount}
        </strong>

        <span>
          ${placeCount === 1
            ? "place"
            : "places"}
        </span>

      </div>


      <div class="stat">

        <strong>
          ${escapeHtml(book.location)}
        </strong>

        <span>
          started here
        </span>

      </div>

    </div>


    <div class="journey-heading">

      <span class="eyebrow">
        THE JOURNEY
      </span>

      <span class="journey-line"></span>

    </div>


    <div class="timeline">

      ${
        chapters.length
          ? chapters.map(
              (chapter, index) => `

                <article class="timeline-entry">

                  <div class="timeline-marker">

                    <span class="dot"></span>

                    ${
                      index < chapters.length - 1
                        ? `<span class="timeline-line"></span>`
                        : ""
                    }

                  </div>


                  <div class="timeline-content">

                    <div class="chapter-meta">

                      <span class="chapter-number">
                        Chapter ${index + 1}
                      </span>

                      <span class="chapter-location">
                        ${escapeHtml(
                          chapter.location ||
                          "Somewhere"
                        )}
                      </span>

                    </div>


                    <h3>
                      ${
                        chapter.name
                          ? escapeHtml(chapter.name)
                          : "An anonymous reader"
                      }
                    </h3>


                    <blockquote>
                      “${escapeHtml(
                        chapter.message
                      )}”
                    </blockquote>

                  </div>

                </article>

              `
            ).join("")
          : `

              <div class="empty-journey">

                <p>
                  This book is waiting for its
                  first chapter.
                </p>

              </div>

            `
      }

    </div>


    <section class="found-book">

      <span class="eyebrow">
        YOU FOUND THIS BOOK
      </span>

      <h2>
        Leave your chapter.
      </h2>

      <p>
        Where did this book find you?
        What did it mean to you?
        Leave a little something behind
        for the next reader.
      </p>

      <button
        class="button primary found-button"
        id="addChapterButton"
      >
        Add Your Chapter
      </button>

      <p class="release-note">
        Then set this book free again.
      </p>

    </section>


    <div
      id="chapterFormContainer"
      style="display:none"
    ></div>


    ${
      latestChapter
        ? `
          <div class="journey-footer">

            <span>
              CURRENTLY TRAVELING
            </span>

            <strong>
              ${escapeHtml(
                latestChapter.location ||
                "Somewhere in the world"
              )}
            </strong>

          </div>
        `
        : ""
    }

  `;

const qrTarget =
  `${window.location.origin}/book.html?id=${encodeURIComponent(book.id)}`;

new QRCode(
  document.getElementById("bookQrCode"),
  {
    text: qrTarget,
    width: 150,
    height: 150
  }
);
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

    <section class="chapter-form">

      <span class="eyebrow">
        YOUR CHAPTER
      </span>

      <h2>
        Where did this book find you?
      </h2>

      <p class="form-intro">
        Every reader leaves something behind.
        Tell the next person a little about
        your part of the journey.
      </p>


      <form id="chapterForm">

        <label>

          <span>
            Your name
          </span>

          <small>
            optional
          </small>

          <input
            id="readerName"
            type="text"
            maxlength="80"
            placeholder="Leave blank to stay anonymous"
          >

        </label>


        <label>

          <span>
            Where are you?
          </span>

          <input
            id="readerLocation"
            type="text"
            maxlength="120"
            required
            placeholder="Portland, Oregon"
          >

        </label>


        <label>

          <span>
            Leave a message
          </span>

          <textarea
            id="readerMessage"
            maxlength="2000"
            required
            rows="6"
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
            Maybe Later
          </button>

        </div>


        <p class="form-help">
          Your name is optional. Your location
          and message become part of this book's
          permanent journey.
        </p>

      </form>

    </section>

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

    const booksQuery = query(
      collection(db, "books"),
      where("id", "==", bookId),
      limit(1)
    );


    const booksSnapshot =
      await getDocs(booksQuery);


    if (booksSnapshot.empty) {
      throw new Error("Book not found.");
    }


    const firebaseBookId =
      booksSnapshot.docs[0].id;


    await addDoc(
      collection(
        db,
        "books",
        firebaseBookId,
        "chapters"
      ),
      {
        name: name || null,
        location,
        message,
        createdAt: serverTimestamp()
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

    <div class="error-state">

      <span class="eyebrow">
        PAPER TRAILS
      </span>

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
        Find a Book
      </a>

    </div>

  `;
}


loadBook();
