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

  // --- Typewriter on hero terminal ---
  const cmd = document.getElementById("typewriter-cmd");
  const out = document.getElementById("typewriter-out");
  const cursor = document.getElementById("typewriter-cursor");

  if (!cmd || !out || !cursor) return;

  const sequence = [
    { input: "zfetch --config", output: "→ launching TUI config editor..." },
    { input: "zfetch --os arch", output: "→ using arch logo" },
    { input: "zfetch --image ~/wallpaper.png", output: "→ rendering via kitty graphics protocol" },
  ];

  let seqIndex = 0;
  let charIndex = 0;
  let typing = true;

  function typeNext() {
    const current = sequence[seqIndex];

    if (typing) {
      if (charIndex < current.input.length) {
        cmd.textContent += current.input[charIndex];
        charIndex++;
        setTimeout(typeNext, 55 + Math.random() * 40);
      } else {
        typing = false;
        cursor.style.display = "none";
        setTimeout(() => {
          out.textContent = current.output;
          setTimeout(() => {
            out.textContent = "";
            cmd.textContent = "";
            charIndex = 0;
            typing = true;
            cursor.style.display = "";
            seqIndex = (seqIndex + 1) % sequence.length;
            typeNext();
          }, 2200);
        }, 400);
      }
    }
  }

  setTimeout(typeNext, 1200);
});