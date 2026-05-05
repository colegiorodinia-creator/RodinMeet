const mammoth = require("mammoth");

mammoth.extractRawText({path: "c:\\Users\\MARKETING 03\\Documents\\Antigravity\\RodinMeet\\backend\\Varredura--de--Segurança.docx"})
    .then(function(result){
        console.log(result.value);
    })
    .catch(console.error);
