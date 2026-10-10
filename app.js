const jarvisCore = document.getElementById('jarvisCore'); const statusText = document.getElementById('statusText');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        statusText.innerText = "Escuchando...";
        jarvisCore.style.borderColor = "rgba(0, 255, 255, 0.8)";
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            statusText.innerText = "Comando: " + finalTranscript;
            processCommand(finalTranscript.toLowerCase());
        } else {
            statusText.innerText = "Escuchando: " + interimTranscript;
        }
    };

    recognition.onerror = (event) => {
        statusText.innerText = "Error: " + event.error;
    };

    recognition.onend = () => {
        statusText.innerText = "Esperando comando...";
        jarvisCore.style.borderColor = "rgba(0, 255, 255, 0.5)";
        recognition.start();
    };

    function processCommand(command) {
        if (command.includes("jarvis")) {
            statusText.innerText = "Sistema activo, ¿en qué puedo ayudarte?";
        }
    }

    recognition.start();
    statusText.innerText = "Sistema iniciado...";
} else {
    statusText.innerText = "Tu navegador no soporta reconocimiento de voz.";
}
