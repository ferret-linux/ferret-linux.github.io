document.addEventListener("DOMContentLoaded", () => {

  // --- Coordinate readout ---
  const hero = document.querySelector(".hero");
  const coordX = document.getElementById("coordX");
  const coordY = document.getElementById("coordY");

  if (hero && coordX && coordY) {
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      coordX.textContent = String(x).padStart(3, "0");
      coordY.textContent = String(y).padStart(3, "0");
    });
  }

  // --- TUI row highlight cycle ---
  // Simulates the cursor moving through the picker list
  const rows = document.querySelectorAll(".terminal__ui-row");
  if (!rows.length) return;

  let current = 0;

  function highlightNext() {
    rows.forEach(r => r.classList.remove("terminal__ui-row--selected"));
    rows[current].classList.add("terminal__ui-row--selected");
    current = (current + 1) % rows.length;
  }

  setInterval(highlightNext, 1400);
});