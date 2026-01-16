const feedEl = document.getElementById("feed");

let lastId = null;
const MAX_ENTRIES = 200;

// converte timestamp UNIX para string no horário de Brasília
function formatBRTime(ts) {
    const date = new Date(ts * 1000);
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function loadFeed() {
    try {
        const url = lastId
            ? `/api/feed?after=${lastId}`
            : `/api/feed?limit=50`;

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) return;

        // garantir ordem crescente para inserção visual correta
        const ordered = data.slice().sort((a, b) => a.id - b.id);

        ordered.forEach(e => renderEntry(e));

        lastId = ordered[ordered.length - 1].id;

        trimFeed();

    } catch (e) {
        console.error("Erro ao carregar feed:", e);
    }
}

function renderEntry(e) {
    const div = document.createElement("div");
    div.className = "entry";

    const lines = Array.isArray(e.lines) ? e.lines : [];

    let dadosStr = lines.map(l => {
        let s = `${l.dice}: [${l.rolls.join(", ")}]`;
        if (l.mod) s += ` + (${l.mod})`;
        return s;
    }).join(" ; ");

    div.innerHTML = `
        <strong>${(e.player || "").toUpperCase()} - ${(e.roll_kind || "").toUpperCase()}</strong><br>
        DADOS: ${dadosStr}<br>
        TOTAL: <strong>${e.total}</strong><br>
        <small>${formatBRTime(e.time)}</small>
    `;

    // insere no topo
    feedEl.prepend(div);
}

function trimFeed() {
    while (feedEl.children.length > MAX_ENTRIES) {
        feedEl.removeChild(feedEl.lastChild);
    }
}

// inicialização
loadFeed();
setInterval(loadFeed, 1500);
