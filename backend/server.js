const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
    origin: 'https://jlucassp.github.io'
}));

// Caminho para o arquivo music.json
const musicFilePath = path.join(__dirname, 'data', 'music.json');

// Endpoint para retornar as músicas
app.get('/songs', (req, res) => {
    fs.readFile(musicFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo music.json:', err);
            return res.status(500).json({ error: 'Erro ao ler as músicas' });
        }

        try {
            const songs = JSON.parse(data); // Parse do JSON
            res.json(songs); // Enviar as músicas como resposta
        } catch (parseError) {
            console.error('Erro ao fazer o parse do JSON:', parseError);
            res.status(500).json({ error: 'Erro ao processar as músicas' });
        }
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});