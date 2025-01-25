document.addEventListener('DOMContentLoaded', async () => {
    const songSelector = document.getElementById('song-selector');
    const timeline = document.getElementById('timeline');
    const alertSound = new Audio('sounds/alert.mp3');
    const backgroundAudio = document.getElementById('background-audio');
    const toggleAudioButton = document.getElementById('toggle-audio');
    let progressInterval = null;
    let progressBar = null;
    let isAlertsMode = false; // Indica se o botão "Reproduzir Alertas" foi usado
    let activeTimings = []; // Armazena os timings da música atual
    let triggeredTimings = new Set(); // Armazena os timings já ativados
    let isSeeking = false; // Indica se o usuário está arrastando o progresso do áudio

    try {
        // Fazer uma requisição ao servidor para obter as músicas
        const response = await fetch('https://guitar-flash-backend.onrender.com/songs');
        const songs = await response.json();

        // Preencher o seletor de músicas com os dados do backend
        songs.forEach(song => {
            const option = document.createElement('option');
            option.value = song.id;
            option.textContent = song.name;
            songSelector.appendChild(option);
        });

        // Evento para carregar o áudio correspondente à música selecionada
        songSelector.addEventListener('change', () => {
            const selectedSongId = songSelector.value;
            const selectedSong = songs.find(song => song.id == selectedSongId);

            if (selectedSong) {
                // Atualizar o elemento <audio> com o arquivo correspondente
                backgroundAudio.src = selectedSong.audio;
                backgroundAudio.style.display = 'block'; // Tornar o áudio visível

                // Atualizar os timings ativos
                activeTimings = [...selectedSong.timings];
                triggeredTimings.clear(); // Limpar os timings já ativados

                // Aguarde o carregamento dos metadados do áudio
                backgroundAudio.addEventListener('loadedmetadata', () => {
                    updateTimeline(selectedSong.timings, backgroundAudio.duration); // Atualizar a linha do tempo
                });
            }
        });

        // Toggle para desativar ou ativar o áudio
        toggleAudioButton.addEventListener('click', () => {
            isAudioMuted = !isAudioMuted;
            backgroundAudio.muted = isAudioMuted;

            // Atualizar texto do botão
            toggleAudioButton.textContent = isAudioMuted ? 'Ativar Áudio' : 'Desativar Áudio';
        });

        // Adicionar evento para o botão "Reproduzir Alertas"
        document.getElementById('play-alerts').addEventListener('click', () => {
            const selectedSongId = songSelector.value;
            if (!selectedSongId) {
                alert('Selecione uma música primeiro!');
                return;
            }

            const selectedSong = songs.find(song => song.id == selectedSongId);
            if (selectedSong) {
                isAlertsMode = true; // Ativar o modo de alertas
                playAudioWithAlerts(selectedSong.timings);
            }
        });

        // Sincronizar barra de progresso com os controles de áudio e iniciar alertas
        backgroundAudio.addEventListener('play', () => {
            startProgressBarSync();
            if (!isAlertsMode) {
                startProgressBar(); // Iniciar barra de progresso se não estiver no modo alertas
            }
        });

        backgroundAudio.addEventListener('pause', () => stopProgressBarSync());

        backgroundAudio.addEventListener('seeking', () => {
            isSeeking = true; // Marcar que o usuário está arrastando o progresso
        });

        backgroundAudio.addEventListener('seeked', () => {
            isSeeking = false; // Marcar que o usuário terminou de arrastar o progresso
            triggeredTimings.clear(); // Limpar os timings ativados para reativação correta
        });

        backgroundAudio.addEventListener('timeupdate', () => {
            updateProgressBar();
            if (!isSeeking) {
                triggerAlerts(backgroundAudio.currentTime);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar as músicas:', error);
    }

    function playAudioWithAlerts(timings) {
        if (!timings || timings.length === 0) {
            console.log('Nenhum timing encontrado para essa música.');
            return;
        }

        triggeredTimings.clear(); // Limpar os timings já ativados

        backgroundAudio.onended = () => {
            console.log('Áudio finalizado.');
            stopProgressBarSync();
        };
    }

    function triggerAlerts(currentTime) {
        if (!activeTimings || activeTimings.length === 0) {
            return;
        }

        activeTimings.forEach((time, index) => {
            if (time <= currentTime && !triggeredTimings.has(time)) {
                triggeredTimings.add(time); // Marcar o timing como ativado

                alertSound.play().catch(error => console.error('Erro ao reproduzir som:', error));
                console.log(`Especial ${index + 1} ativado no tempo ${time}s`);

                // Destacar marcador visualmente
                const markers = document.getElementsByClassName('marker');
                if (markers[index]) {
                    markers[index].classList.add('active');
                    setTimeout(() => markers[index].classList.remove('active'), 1000);
                }
            }
        });
    }

    function startProgressBar() {
        if (progressBar) {
            timeline.removeChild(progressBar);
        }

        progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.style.position = 'absolute';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.height = '100%';
        progressBar.style.width = '0';
        progressBar.style.backgroundColor = 'blue';
        progressBar.style.opacity = '0.5';
        timeline.appendChild(progressBar);

        updateProgressBar(); // Sincronizar barra com o tempo inicial do áudio
    }

    function stopProgressBarSync() {
        clearInterval(progressInterval); // Pausar o intervalo
    }

    function updateProgressBar() {
        if (progressBar) {
            const progress = (backgroundAudio.currentTime / backgroundAudio.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    function startProgressBarSync() {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        progressInterval = setInterval(() => updateProgressBar(), 100);
    }

    // Função para atualizar a linha do tempo com os momentos dos especiais
    function updateTimeline(timings, totalDuration) {
        timeline.innerHTML = ''; // Limpar a linha do tempo
        if (!timings || timings.length === 0) {
            timeline.textContent = 'Nenhum timing disponível.';
            return;
        }

        timings.forEach(time => {
            const marker = document.createElement('div');
            marker.className = 'marker';
            marker.style.position = 'absolute';
            marker.style.top = '0';
            marker.style.height = '100%';
            marker.style.width = '5px';
            marker.style.backgroundColor = 'red';
            marker.style.left = `${(time / totalDuration) * 100}%`; // Posição relativa na barra
            timeline.appendChild(marker);
        });
    }
});