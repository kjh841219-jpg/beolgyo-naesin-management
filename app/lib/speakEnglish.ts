"use client";

let activeUtterance:SpeechSynthesisUtterance|null=null;
let keepAlive:number|undefined;
let activeAudio:HTMLAudioElement|null=null;

export function stopEnglishSpeech(){
 if(typeof window==="undefined")return;
 if(activeAudio){activeAudio.pause();activeAudio.removeAttribute("src");activeAudio.load();activeAudio=null}
 if(keepAlive)window.clearInterval(keepAlive);
 keepAlive=undefined;
 if("speechSynthesis" in window)window.speechSynthesis.cancel();
 activeUtterance=null;
}

function speakWithDeviceVoice(text:string){
 if(typeof window==="undefined"||!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined")return false;
 const synth=window.speechSynthesis;
 if(keepAlive)window.clearInterval(keepAlive);
 synth.cancel();
 synth.resume();
 const utterance=new SpeechSynthesisUtterance(text.replace(/\s+/g," ").trim());
 utterance.lang="en-US";
 utterance.rate=.82;
 utterance.pitch=1;
 utterance.volume=1;
 const voices=synth.getVoices();
 const voice=voices.find(v=>v.lang.toLowerCase()==="en-us")||voices.find(v=>v.lang.toLowerCase().startsWith("en"));
 if(voice)utterance.voice=voice;
 activeUtterance=utterance;
 const cleanup=()=>{if(keepAlive)window.clearInterval(keepAlive);keepAlive=undefined;activeUtterance=null};
 utterance.onend=cleanup;
 utterance.onerror=cleanup;
 synth.speak(utterance);
 // Mobile browsers sometimes pause long speech while the screen is active.
 keepAlive=window.setInterval(()=>{if(synth.paused)synth.resume();if(!synth.speaking&&!synth.pending)cleanup()},1200);
 return true;
}

export function speakEnglish(text:string){
 if(typeof window==="undefined")return false;
 stopEnglishSpeech();
 const audio=new Audio(`/api/tts?text=${encodeURIComponent(text.replace(/\s+/g," ").trim())}`);
 audio.preload="auto";
 audio.volume=1;
 activeAudio=audio;
 audio.onended=()=>{activeAudio=null};
 audio.onerror=()=>{activeAudio=null;speakWithDeviceVoice(text)};
 const play=audio.play();
 if(play)play.catch(()=>{activeAudio=null;speakWithDeviceVoice(text)});
 return true;
}
