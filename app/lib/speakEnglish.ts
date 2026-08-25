"use client";

let activeUtterance:SpeechSynthesisUtterance|null=null;
let keepAlive:number|undefined;

export function stopEnglishSpeech(){
 if(typeof window==="undefined"||!("speechSynthesis" in window))return;
 if(keepAlive)window.clearInterval(keepAlive);
 keepAlive=undefined;
 window.speechSynthesis.cancel();
 activeUtterance=null;
}

export function speakEnglish(text:string){
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
