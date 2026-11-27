const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
let formLoadedAt; 
let timestampSignature;
let timestampReady = false;
const button = form.querySelector('button[type="submit"]');
button.disabled = true; 

async function getTimestamp() {
  try {
  const response = await fetch("/contact-timestamp");
  if (!response.ok) {
    throw new Error();
  }
  const data = await response.json();

  if (
   !Number.isFinite(data.formLoadedAt) ||
    typeof data.signature !== "string" ||
    !/^[0-9a-f]{64}$/i.test(data.signature)
  ) {
    throw new Error();
  }

  formLoadedAt = data.formLoadedAt;
  timestampSignature = data.signature;

  timestampReady = true;
  button.disabled = false;
  } catch (error) {
  console.error(error);
  statusEl.textContent =
      "Something went wrong. Please email hello@calicomedia.co instead.";
  statusEl.classList.add("form-status--error");
  }

} getTimestamp();  


form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!timestampReady) {
  return;
  }
  button.disabled = true;
  statusEl.textContent = "";
  statusEl.className = "form-status";

  try {
    const data = Object.fromEntries(new FormData(form));

    data.formLoadedAt = formLoadedAt;
    data.signature = timestampSignature;
    const response = await fetch("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    form.reset();
    statusEl.textContent = "Thanks, we'll be in touch within one business day.";
    statusEl.classList.add("form-status--success");
  } catch (error) {
    statusEl.textContent =
      error.message ||
      "Something went wrong. Please email hello@calicomedia.co instead.";
    statusEl.classList.add("form-status--error");
  } finally {
  button.disabled = !timestampReady;
}
});



