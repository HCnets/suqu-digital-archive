import { useState, useEffect, useCallback } from 'react';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      setIsPlaying(false);
    }
  }, [synth]);

  const speak = useCallback((text: string) => {
    if (!synth) return;

    // 先停止正在播放的语音
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 尝试寻找中文女声（听起来比较像专业解说）
    const voices = synth.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') && v.name.includes('Xiaoxiao')) || 
                    voices.find(v => v.lang.includes('zh'));
    
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    
    utterance.rate = 0.9; // 稍微放慢语速，增加历史庄重感
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synth.speak(utterance);
  }, [synth]);

  return { speak, stop, isPlaying };
};
