import confetti from 'canvas-confetti'

// Efeito 1: Disparo contínuo pelos cantos (para acertos super importantes/combos)
export const dispararConfetes = () => {
    const duracao = 2000
    const fim = Date.now() + duracao

    const cores = ['#f97316', '#fb923c', '#fdba74'] // Paleta MAT-IA

    ;(function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: cores
        })
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: cores
        })

        if (Date.now() < fim) {
            requestAnimationFrame(frame)
        }
    })()
}

// Efeito 2: Disparo único no centro (ótimo para acertos normais)
export const dispararConfetesCentro = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74']
    })
}