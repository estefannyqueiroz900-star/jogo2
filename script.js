
const TOTAL_PARES = 16;
const TEMPO_INICIAL = 90;

const elencoAlternativo = [
    { nome: "Patrick Jane", foto: "" },
    { nome: "Teresa Lisbon", foto: "" },
    { nome: "Kimball Cho", foto: "" },
    { nome: "Wayne Rigsby", foto: "" },
    { nome: "Grace Van Pelt", foto: "" },
    { nome: "Dennis Abbott", foto: "" },
    { nome: "Kim Fischer", foto: "" },
    { nome: "Jason Wylie", foto: "" },
    { nome: "Michelle Vega", foto: "" },
    { nome: "LaRoche", foto: "" },
    { nome: "Brett Partridge", foto: "" },
    { nome: "Kristina Frye", foto: "" },
    { nome: "Walter Mashburn", foto: "" },
    { nome: "Gale Bertram", foto: "" },
    { nome: "Red John", foto: "" },
    { nome: "Virgil Minelli", foto: "" }
];

const telas = {
    inicio: document.getElementById("telaInicio"),
    jogo: document.getElementById("telaJogo"),
    resultado: document.getElementById("telaResultado")
};

const tabuleiro = document.getElementById("tabuleiro");
const tempoElemento = document.getElementById("tempo");
const pontosElemento = document.getElementById("pontos");
const paresElemento = document.getElementById("pares");
const tentativasElemento = document.getElementById("tentativas");
const statusElemento = document.getElementById("status");
const barraProgresso = document.getElementById("barraProgresso");

let elenco = elencoAlternativo;
let cartasViradas = [];
let paresEncontrados = 0;
let pontos = 0;
let tentativas = 0;
let tempoRestante = TEMPO_INICIAL;
let intervalo = null;
let bloqueado = false;
let partidaAtiva = false;
let imagensPrecarregadas = [];

function mostrarTela(nome) {
    Object.values(telas).forEach(tela => tela.classList.remove("ativa"));
    telas[nome].classList.add("ativa");
}

function embaralhar(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}

function atualizarPainel() {
    tempoElemento.textContent =
        `00:${String(tempoRestante).padStart(2, "0")}`;

    pontosElemento.textContent = String(pontos).padStart(4, "0");
    paresElemento.textContent =
        `${String(paresEncontrados).padStart(2, "0")}/${TOTAL_PARES}`;
    tentativasElemento.textContent = tentativas;

    barraProgresso.style.width =
        `${(paresEncontrados / TOTAL_PARES) * 100}%`;

    tempoElemento.classList.toggle("urgente", tempoRestante <= 15);
}

function pararCronometro() {
    if (intervalo !== null) {
        clearInterval(intervalo);
        intervalo = null;
    }
}

function iniciarCronometro() {
    pararCronometro();

    intervalo = setInterval(() => {
        if (!partidaAtiva) return;

        tempoRestante--;
        atualizarPainel();

        if (tempoRestante <= 0) {
            finalizarJogo(false);
        }
    }, 1000);
}

function criarCarta(personagem, indice) {
    const carta = document.createElement("button");
    carta.type = "button";
    carta.className = "carta";
    carta.dataset.nome = personagem.nome;
    carta.setAttribute(
        "aria-label",
        `Carta ${indice + 1}, ainda fechada`
    );

    carta.innerHTML = `
        <span class="interno">
            <span class="frente">
                <span class="simbolo">M</span>
                <small>EVIDÊNCIA</small>
            </span>
            <span class="verso">
                <span class="nome-personagem"></span>
            </span>
        </span>
    `;

    const verso = carta.querySelector(".verso");
    const nome = carta.querySelector(".nome-personagem");

    nome.textContent = personagem.nome;

    if (personagem.foto) {
        const img = document.createElement("img");
        img.src = personagem.foto;
        img.alt = personagem.nome;
        img.loading = "eager";
        img.decoding = "async";

        img.addEventListener("error", () => {
            img.remove();
            carta.classList.add("sem-foto");
        });

        verso.prepend(img);
    } else {
        carta.classList.add("sem-foto");
    }

    carta.addEventListener("click", () => virarCarta(carta));

    return carta;
}

function prepararCartas() {
    tabuleiro.replaceChildren();

    const baralho = embaralhar(
        elenco.slice(0, TOTAL_PARES).flatMap((personagem, id) => [
            { ...personagem, id },
            { ...personagem, id }
        ])
    );

    baralho.forEach((personagem, indice) => {
        tabuleiro.appendChild(criarCarta(personagem, indice));
    });
}

