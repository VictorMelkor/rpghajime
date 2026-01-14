const rollBtn = document.getElementById("rollBtn");
const moreDice = document.getElementById("moreDice");
const rollLinesContainer = document.getElementById("rollLines");

// adicionar nova linha
moreDice.addEventListener("click", () => {
    const newLine = document.createElement("div");
    newLine.className = "roll-line";

    newLine.innerHTML = `
        <input type="number" class="diceCount" value="1" min="1">
        <select class="diceType">
          <option value="2">d2</option>
          <option value="3">d3</option>
          <option value="4">d4</option>
          <option value="6">d6</option>
          <option value="8">d8</option>
          <option value="10">d10</option>
          <option value="12">d12</option>
          <option value="20" selected>d20</option>
        </select>
        <input type="number" class="mod" value="0">
        <button class="remove-line">×</button>
    `;
    rollLinesContainer.appendChild(newLine);
});

// remover linha
rollLinesContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-line")) {
        e.target.closest(".roll-line").remove();
    }
});

function collectForm() {
    const lines = [];
    document.querySelectorAll(".roll-line").forEach(line => {
        const diceCount = parseInt(line.querySelector(".diceCount").value,10) || 1;
        const diceType = parseInt(line.querySelector(".diceType").value,10) || 20;
        const mod = parseInt(line.querySelector(".mod").value,10) || 0;
        lines.push({diceCount, diceType, mod});
    });
    return {
        player: document.getElementById("charName").value || "—",
        rollKind: document.getElementById("rollType").value || "Rolagem",
        rolls: lines
    };
}

async function sendRoll(payload) {
    await fetch("/api/roll", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });
}

rollBtn.addEventListener("click", async () => {
    const data = collectForm();
    await sendRoll(data);
});
