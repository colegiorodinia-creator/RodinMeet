import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import express from 'express';
import { exec } from 'child_process';

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function authorize() {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  const credentials = JSON.parse(content);
  
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  // Usar exatamente http://localhost:3000 (sem caminhos adicionais) para evitar erro 400
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000");

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Abrindo o navegador automaticamente para autorização...');
  exec(`start "" "${authUrl}"`);

  const app = express();
  let server: any;

  app.get('/', async (req, res) => {
    const code = req.query.code as string;
    if (code) {
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        res.send('<h1>✅ Autenticação concluída!</h1><p>Pode fechar esta janela e voltar ao terminal.</p>');
        console.log('\n✅ Sucesso! Arquivo token.json criado. O Google Drive está autenticado.');
        server.close();
        process.exit(0);
      } catch (err) {
        console.error('Erro ao gerar o token:', err);
        res.send('Erro ao autenticar. Verifique o terminal.');
      }
    } else {
      res.send('Nenhum código encontrado.');
    }
  });

  server = app.listen(3000, () => {
    console.log('Aguardando retorno da autorização na porta 3000...');
  });
}

authorize();