function virarCarta(carta) {
    if (!partidaAtiva || bloqueado) return;
    if (carta.classList.contains("virada")) return;
    if (carta.classList.contains("encontrada")) return;

    carta.classList.add("virada");
    carta.setAttribute("aria-label", carta.dataset.nome);
    cartasViradas.push(carta);

    if (cartasViradas.length !== 2) return;

    tentativas++;

    const [primeira, segunda] = cartasViradas;
    const idPrimeiro = primeira.querySelector(".nome-personagem").textContent;
    const idSegundo = segunda.querySelector(".nome-personagem").textContent;

    if (idPrimeiro === idSegundo) {
        primeira.classList.add("encontrada");
        segunda.classList.add("encontrada");

        primeira.disabled = true;
        segunda.disabled = true;

        paresEncontrados++;
        pontos += 100;

        statusElemento.textContent = "Par encontrado! +100 pontos.";
        cartasViradas = [];
        atualizarPainel();

        if (paresEncontrados === TOTAL_PARES) {
            finalizarJogo(true);
        }

        return;
    }

    pontos = Math.max(0, pontos - 20);
    bloqueado = true;
    statusElemento.textContent = "Não são iguais. -20 pontos.";

    atualizarPainel();

    setTimeout(() => {
        primeira.classList.remove("virada");
        segunda.classList.remove("virada");

        primeira.setAttribute("aria-label", "Carta fechada");
        segunda.setAttribute("aria-label", "Carta fechada");

        cartasViradas = [];
        bloqueado = false;

        if (partidaAtiva) {
            statusElemento.textContent =
                "Continue investigando e encontre os pares.";
        }
    }, 850);
}

function finalizarJogo(venceu) {
    if (!partidaAtiva) return;

    partidaAtiva = false;
    pararCronometro();

    mostrarTela("resultado");

    document.getElementById("simboloResultado").textContent =
        venceu ? "★" : "⌛";

    document.getElementById("tituloResultado").textContent =
        venceu ? "CASO RESOLVIDO!" : "CASO NÃO RESOLVIDO";

    document.getElementById("mensagemResultado").textContent =
        venceu
            ? `Parabéns, investigador! Você encontrou todos os pares em ${tentativas} tentativas.`
            : `O tempo acabou! Você encontrou ${paresEncontrados} de ${TOTAL_PARES} pares. Tente novamente!`;

    document.getElementById("pontuacaoFinal").textContent = pontos;
}

function iniciarJogo() {
    pararCronometro();

    cartasViradas = [];
    paresEncontrados = 0;
    pontos = 0;
    tentativas = 0;
    tempoRestante = TEMPO_INICIAL;
    bloqueado = false;
    partidaAtiva = true;

    atualizarPainel();
    prepararCartas();
    mostrarTela("jogo");

    statusElemento.textContent = "Investigação iniciada. Boa sorte!";
    iniciarCronometro();
}

function voltarAoInicio() {
    partidaAtiva = false;
    pararCronometro();
    mostrarTela("inicio");
}

async function carregarElenco() {
    statusElemento.textContent = "Carregando arquivos dos personagens...";

    try {
        const resposta = await fetch(
            "https://api.tvmaze.com/singlesearch/shows?q=The%20Mentalist&embed=cast"
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar o elenco.");
        }

        const dados = await resposta.json();
        const elencoAPI = dados?._embedded?.cast || [];

        const personagens = elencoAPI
            .map(item => ({
                nome: item.character?.name || item.person?.name,
                foto: item.character?.image?.medium ||
                      item.person?.image?.medium ||
                      ""
            }))
            .filter(item => item.nome);

        const unicos = [];
        const nomesVistos = new Set();

        for (const personagem of personagens) {
            const chave = personagem.nome.toLowerCase();

            if (!nomesVistos.has(chave)) {
                nomesVistos.add(chave);
                unicos.push(personagem);
            }
        }

        if (unicos.length >= TOTAL_PARES) {
            elenco = unicos.slice(0, TOTAL_PARES);
        } else {
            throw new Error("O elenco retornado não tem personagens suficientes.");
        }
    } catch (erro) {
        console.warn("Usando elenco alternativo:", erro.message);
        elenco = elencoAlternativo;
    }

    // Prepara as imagens antes do início para reduzir atrasos.
    imagensPrecarregadas = elenco.map(personagem => {
        if (!personagem.foto) return null;

        const img = new Image();
        img.src = personagem.foto;
        return img;
    });

    statusElemento.textContent =
        "Arquivos prontos. Inicie a investigação!";
}

document.getElementById("btnJogar").addEventListener("click", iniciarJogo);
document.getElementById("btnNovamente").addEventListener("click", iniciarJogo);
document.getElementById("btnVoltarInicio").addEventListener("click", voltarAoInicio);
document.getElementById("btnVoltarResultado").addEventListener("click", voltarAoInicio);

document.getElementById("logoInicio").addEventListener("click", event => {
    event.preventDefault();
    voltarAoInicio();
});

carregarElenco();
