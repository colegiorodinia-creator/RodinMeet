import { google } from 'googleapis';
import fs from 'fs';

// Configuração da autenticação usando OAuth2
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

async function getAuthClient() {
  try {
    let credentials;
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } else {
      const content = fs.readFileSync('./credentials.json', 'utf8');
      credentials = JSON.parse(content);
    }
    const { client_secret, client_id } = credentials.installed;
    
    // Configura o cliente OAuth2
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000/oauth2callback");
    
    // Lê o token gerado anteriormente
    let tokenData;
    if (process.env.GOOGLE_TOKEN_JSON) {
      tokenData = JSON.parse(process.env.GOOGLE_TOKEN_JSON);
    } else {
      const token = fs.readFileSync('./token.json', 'utf8');
      tokenData = JSON.parse(token);
    }
    
    oAuth2Client.setCredentials(tokenData);
    
    return oAuth2Client;
  } catch (error) {
    console.error('Aviso: Arquivo credentials.json ou token.json (ou variáveis de ambiente) não encontrado. O upload para o Google Drive falhará ou rodará em modo mock.', error);
    return null; // Retorna null se não houver credenciais para facilitar os testes locais
  }
}

export async function getOrCreateSubfolder(folderName: string, parentFolderId: string): Promise<string> {
  const authClient = await getAuthClient();
  if (!authClient) return 'mock-folder-id';
  
  const drive = google.drive({ version: 'v3', auth: authClient as any });

  try {
    // 1. Busca se a pasta já existe
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!; // Retorna a pasta existente
    }

    // 2. Cria a pasta se não existir
    console.log(`Criando nova pasta "${folderName}" dentro da pasta mãe (${parentFolderId})...`);
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });

    return folder.data.id!;
  } catch (error) {
    console.error('Erro ao buscar ou criar pasta no Drive:', error);
    // Em caso de erro (ex: parent folder não existe ou erro de permissão), retorna root ou null
    return parentFolderId;
  }
}

export async function uploadToDrive(filePath: string, fileName: string, folderId: string): Promise<string | null> {
  const authClient = await getAuthClient();
  
  if (!authClient) {
    console.log(`[Modo Mock] Simulando upload de ${fileName} para a pasta ${folderId}`);
    return 'mock-file-id';
  }

  const drive = google.drive({ version: 'v3', auth: authClient as any });

  const fileMetadata = {
    name: fileName,
    parents: folderId === 'root' ? [] : [folderId],
  };

  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(filePath),
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log('Upload bem sucedido. File ID:', file.data.id);
    return file.data.id || null;
  } catch (error) {
    console.error('Erro ao fazer upload para o Drive:', error);
    throw error;
  }
}
