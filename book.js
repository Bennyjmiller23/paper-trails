import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


const params =
  new URLSearchParams(window.location.search);

const bookId =
  params.get("id");

const content =
  document.getElementById("content");


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character]));

}


async function loadBook() {

  if (!bookId) {

    content.innerHTML = `
      <p class="eyebrow">
        PAPER TRAILS
      </p>

      <h2>
        No book was specified.
      </h2>

      <p>
        Scan a Paper Trails QR code
        or enter a Paper Trails ID.
      </p>

      <a
        class="button primary"
        href="index.html#journey"
      >
        Find a book
      </a>
    `;

    return;
  }


  try {

    const bookReference =
      doc(
        db,
        "books",
        bookId
      );


    const bookSnapshot =
      await getDoc(bookReference);


    if (!bookSnapshot.exists()) {

      content.innerHTML = `
        <p class="eyebrow">
          PAPER TRAILS
        </p>

        <h2>
          We couldn't find that book.
        </h2>

        <p>
          Check the Paper Trails number
          and try again.
        </p>

        <a
          class="button primary"
          href="index.html#release"
        >
          Release a book
        </a>
      `;

      return;
    }


    const book =
      bookSnapshot.data();


    const chaptersReference =
      collection(
        db,
        "books",
        bookId,
        "chapters"
      );


    const chaptersQuery =
      query(
        chaptersReference,
        orderBy(
          "createdAt",
          "asc"
        )
      );


    const chaptersSnapshot =
      await getDocs(chaptersQuery);


    const chapters =
      chaptersSnapshot.docs.map(
        (chapter) => chapter.data()
      );


    const places =
      new Set(
        chapters
          .map(
            (chapter) =>
              chapter.location
          )
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

        ${chapters.map(
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

              <p>
                “${escapeHtml(
                  chapter.message
                )}”
              </p>

            </div>

          </div>

        `
        ).join("")}

      </div>


      <div style="margin-top:40px">

        <p class="eyebrow">
          THE JOURNEY CONTINUES
        </p>

        <h3>
          Where will this book go next?
        </h3>

        <p>
          The next reader can add their
          chapter to this Paper Trail.
        </p>

        <button
          class="button primary"
          disabled
        >
          Add Your Chapter — Coming Next
        </button>

      </div>

    `;

  } catch (error) {

    console.error(
      "Paper Trails error:",
      error
    );


    content.innerHTML = `

      <p class="eyebrow">
        PAPER TRAILS
      </p>

      <h2>
        Something went wrong.
      </h2>

      <p>
        We couldn't load this book's
        journey right now.
      </p>

      <a
        class="button primary"
        href="index.html"
      >
        Return to Paper Trails
      </a>

    `;

  }

}


loadBook();
