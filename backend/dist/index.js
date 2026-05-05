"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const drive_1 = require("./config/drive");
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuração do multer para receber vídeos
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
// Endpoint para gerar tokens de acesso do LiveKit
app.post('/api/token', (req, res) => {
    const { roomName, participantName } = req.body;
    if (!roomName || !participantName) {
        return res.status(400).json({ error: 'roomName e participantName são obrigatórios' });
    }
    try {
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: participantName,
        });
        at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
        const token = at.toJwt();
        res.json({ token });
    }
    catch (error) {
        console.error('Erro ao gerar token:', error);
        res.status(500).json({ error: 'Falha interna ao gerar token' });
    }
});
// Endpoint para receber o upload da gravação e enviar para o Google Drive
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        const { tag, meetingName, hostEmail } = req.body;
        const filePath = req.file.path;
        const originalName = req.file.originalname;
        console.log(`Recebendo gravação: ${meetingName} (${tag}) por ${hostEmail}`);
        // Determinar a pasta no drive com base na tag
        // Estes IDs de pasta deverão ser substituídos pelos Folder IDs reais do Google Drive
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
        const cleanFileName = `${dateStr} - ${tag} - ${meetingName}.mp4`;
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
app.listen(port, () => {
    console.log(`RodinMeet Backend rodando na porta ${port}`);
});
