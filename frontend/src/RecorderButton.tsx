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
      // Solicita a tela e o áudio do sistema (aba/outros participantes)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Solicita o microfone do usuário
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (micErr) {
        console.warn('Microfone não acessível, gravando apenas o áudio do sistema.', micErr);
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
      {isRecording && <div className="recording-border"></div>}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 9999 }}>
        <div className="liquid-glass" style={{ display: 'flex', alignItems: 'center', padding: '8px 8px', borderRadius: '999px', gap: '8px' }}>
          {!isRecording ? (
            <button 
              className="primary" 
              onClick={startRecording} 
              disabled={isUploading}
              style={{ margin: 0, padding: '10px 20px', fontSize: '14px' }}
            >
              {isUploading ? 'Enviando...' : 'Gravar'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger-color)', animation: 'recordingPulse 1s infinite' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Gravando</span>
              </div>
              <button 
                className="danger" 
                onClick={stopRecording}
                style={{ margin: 0, padding: '8px 16px', fontSize: '14px' }}
              >
                Parar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
