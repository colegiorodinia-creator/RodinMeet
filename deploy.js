const fs = require('fs');
const { execSync } = require('child_process');

try {
  const content = fs.readFileSync('apps.json', 'utf16le').replace(/^\uFEFF/, '');
  const apps = JSON.parse(content);
  const myApp = apps.find(a => a.git_repository && a.git_repository.includes('RodinMeet'));
  
  if (myApp) {
    console.log('Found App UUID:', myApp.uuid);
    const cmd = `curl.exe -s -X POST -H "Authorization: Bearer 1|hhQrLiE0VdiJdfQG0nOVNlZiYnGLDAHT8xmMgHnd72b0b7e6" "http://2.24.76.4:8000/api/v1/deploy?uuid=${myApp.uuid}&force=true"`;
    const result = execSync(cmd).toString();
    console.log('Deploy response:', result);
  } else {
    console.log('App not found in Coolify.');
  }
} catch (err) {
  console.error('Error:', err.message);
}
