import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { AccessToken } from 'livekit-server-sdk';
import { uploadToDrive } from './config/drive';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.VITE_API_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Configuração do Rate Limit Global
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api/', apiLimiter);

// Configuração do Rate Limit para Uploads (mais restritivo)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 uploads por IP por hora
  message: { error: 'Limite de uploads atingido, tente novamente em uma hora.' }
});

// Configuração do multer para receber vídeos com limites e validação MIME
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
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
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName, // Isso garante que o nome apareça em cima das mensagens do chat
    });
    
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
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
    const folders: Record<string, string> = {
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
    const fileId = await uploadToDrive(filePath, cleanFileName, folderId);

    // Apagar o arquivo temporário
    fs.unlinkSync(filePath);

    res.json({ success: true, fileId });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Falha interna ao realizar upload' });
  }
});

app.listen(port, () => {
  console.log(`RodinMeet Backend rodando na porta ${port}`);
});
