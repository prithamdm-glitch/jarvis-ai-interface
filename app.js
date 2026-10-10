const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad con voz.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    let ocupado = false;

    recognition.onstart = () => {
        if (statusText) statusText.textContent = "Escuchando...";
    };

    recognition.onerror = () => {};

    recognition.onend = () => {
        if (!ocupado) {
            try { recognition.start(); } catch (e) {}
        }
    };

    recognition.onresult = (event) => {
        if (ocupado) return;
        const texto = event.results[0][0].transcript.toLowerCase().trim();
        
        if (texto.length > 0) {
            try { recognition.stop(); } catch(e) {}
            ocupado = true;
            if (statusText) statusText.textContent = "Procesando...";

            // Lógica de respuesta directa e instantánea
            let respuesta = "Entendido.";
            if (texto.includes("albert einstein")) {
                respuesta = "Albert Einstein fue un físico teórico conocido por la teoría de la relatividad.";
            } else if (texto.includes("tiempo") || texto.includes("clima")) {
                respuesta = "Para la próxima semana se esperan cielos despejados y temperaturas agradables.";
            } else if (texto.includes("qué puedes hacer")) {
                respuesta = "Puedo responder preguntas, darte la hora y asistirte en lo que necesites.";
            } else if (texto.includes("preséntate") || texto.includes("quién eres")) {
                respuesta = "Hola, soy Jarvis, tu asistente virtual inteligente integrado en la web.";
            } else if (texto.includes("hora")) {
                const d = new Date();
                respuesta = `Son las ${d.getHours()} y ${d.getMinutes()} minutos.`;
            } else {
                respuesta = `Has dicho: ${texto}. Procesando solicitud.`;
            }

            hablar(respuesta);
        }
    };

    function hablar(mensaje) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(mensaje);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;

        utterance.onend = () => {
            ocupado = false;
            if (statusText) statusText.textContent = "Escuchando...";
            try { recognition.start(); } catch (e) {}
        };

        utterance.onerror = () => {
            ocupado = false;
            try { recognition.start(); } catch (e) {}
        };

        window.speechSynthesis.speak(utterance);
    }

    document.addEventListener("click", () => {
        window.speechSynthesis.resume();
        try { recognition.start(); } catch (e) {}
    }, { once: true });
}
