// Hero coordinate readout — follows cursor within the hero section
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const coordX = document.getElementById("coordX");
  const coordY = document.getElementById("coordY");

  if (!hero || !coordX || !coordY) return;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    coordX.textContent = String(x).padStart(3, "0");
    coordY.textContent = String(y).padStart(3, "0");
  });
});