import React, { useState, useRef } from 'react';
// removido import useLocalParticipant

interface RecorderProps {
  meetingName: string;
  tag: string;
  hostName: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const RecorderButton: React.FC<RecorderProps> = ({ meetingName, tag, hostName }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000); // Esconde após 4 segundos
  };

  const startRecording = async () => {
    try {
      let displayStream: MediaStream;
      try {
        if (navigator.mediaDevices.getDisplayMedia) {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
        } else {
          throw new Error('getDisplayMedia not supported');
        }
      } catch (err) {
        console.warn('Gravação de tela falhou ou não suportada. Fazendo fallback para câmera.', err);
        showToast('📱 Gravando apenas sua câmera (Tela não suportada no mobile).');
        displayStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }

      // Solicita o microfone do usuário (se não for fallback, pois o fallback já pegou)
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (micErr) {
        console.warn('Microfone não acessível.', micErr);
      }

      // Mescla os áudios usando AudioContext, pois o MediaRecorder só pega a primeira track de áudio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      await audioCtx.resume(); // Força o contexto a iniciar
      const dest = audioCtx.createMediaStreamDestination();

      let hasAudio = false;

      if (displayStream.getAudioTracks().length > 0) {
        const displayAudioSource = audioCtx.createMediaStreamSource(new MediaStream([displayStream.getAudioTracks()[0]]));
        displayAudioSource.connect(dest);
        hasAudio = true;
      }

      if (micStream && micStream.getAudioTracks().length > 0) {
        const micAudioSource = audioCtx.createMediaStreamSource(micStream);
        micAudioSource.connect(dest);
        hasAudio = true;
      }

      if (!hasAudio) {
        showToast("⚠️ AVISO: Nenhum áudio detectado! Você precisa permitir o Microfone.");
      }

      const combinedStream = new MediaStream([
        displayStream.getVideoTracks()[0],
        ...dest.stream.getTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await uploadRecording(blob);
        // Para todas as tracks (tela e mic)
        displayStream.getTracks().forEach(track => track.stop());
        if (micStream) micStream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      // Detecta quando o usuário clica em "Parar de compartilhar" no menu nativo do Chrome
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      showToast('Não foi possível iniciar a gravação. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async (blob: Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    // Envia como .mp4 no nome, mas o backend/drive aceita webm e processa no frontend como mp4/webm
    formData.append('video', blob, `${meetingName}.webm`);
    formData.append('tag', tag);
    formData.append('meetingName', meetingName);
    formData.append('hostEmail', hostName);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        showToast('✅ Gravação enviada com sucesso para o Drive!');
      } else {
        showToast('❌ Falha ao enviar a gravação.');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      showToast('❌ Erro de conexão ao enviar a gravação.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="custom-toast">
          {toastMessage}
        </div>
      )}
      <div className="recorder-wrapper" style={{ position: 'absolute', top: 16, left: 16, zIndex: 9999 }}>
        {!isRecording ? (
          <button 
            className="lk-button"
            onClick={startRecording} 
            disabled={isUploading}
            title={isUploading ? 'Enviando...' : 'Gravar'}
            style={{ 
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1
            }}
          >
            {isUploading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                <span style={{ marginLeft: '6px' }}>Gravar</span>
              </>
            )}
          </button>
        ) : (
          <button 
            className="lk-button"
            onClick={stopRecording}
            title="Parar"
            style={{ 
              background: 'rgba(255, 69, 58, 0.2)', 
              color: '#ff453a', 
              border: '1px solid #ff453a',
              animation: 'recordingPulse 2s infinite ease-in-out'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span style={{ marginLeft: '6px' }}>Parar</span>
          </button>
        )}
      </div>
    </>
  );
};
