const form = document.getElementById("releaseForm");
const countEl = document.getElementById("bookCount");

function getBooks() {
  return JSON.parse(localStorage.getItem("paperTrailsBooks") || "[]");
}
function saveBooks(books) {
  localStorage.setItem("paperTrailsBooks", JSON.stringify(books));
}
function nextId() {
  const books = getBooks();
  return `PT-${String(books.length + 1).padStart(6, "0")}`;
}
function updateCount() {
  countEl.textContent = getBooks().length;
}
function showPassport(book) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="passport-card">
      <button class="close" aria-label="Close">×</button>
      <p class="eyebrow">YOUR BOOK PASSPORT IS READY</p>
      <h2>${escapeHtml(book.title)}</h2>
      <p>${escapeHtml(book.author)}</p>
      <div class="passport-grid">
        <div>
          <p><strong>Passport No.</strong><br>${book.id}</p>
          <p><strong>Issued in</strong><br>${escapeHtml(book.location)}</p>
          <p><strong>Journey started</strong><br>${new Date(book.created).toLocaleDateString()}</p>
          <p><strong>First note</strong><br><em>“${escapeHtml(book.message)}”</em></p>
          <button class="button primary" id="printPassport">Print Passport</button>
        </div>
        <div class="qr"><div id="qrcode"></div></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  new QRCode(document.getElementById("qrcode"), {
    text: `${location.origin}/book.html?id=${encodeURIComponent(book.id)}`,
    width: 160,
    height: 160
  });
  modal.querySelector(".close").onclick = () => modal.remove();
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  modal.querySelector("#printPassport").onclick = () => window.print();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const book = {
    id: nextId(),
    title: document.getElementById("title").value.trim(),
    author: document.getElementById("author").value.trim(),
    location: document.getElementById("location").value.trim(),
    message: document.getElementById("message").value.trim(),
    created: new Date().toISOString(),
    journey: []
  };
  book.journey.push({
    location: book.location,
    message: book.message,
    date: book.created
  });
  const books = getBooks();
  books.push(book);
  saveBooks(books);
  form.reset();
  updateCount();
  showPassport(book);
});
updateCount();
