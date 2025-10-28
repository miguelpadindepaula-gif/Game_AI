const CLASSIC_IMAGES = [];
function loadClassicImages() {
    const files = [
        "humano1.jpg","humano2.jpg","humano3.jpg","humano4.jpg","humano5.jpg",
        "humano6.jpg","humano7.jpg","humano8.jpg","humano9.jpg","humano10.jpg",
        "ai1.png","ai2.png","ai3.png","ai4.png","ai5.png",
        "ai6.png","ai7.jpg","ai8.jpg","ai9.jpg","ai10.jpg"
    ];
    CLASSIC_IMAGES.length = 0;
    files.forEach(f => {
        const type = f.toLowerCase().includes("ai") ? "ai" : "human";
        const url = `./Imagens/classico/${f}`;
        CLASSIC_IMAGES.push({url, type});
        const img = new Image();
        img.src = url;
        img.onerror = () => console.warn(`⚠️ Imagem não encontrada: ${url}`);
    });
}
function shuffleImages(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
let classicPool = [];
function initClassicPool() {
    loadClassicImages();
    classicPool = shuffleImages([...CLASSIC_IMAGES]);
}
function getNextClassicImage() {
    if (classicPool.length === 0) initClassicPool();
    return classicPool.pop();
}

