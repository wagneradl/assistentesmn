// script.js
document.addEventListener("DOMContentLoaded", function() {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatMessages = document.getElementById("chat-messages");

    // Função para adicionar uma mensagem ao chat
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.classList.add(sender);
        try {
            // Converter Markdown para HTML
            messageElement.innerHTML = marked.parse(message);
        } catch (error) {
            console.error('Erro ao processar Markdown:', error);
            messageElement.innerHTML = message; // Fallback para texto simples
        }
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Função para mostrar a animação dos pontos
    function showLoadingAnimation() {
        const loadingElement = document.createElement("div");
        loadingElement.classList.add("chat-message", "loading-animation");
        loadingElement.innerHTML = '<div class="dot-carousel"></div>';
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Função para remover a animação dos pontos
    function removeLoadingAnimation() {
        const loadingElement = document.querySelector(".loading-animation");
        if (loadingElement) {
            chatMessages.removeChild(loadingElement);
        }
    }

    // Função para enviar a mensagem
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return;

        addMessageToChat(message, "user-message");

        // Limpar a caixa de mensagem
        messageInput.value = "";

        // Desativar o botão de enviar e mudar sua cor
        sendButton.disabled = true;
        sendButton.classList.add("disabled");

        // Mostrar a animação dos pontos
        showLoadingAnimation();

        // Enviar a mensagem ao backend
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error('Erro ao obter resposta do servidor.');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            const botMessage = data.response;
            removeLoadingAnimation();
            addMessageToChat(botMessage, "bot-message");

        } catch (error) {
            console.error('Erro:', error);
            removeLoadingAnimation();
            addMessageToChat("Erro ao obter resposta do servidor.", "error-message");
        }

        // Reativar o botão de enviar e restaurar sua cor
        sendButton.disabled = false;
        sendButton.classList.remove("disabled");
    }

    // Adicionar evento ao botão de enviar
    sendButton.addEventListener("click", sendMessage);
    sendButton.addEventListener("touchend", sendMessage);

    // Permitir envio com a tecla Enter
    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Evitar o comportamento padrão do Enter
            sendMessage();
        }
    });
     // Desativar autocomplete no input
     messageInput.setAttribute("autocomplete", "off");
});