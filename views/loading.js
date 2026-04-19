module.exports = () => {
    return `
    <style>
        #global-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #f8f9fa; /* Combina com o fundo do painel */
            z-index: 999999; /* Sobrepõe o menu lateral e modais */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: opacity 0.4s ease, visibility 0.4s ease;
        }
        
        #global-loader.hidden {
            opacity: 0;
            visibility: hidden;
        }

        .loader-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(13, 110, 253, 0.2); /* Cor secundária */
            border-top: 4px solid #0d6efd; /* Cor primária (Bootstrap primary) */
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }

        .loader-text {
            color: #495057;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
    </style>

    <div id="global-loader">
        <div class="loader-spinner"></div>
        <div class="loader-text">Carregando</div>
    </div>

    <script>
        // Ouve o evento 'load' que é disparado quando TUDO na página termina de carregar (imagens, css, js)
        window.addEventListener('load', function() {
            const loader = document.getElementById('global-loader');
            if (loader) {
                // Adiciona a classe que faz o fadeOut via CSS
                loader.classList.add('hidden');
                
                // Remove o elemento do fluxo do DOM após a transição para não bloquear cliques
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 400); 
            }
        });
    </script>
    `;
};