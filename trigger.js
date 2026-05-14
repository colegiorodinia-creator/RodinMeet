const { execSync } = require('child_process');
try {
  const cmd = `curl.exe -s -X POST -H "Authorization: Bearer 1|hhQrLiE0VdiJdfQG0nOVNlZiYnGLDAHT8xmMgHnd72b0b7e6" "http://2.24.76.4:8000/api/v1/deploy?uuid=ozl4lgs5ixicxs3w8i35c9t7&force=true"`;
  console.log(execSync(cmd).toString());
} catch(e) {
  console.error(e.message);
}
