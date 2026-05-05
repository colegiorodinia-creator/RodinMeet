const { google } = require('googleapis');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function createAndShareFolder() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log('Criando pasta no Drive da Service Account...');
    // 1. Create Folder
    const fileMetadata = {
      name: 'Gravações RodinMeet',
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    const folderId = folder.data.id;
    console.log('Folder ID criado:', folderId);

    console.log('Compartilhando pasta com colegiorodin.ia@gmail.com...');
    // 2. Share with user
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'colegiorodin.ia@gmail.com',
      },
      fields: 'id',
    });

    console.log('Pasta compartilhada com sucesso!');
    console.log('----------------------------------------------------');
    console.log('ID DA PASTA PARA O .ENV:', folderId);
  } catch (err) {
    console.error('Erro na operacao:', err.message);
  }
}

createAndShareFolder();
