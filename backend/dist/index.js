"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const drive_1 = require("./config/drive");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.VITE_API_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
// Configuração do Rate Limit Global
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por IP
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api/', apiLimiter);
// Configuração do Rate Limit para Uploads (mais restritivo)
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 uploads por IP por hora
    message: { error: 'Limite de uploads atingido, tente novamente em uma hora.' }
});
// Configuração do multer para receber vídeos com limites e validação MIME
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos de vídeo são permitidos.'));
        }
    }
});
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('ERRO CRÍTICO: LIVEKIT_API_KEY ou LIVEKIT_API_SECRET não está configurado.');
    process.exit(1);
}
// Endpoint para gerar tokens de acesso do LiveKit
app.post('/api/token', async (req, res) => {
    const { roomName, participantName } = req.body;
    if (!roomName || !participantName) {
        return res.status(400).json({ error: 'roomName e participantName são obrigatórios' });
    }
    try {
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: participantName,
            name: participantName, // Isso garante que o nome apareça em cima das mensagens do chat
        });
        at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
        const token = await at.toJwt();
        res.json({ token });
    }
    catch (error) {
        console.error('Erro ao gerar token:', error);
        res.status(500).json({ error: 'Falha interna ao gerar token' });
    }
});
// Endpoint para receber o upload da gravação e enviar para o Google Drive
app.post('/api/upload', uploadLimiter, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        const { tag, meetingName, hostEmail } = req.body;
        const filePath = req.file.path;
        const originalName = req.file.originalname;
        console.log(`Recebendo gravação: ${meetingName} (${tag}) por ${hostEmail}`);
        // Mapeamento simples: Cada opção aponta para a variável correspondente no arquivo .env
        // O usuário só precisa colar o ID de cada subpasta no .env
        const folders = {
            '6_ano': process.env.FOLDER_6_ANO || 'root',
            '7_ano': process.env.FOLDER_7_ANO || 'root',
            '8_ano': process.env.FOLDER_8_ANO || 'root',
            '9_ano': process.env.FOLDER_9_ANO || 'root',
            '1_serie': process.env.FOLDER_1_SERIE || 'root',
            '2_serie': process.env.FOLDER_2_SERIE || 'root',
            'terceirao': process.env.FOLDER_TERCEIRAO || 'root',
            'interno': process.env.FOLDER_INTERNO || 'root',
        };
        const folderId = folders[tag] || 'root';
        const dateStr = new Date().toISOString().split('T')[0];
        const cleanFileName = `${dateStr} - ${tag} - ${meetingName}.webm`;
        console.log(`Fazendo upload para a pasta: ${folderId} com nome ${cleanFileName}`);
        // Upload para o drive (a função uploadToDrive será implementada no módulo drive)
        const fileId = await (0, drive_1.uploadToDrive)(filePath, cleanFileName, folderId);
        // Apagar o arquivo temporário
        fs_1.default.unlinkSync(filePath);
        res.json({ success: true, fileId });
    }
    catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Falha interna ao realizar upload' });
    }
});
// Servir frontend
const frontendDistPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDistPath));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendDistPath, 'index.html'));
});
app.listen(port, () => {
    console.log(`RodinMeet Backend rodando na porta ${port}`);
});
