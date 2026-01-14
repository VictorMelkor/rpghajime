const feedEl = document.getElementById("feed");

// converte timestamp UNIX para string no horário de Brasília
function formatBRTime(ts) {
    const date = new Date(ts * 1000);
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function loadFeed() {
    try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = await res.json();
        if (!Array.isArray(data)) return;

        // mais recentes primeiro
        const sorted = data.slice().sort((a,b) => b.time - a.time);
        renderFeed(sorted);
    } catch (e) {
        console.error("Erro ao carregar feed:", e);
    }
}

function renderFeed(entries) {
    feedEl.innerHTML = "";

    entries.forEach(e => {
        const div = document.createElement("div");
        div.className = "entry";

        let dadosStr = e.lines.map(l => {
            let s = `${l.dice}: [${l.rolls.join(", ")}]`;
            if (l.mod) s += ` + (${l.mod})`;
            return s;
        }).join(" ; ");

        div.innerHTML = `
            <strong>${e.player.toUpperCase()} - ${e.rollKind.toUpperCase()}</strong><br>
            DADOS: ${dadosStr}<br>
            TOTAL: <strong>${e.total}</strong><br>
            <small>${formatBRTime(e.time)}</small>
        `;

        feedEl.appendChild(div);
    });

    feedEl.scrollTop = 0;
}

// inicia polling
loadFeed();
setInterval(loadFeed, 1500);
