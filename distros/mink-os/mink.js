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
    { input: "cat /etc/os-release", output: 'NAME="Mink-OS"\nVERSION="1.0.0"\nID=mink\nID_LIKE=fedora\nVARIANT="TTY Edition"' },
    { input: "systemctl list-units --type=service --state=running | wc -l", output: "12" },
    { input: "zfs version", output: "zfs-2.2.6-1.ferret\nzfs-kmod-2.2.6-1.ferret" },
  ];

  let seqIndex = 0;
  let charIndex = 0;
  let typing = true;
  let pauseTimer = null;

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
        pauseTimer = setTimeout(() => {
          out.textContent = current.output;
          pauseTimer = setTimeout(() => {
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

  // Start after a short delay so the page settles
  setTimeout(typeNext, 1200);
});