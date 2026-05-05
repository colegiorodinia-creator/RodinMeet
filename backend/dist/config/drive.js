"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToDrive = uploadToDrive;
const googleapis_1 = require("googleapis");
const fs_1 = __importDefault(require("fs"));
// Configuração da autenticação usando Service Account
// Na produção, você precisará ter o arquivo service-account.json na raiz do projeto (backend)
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
async function getAuthClient() {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: './service-account.json', // Caminho para as credenciais da Service Account
            scopes: SCOPES,
        });
        return auth.getClient();
    }
    catch (error) {
        console.error('Aviso: Arquivo service-account.json não encontrado. O upload para o Google Drive não funcionará.');
        return null; // Retorna null se não houver credenciais para facilitar os testes locais
    }
}
async function uploadToDrive(filePath, fileName, folderId) {
    const authClient = await getAuthClient();
    if (!authClient) {
        console.log(`[Modo Mock] Simulando upload de ${fileName} para a pasta ${folderId}`);
        return 'mock-file-id';
    }
    const drive = googleapis_1.google.drive({ version: 'v3', auth: authClient });
    const fileMetadata = {
        name: fileName,
        parents: folderId === 'root' ? [] : [folderId],
    };
    const media = {
        mimeType: 'video/mp4',
        body: fs_1.default.createReadStream(filePath),
    };
    try {
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('Upload bem sucedido. File ID:', file.data.id);
        return file.data.id || null;
    }
    catch (error) {
        console.error('Erro ao fazer upload para o Drive:', error);
        throw error;
    }
}
