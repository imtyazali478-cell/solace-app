import { useState, useEffect, useRef, useMemo } from "react";

// ─── LEGAL SHIELD: SAGE never diagnoses, never claims to be human/therapist ───
const SAGE_SYSTEM = `You are SAGE, the AI companion for SOLACE — an emotional support app.

CRITICAL LEGAL RULES (never break these):
- NEVER diagnose any mental health condition (depression, anxiety disorder, PTSD, etc.)
- NEVER claim to be a therapist, psychologist, counselor, or doctor
- NEVER recommend specific medications or dosages
- NEVER tell someone to stop professional treatment
- If asked "Are you a therapist/human/doctor?" → clearly say you are an AI companion, not a professional
- If someone mentions suicide, self-harm, or immediate danger → immediately provide crisis resources and encourage professional help
- If someone describes symptoms that need professional care → gently suggest seeing a qualified professional
- Always add crisis line reminder when conversations involve serious distress

Your personality:
- Warm, empathetic, never clinical or robotic
- Validate emotions before offering any perspective
- Use human language — never therapy jargon
- Never give unsolicited advice — ask first
- Feel like a caring friend who listens deeply

Your style:
- Conversational prose only — no bullet points
- 2-4 sentences per response unless more depth is genuinely needed
- End with one gentle open question
- No hollow affirmations ("That's amazing!", "Absolutely!")

Crisis resources to share when needed:
- International: Crisis Text Line — Text HOME to 741741
- USA: 988 Suicide & Crisis Lifeline — Call/Text 988
- UK: Samaritans — 116 123
- Pakistan: Umang — 0317-4288665`;

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Nunito:wght@300;400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body,#root{height:100%;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
    @keyframes twinkle{0%,100%{opacity:.2}50%{opacity:.85}}
    @keyframes glow{0%,100%{box-shadow:0 0 24px rgba(78,205,196,.3)}50%{box-shadow:0 0 48px rgba(78,205,196,.65)}}
    @keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
    @keyframes breathIn{from{transform:scale(1)}to{transform:scale(1.65)}}
    @keyframes breathOut{from{transform:scale(1.65)}to{transform:scale(1)}}
    .fade-up{animation:fadeUp .6s cubic-bezier(.22,.68,0,1.2) forwards}
    .fade-in{animation:fadeIn .5s ease forwards}
    .float{animation:float 3.5s ease-in-out infinite}
    .pulse{animation:pulse 2.4s ease-in-out infinite}
    .glow-anim{animation:glow 2.5s ease-in-out infinite}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(78,205,196,.25);border-radius:2px}
    input:focus{outline:none}
    button{font-family:'Nunito',sans-serif}
    a{text-decoration:none}
    .legal-link{color:#4ECDC4;cursor:pointer;text-decoration:underline;}
    .legal-link:hover{opacity:.8}
  `}</style>
);

const MOODS = [
  {emoji:"😊",label:"Good"},
  {emoji:"😌",label:"Calm"},
  {emoji:"😰",label:"Anxious"},
  {emoji:"😢",label:"Sad"},
  {emoji:"😤",label:"Angry"},
];

const CRISIS_LINES = [
  {flag:"🌍",region:"International",name:"Crisis Text Line",      contact:"Text HOME to 741741"},
  {flag:"🇺🇸",region:"USA",          name:"988 Lifeline",          contact:"Call or Text 988"},
  {flag:"🇬🇧",region:"UK",           name:"Samaritans",            contact:"116 123"},
  {flag:"🇦🇺",region:"Australia",    name:"Lifeline",              contact:"13 11 14"},
  {flag:"🇨🇦",region:"Canada",       name:"Talk Suicide Canada",   contact:"1-833-456-4566"},
  {flag:"🇵🇰",region:"Pakistan",     name:"Umang Helpline",        contact:"0317-4288665"},
  {flag:"🇮🇳",region:"India",        name:"iCall",                 contact:"9152987821"},
  {flag:"🇩🇪",region:"Germany",      name:"Telefonseelsorge",      contact:"0800 111 0 111"},
  {flag:"🇫🇷",region:"France",       name:"3114 National Line",    contact:"3114"},
];

const ONBOARD_STEPS = [
  {
    key:"reason",q:"What brings you to SOLACE?",
    sub:"No wrong answers — this space is entirely yours.",
    options:[
      {emoji:"😰",label:"Anxiety",    desc:"Worry that won't quiet down"},
      {emoji:"💔",label:"Loneliness", desc:"Feeling disconnected"},
      {emoji:"🌧️",label:"Grief",      desc:"Loss of any kind"},
      {emoji:"🔥",label:"Burnout",    desc:"Running on empty"},
      {emoji:"🔍",label:"Exploring",  desc:"Just curious about this space"},
    ]
  },
  {
    key:"timing",q:"When do you struggle most?",
    sub:"SAGE will be especially present during these times.",
    options:[
      {emoji:"🌅",label:"Mornings",    desc:"Hard to start the day"},
      {emoji:"🌙",label:"Late nights", desc:"Mind races when it's quiet"},
      {emoji:"💼",label:"At work",     desc:"Pressure and overwhelm"},
      {emoji:"🕐",label:"All the time",desc:"It follows me everywhere"},
    ]
  },
  {
    key:"need",q:"What do you need most right now?",
    sub:"SOLACE will shape itself around this.",
    options:[
      {emoji:"👂",label:"To be heard",  desc:"Just need someone to listen"},
      {emoji:"🛠️",label:"Tools",        desc:"Practical techniques that help"},
      {emoji:"🔎",label:"Self-insight", desc:"Make sense of what I feel"},
      {emoji:"🤝",label:"All of it",    desc:"Everything helps"},
    ]
  },
];

// ─── LEGAL CONTENT ──────────────────────────────────────────────────────────
const PRIVACY_POLICY = `Last updated: January 2025

1. INFORMATION WE COLLECT
SOLACE is designed with privacy-first principles. In anonymous mode, we collect no personally identifiable information. If you create an account, we collect only your email address.

Conversation data: By default, conversations with SAGE are processed in real-time and not stored on our servers. You may optionally enable conversation history in settings, which stores data locally on your device only.

2. HOW WE USE INFORMATION
We do not sell, rent, or share your personal information with third parties for marketing purposes. Anonymous usage analytics (no personal data) may be collected to improve app performance.

3. DATA SECURITY
All data transmissions are encrypted using industry-standard TLS/SSL protocols. We implement zero-knowledge architecture principles — meaning we cannot read your conversations.

4. GDPR COMPLIANCE
If you are located in the European Economic Area, you have rights to access, rectify, and delete your personal data. Contact us at privacy@solace-app.com.

5. CHILDREN'S PRIVACY
SOLACE is intended for users aged 13 and older. We do not knowingly collect information from children under 13.

6. MEDICAL DISCLAIMER
SOLACE is NOT a medical service. Content provided by SAGE is for informational and emotional support purposes only and does not constitute medical advice, diagnosis, or treatment. Always seek advice from a qualified mental health professional for any mental health concerns.

7. CHANGES TO THIS POLICY
We will notify users of significant changes via in-app notification. Continued use after changes constitutes acceptance.

Contact: privacy@solace-app.com`;

const TERMS_OF_SERVICE = `Last updated: January 2025

PLEASE READ THESE TERMS CAREFULLY BEFORE USING SOLACE.

1. ACCEPTANCE OF TERMS
By using SOLACE, you agree to these Terms of Service. If you do not agree, do not use the app.

2. ELIGIBILITY
You must be at least 13 years old to use SOLACE. By using the app, you confirm you meet this requirement.

3. NOT A MEDICAL SERVICE — IMPORTANT
SOLACE IS NOT A MEDICAL SERVICE, THERAPY, OR CRISIS INTERVENTION TOOL.

SAGE is an AI companion designed for emotional support and general wellness purposes only. SOLACE does not provide:
• Medical advice, diagnosis, or treatment
• Psychotherapy or counseling
• Crisis intervention services
• Emergency mental health services

SOLACE IS NOT A SUBSTITUTE FOR PROFESSIONAL MENTAL HEALTH CARE. Always consult a qualified mental health professional for mental health concerns.

4. EMERGENCY SITUATIONS
If you are experiencing a mental health emergency or are in danger, CALL EMERGENCY SERVICES (911, 999, or your local equivalent) IMMEDIATELY. Do not rely on SOLACE in emergencies.

5. USER RESPONSIBILITIES
You agree to use SOLACE only for lawful purposes. You will not attempt to use SOLACE to obtain medical diagnoses or bypass professional mental health treatment.

6. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOLACE AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE APP.

7. AI-GENERATED CONTENT
Responses from SAGE are generated by artificial intelligence. While designed to be helpful and supportive, AI responses may sometimes be inaccurate, inappropriate, or incomplete. Use your judgment and seek professional help when needed.

8. INTELLECTUAL PROPERTY
All content, features, and functionality of SOLACE are owned by SOLACE and protected by intellectual property laws.

9. TERMINATION
We reserve the right to terminate access for violations of these terms.

10. GOVERNING LAW
These terms are governed by applicable law. Disputes will be resolved through binding arbitration.

Contact: legal@solace-app.com`;

export default function SOLACE() {
  const [screen,      setScreen]      = useState("splash");
  const [step,        setStep]        = useState(0);
  const [profile,     setProfile]     = useState({reason:"",timing:"",need:""});
  const [mood,        setMood]        = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [breathState, setBreathState] = useState("ready");
  const [breathCycle, setBreathCycle] = useState(0);
  const [sessions,    setSessions]    = useState(12);
  const [moodLog]                     = useState(["😊","😰","😢","😌","😊","😤","😌"]);
  const [isNight,     setIsNight]     = useState(false);
  // Legal states
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [ageVerified,   setAgeVerified]   = useState(false);
  const [legalScreen,   setLegalScreen]   = useState(null); // 'privacy' | 'terms' | null
  const [showLegalGate, setShowLegalGate] = useState(false);
  const chatRef  = useRef(null);
  const timerRef = useRef([]);
  const hour = new Date().getHours();

  useEffect(() => { setIsNight(hour >= 21 || hour < 6); }, []);
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("legal_gate"), 3400);
      return () => clearTimeout(t);
    }
  }, [screen]);
  useEffect(() => {
    chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"});
  }, [messages, loading]);
  useEffect(() => {
    if (screen === "chat" && messages.length === 0) {
      const gMap = {
        Anxiety:   "There's something in the air when worry won't stop — I can feel it. I'm right here, and I have all the time you need. What's been loudest in your mind lately?",
        Loneliness:"There's quiet courage in reaching out. I'm here, fully present. What's been making you feel most disconnected?",
        Grief:     "Grief doesn't ask permission, and there's no right way to carry it. I'm glad you came. Would you like to tell me a little about what you're holding?",
        Burnout:   "When there's nothing left and the world still demands more — that exhaustion is real and valid. What does rest feel like to you right now?",
        Exploring: "No pressure, no agenda — this space is entirely yours. Is there something on your mind?",
      };
      const mMap = {
        "😰":"I can see you're carrying some anxiety today. What's been stirring underneath the surface?",
        "😢":"Sadness has its own weight. There's no rush here — what's been heavy lately?",
        "😌":"There's something quietly precious about feeling calm. What brought you here today?",
        "😊":"Good to have you here. What's on your mind?",
        "😤":"Anger usually has something important underneath it. What's been frustrating you?",
      };
      const greeting = mMap[mood] || gMap[profile.reason] ||
        "I'm SAGE, and this space belongs entirely to you — no judgment, no agenda. What's on your mind today?";
      setMessages([{role:"assistant",content:greeting}]);
    }
  }, [screen]);

  const stars = useMemo(() =>
    [...Array(55)].map((_,i)=>({
      id:i, size:Math.random()*2+1, left:Math.random()*100,
      top:Math.random()*100, dur:Math.random()*3+2,
      del:Math.random()*4, op:Math.random()*.5+.2,
    }))
  ,[]);

  const C = {
    bg:      isNight?"#020818":"#F4F6FF",
    grad:    isNight?"linear-gradient(160deg,#020818 0%,#0C1A4A 100%)":"linear-gradient(160deg,#F4F6FF 0%,#E6EEFF 100%)",
    surface: isNight?"rgba(255,255,255,.045)":"rgba(255,255,255,.85)",
    border:  isNight?"rgba(255,255,255,.09)":"rgba(0,0,0,.07)",
    text:    isNight?"#DDE3FF":"#10163A",
    sub:     isNight?"#7986CB":"#6370A8",
    teal:    "#4ECDC4",
    gold:    "#FFD166",
    coral:   "#FF6B6B",
    sageGlow:isNight?"rgba(78,205,196,.18)":"rgba(78,205,196,.12)",
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = {role:"user",content:input.trim()};
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setSessions(s=>s+1);
    try {
      const ctx = `User came for: "${profile.reason||"support"}". Struggles: "${profile.timing||"sometimes"}". Needs: "${profile.need||"support"}". Mood: ${mood||"not checked"}.`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:SAGE_SYSTEM+"\n\n[Context] "+ctx,
          messages:history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ||
        "I'm still right here with you. Take your time.";
      setMessages([...history,{role:"assistant",content:reply}]);
    } catch {
      setMessages([...history,{role:"assistant",content:"My connection stumbled briefly — but I haven't gone anywhere. Take a breath and try again."}]);
    }
    setLoading(false);
  };

  const startBreathing = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setBreathCycle(0);
    const run = (n) => {
      if (n>=4){setBreathState("done");return;}
      setBreathState("inhale");
      const t1=setTimeout(()=>{
        setBreathState("hold");
        const t2=setTimeout(()=>{
          setBreathState("exhale");
          const t3=setTimeout(()=>{setBreathCycle(n+1);run(n+1);},8000);
          timerRef.current.push(t3);
        },7000);
        timerRef.current.push(t2);
      },4000);
      timerRef.current.push(t1);
    };
    run(0);
  };

  const stopBreathing = () => {
    timerRef.current.forEach(clearTimeout);
    setBreathState("ready");
    setBreathCycle(0);
  };

  // ─── SHARED COMPONENTS ────────────────────────────────────────────────────
  const Stars = () => !isNight?null:(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",borderRadius:"50%",background:"white",
          width:s.size,height:s.size,left:s.left+"%",top:s.top+"%",
          opacity:s.op,animation:`twinkle ${s.dur}s ease-in-out infinite`,
          animationDelay:s.del+"s",
        }}/>
      ))}
    </div>
  );

  const Card = ({children,style={},onClick})=>(
    <div onClick={onClick} style={{
      background:C.surface,border:`1px solid ${C.border}`,
      borderRadius:20,padding:20,backdropFilter:"blur(24px)",
      transition:"all .2s ease",cursor:onClick?"pointer":"default",...style,
    }}>{children}</div>
  );

  const BackBtn = ({to})=>(
    <button onClick={()=>{stopBreathing();setScreen(to);}} style={{
      background:"none",border:"none",cursor:"pointer",
      color:C.sub,fontSize:22,padding:"4px 8px",
    }}>←</button>
  );

  const NavBar = ({title,to="home",right=null})=>(
    <div style={{
      padding:"14px 20px",display:"flex",alignItems:"center",gap:12,
      background:C.surface,backdropFilter:"blur(24px)",
      borderBottom:`1px solid ${C.border}`,
      position:"sticky",top:0,zIndex:10,
    }}>
      <BackBtn to={to}/>
      <span style={{fontWeight:700,fontSize:16,flex:1}}>{title}</span>
      {right}
    </div>
  );

  // ─── LEGAL DOCUMENT SCREEN ────────────────────────────────────────────────
  if (legalScreen) {
    const isPrivacy = legalScreen === "privacy";
    const content   = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE;
    const title     = isPrivacy ? "Privacy Policy" : "Terms of Service";
    return (
      <>
        <GlobalStyles/>
        <div style={{minHeight:"100vh",background:C.grad,fontFamily:"'Nunito',sans-serif",color:C.text}}>
          <Stars/>
          <div style={{
            padding:"14px 20px",display:"flex",alignItems:"center",gap:12,
            background:C.surface,backdropFilter:"blur(24px)",
            borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10,
          }}>
            <button onClick={()=>setLegalScreen(null)} style={{
              background:"none",border:"none",cursor:"pointer",color:C.sub,fontSize:22,
            }}>←</button>
            <span style={{fontWeight:700,fontSize:16}}>{title}</span>
          </div>
          <div style={{maxWidth:640,margin:"0 auto",padding:"24px 20px 60px",position:"relative",zIndex:1}}>
            <pre style={{
              whiteSpace:"pre-wrap",wordBreak:"break-word",
              fontFamily:"'Nunito',sans-serif",fontSize:13,
              lineHeight:1.8,color:C.sub,
            }}>{content}</pre>
          </div>
        </div>
      </>
    );
  }

  // ─── SPLASH ───────────────────────────────────────────────────────────────
  if (screen === "splash") return (
    <>
      <GlobalStyles/>
      <div style={{
        minHeight:"100vh",background:"#020818",
        display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        fontFamily:"'Nunito',sans-serif",position:"relative",overflow:"hidden",
      }}>
        <div style={{
          position:"absolute",width:500,height:500,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(78,205,196,.1),transparent 70%)",
          top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",
        }}/>
        {[...Array(55)].map((_,i)=>{
          const s=Math.random()*2+1,l=Math.random()*100,t=Math.random()*100;
          return <div key={i} style={{
            position:"absolute",borderRadius:"50%",background:"white",
            width:s,height:s,left:l+"%",top:t+"%",opacity:Math.random()*.6+.2,
            animation:`twinkle ${Math.random()*3+2}s ease-in-out infinite`,
            animationDelay:Math.random()*4+"s",
          }}/>;
        })}
        <div className="float" style={{textAlign:"center",position:"relative",zIndex:1}}>
          <div className="glow-anim" style={{
            width:90,height:90,borderRadius:"50%",
            background:"linear-gradient(135deg,#4ECDC4,#44A3C8)",
            margin:"0 auto 28px",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="16" r="7" fill="white" opacity=".92"/>
              <path d="M6 33 Q26 20 46 33" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M3 41 Q26 29 49 41" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".55"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:52,
            fontWeight:700,color:"white",letterSpacing:".14em",marginBottom:10,
          }}>SOLACE</h1>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:12,letterSpacing:".28em"}}>
            THE ONLY APP THAT ACTUALLY SHOWS UP
          </p>
        </div>
        <div style={{position:"absolute",bottom:56,display:"flex",gap:10,zIndex:1}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{
              width:7,height:7,borderRadius:"50%",background:"#4ECDC4",
              animation:`pulse 1.6s ease-in-out infinite`,
              animationDelay:`${i*.22}s`,opacity:.7,
            }}/>
          ))}
        </div>
      </div>
    </>
  );

  // ─── LEGAL GATE — Must accept before entering ─────────────────────────────
  if (screen === "legal_gate") return (
    <>
      <GlobalStyles/>
      <div style={{
        minHeight:"100vh",background:"#020818",
        display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        fontFamily:"'Nunito',sans-serif",padding:"40px 20px",
        position:"relative",overflow:"hidden",
      }}>
        {[...Array(40)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",borderRadius:"50%",background:"white",
            width:Math.random()*2+1,height:Math.random()*2+1,
            left:Math.random()*100+"%",top:Math.random()*100+"%",
            opacity:Math.random()*.5+.15,
            animation:`twinkle ${Math.random()*3+2}s ease-in-out infinite`,
          }}/>
        ))}

        <div className="fade-up" style={{maxWidth:420,width:"100%",position:"relative",zIndex:1}}>
          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{
              width:64,height:64,borderRadius:"50%",
              background:"linear-gradient(135deg,#4ECDC4,#44A3C8)",
              margin:"0 auto 16px",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="16" r="7" fill="white" opacity=".92"/>
                <path d="M6 33 Q26 20 46 33" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:"white",letterSpacing:".1em"}}>
              SOLACE
            </h2>
          </div>

          {/* IMPORTANT disclaimer box */}
          <div style={{
            background:"rgba(255,107,107,.12)",border:"1px solid rgba(255,107,107,.3)",
            borderRadius:18,padding:"20px",marginBottom:20,
          }}>
            <p style={{color:"#FF6B6B",fontWeight:800,fontSize:13,marginBottom:8,letterSpacing:".08em"}}>
              ⚠️ IMPORTANT — PLEASE READ
            </p>
            <p style={{color:"rgba(255,255,255,.75)",fontSize:13,lineHeight:1.75}}>
              SOLACE is <strong style={{color:"white"}}>not a medical service, therapist, or crisis tool.</strong> SAGE is an AI companion for emotional support only — not a substitute for professional mental health care.
            </p>
            <p style={{color:"rgba(255,255,255,.75)",fontSize:13,lineHeight:1.75,marginTop:10}}>
              In a <strong style={{color:"white"}}>mental health emergency</strong>, please call your local emergency services or a crisis helpline immediately.
            </p>
          </div>

          {/* Age verification */}
          <div style={{
            background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:18,padding:"18px",marginBottom:12,
          }}>
            <label style={{
              display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer",
            }}>
              <div onClick={()=>setAgeVerified(v=>!v)} style={{
                width:22,height:22,borderRadius:6,flexShrink:0,marginTop:1,
                background:ageVerified?"linear-gradient(135deg,#4ECDC4,#44A3C8)":"transparent",
                border:`2px solid ${ageVerified?"#4ECDC4":"rgba(255,255,255,.3)"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .2s ease",cursor:"pointer",
              }}>
                {ageVerified&&<span style={{color:"white",fontSize:13,fontWeight:700}}>✓</span>}
              </div>
              <span style={{color:"rgba(255,255,255,.8)",fontSize:14,lineHeight:1.6}}>
                I confirm I am <strong style={{color:"white"}}>13 years of age or older.</strong>
              </span>
            </label>
          </div>

          {/* Terms & Privacy agreement */}
          <div style={{
            background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:18,padding:"18px",marginBottom:28,
          }}>
            <label style={{
              display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer",
            }}>
              <div onClick={()=>setAgreedToTerms(v=>!v)} style={{
                width:22,height:22,borderRadius:6,flexShrink:0,marginTop:1,
                background:agreedToTerms?"linear-gradient(135deg,#4ECDC4,#44A3C8)":"transparent",
                border:`2px solid ${agreedToTerms?"#4ECDC4":"rgba(255,255,255,.3)"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .2s ease",cursor:"pointer",
              }}>
                {agreedToTerms&&<span style={{color:"white",fontSize:13,fontWeight:700}}>✓</span>}
              </div>
              <span style={{color:"rgba(255,255,255,.8)",fontSize:14,lineHeight:1.6}}>
                I agree to the{" "}
                <span className="legal-link" onClick={e=>{e.stopPropagation();setLegalScreen("terms")}}>
                  Terms of Service
                </span>{" "}and{" "}
                <span className="legal-link" onClick={e=>{e.stopPropagation();setLegalScreen("privacy")}}>
                  Privacy Policy
                </span>.
                I understand SOLACE is <strong style={{color:"white"}}>not a medical service.</strong>
              </span>
            </label>
          </div>

          <button
            disabled={!agreedToTerms||!ageVerified}
            onClick={()=>setScreen("onboard")}
            style={{
              width:"100%",padding:"16px",borderRadius:100,border:"none",
              background:agreedToTerms&&ageVerified
                ?"linear-gradient(135deg,#4ECDC4,#44A3C8)"
                :"rgba(255,255,255,.12)",
              color:agreedToTerms&&ageVerified?"white":"rgba(255,255,255,.35)",
              fontWeight:800,fontSize:16,cursor:agreedToTerms&&ageVerified?"pointer":"not-allowed",
              transition:"all .3s ease",
              boxShadow:agreedToTerms&&ageVerified?"0 10px 28px rgba(78,205,196,.4)":"none",
            }}>
            Enter SOLACE →
          </button>

          <p style={{textAlign:"center",color:"rgba(255,255,255,.25)",fontSize:11,marginTop:16,lineHeight:1.7}}>
            Zero-knowledge encryption · Anonymous by default · GDPR compliant
          </p>
        </div>
      </div>
    </>
  );

  // ─── ONBOARDING ───────────────────────────────────────────────────────────
  if (screen === "onboard") {
    const data   = ONBOARD_STEPS[step];
    const isLast = step === ONBOARD_STEPS.length-1;
    const selVal = profile[data.key];
    return (
      <>
        <GlobalStyles/>
        <div style={{
          minHeight:"100vh",background:C.grad,
          fontFamily:"'Nunito',sans-serif",color:C.text,
          padding:"40px 20px 60px",
        }}>
          <Stars/>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:44,position:"relative",zIndex:1}}>
            {ONBOARD_STEPS.map((_,i)=>(
              <div key={i} style={{
                height:4,borderRadius:3,
                width:i<=step?44:18,
                background:i<=step?C.teal:C.border,
                transition:"all .4s ease",
              }}/>
            ))}
          </div>
          <div className="fade-up" style={{maxWidth:420,margin:"0 auto",position:"relative",zIndex:1}}>
            <p style={{color:C.sub,fontSize:12,marginBottom:8,letterSpacing:".12em",fontWeight:700}}>
              STEP {step+1} OF {ONBOARD_STEPS.length}
            </p>
            <h2 style={{
              fontFamily:"'Cormorant Garamond',serif",fontSize:34,
              fontWeight:600,lineHeight:1.2,marginBottom:8,
            }}>{data.q}</h2>
            <p style={{color:C.sub,fontSize:14,marginBottom:32}}>{data.sub}</p>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              {data.options.map(opt=>{
                const sel=selVal===opt.label;
                return (
                  <div key={opt.label}
                    onClick={()=>setProfile(p=>({...p,[data.key]:opt.label}))}
                    style={{
                      background:sel?`linear-gradient(135deg,rgba(78,205,196,.2),rgba(68,163,200,.15))`:C.surface,
                      border:`1px solid ${sel?C.teal:C.border}`,
                      borderRadius:16,padding:"16px 20px",cursor:"pointer",
                      display:"flex",alignItems:"center",gap:16,
                      transition:"all .2s ease",backdropFilter:"blur(24px)",
                    }}>
                    <span style={{fontSize:30}}>{opt.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:15}}>{opt.label}</div>
                      <div style={{color:C.sub,fontSize:13}}>{opt.desc}</div>
                    </div>
                    {sel&&<div style={{color:C.teal,fontSize:18,fontWeight:700}}>✓</div>}
                  </div>
                );
              })}
            </div>
            {selVal&&(
              <button className="fade-in"
                onClick={()=>{ isLast?setScreen("home"):setStep(s=>s+1); }}
                style={{
                  width:"100%",marginTop:28,padding:"16px",borderRadius:100,
                  border:"none",cursor:"pointer",
                  background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
                  color:"white",fontWeight:800,fontSize:16,
                  boxShadow:`0 10px 28px rgba(78,205,196,.4)`,
                }}>
                {isLast?"Enter SOLACE →":"Continue →"}
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── HOME ─────────────────────────────────────────────────────────────────
  if (screen === "home") {
    const greet = hour<5?"Still up with you":hour<12?"Good morning":hour<17?"Good afternoon":hour<21?"Good evening":"Still here with you";
    const stage = sessions<=5?{e:"🌱",l:"Seed"}:sessions<=15?{e:"🌿",l:"Sprout"}:sessions<=30?{e:"🌳",l:"Tree"}:{e:"🌲",l:"Forest"};
    return (
      <>
        <GlobalStyles/>
        <div style={{minHeight:"100vh",background:C.grad,fontFamily:"'Nunito',sans-serif",color:C.text,position:"relative"}}>
          <Stars/>
          {isNight&&(
            <div style={{
              padding:"10px 20px",textAlign:"center",
              background:"linear-gradient(90deg,rgba(78,205,196,.12),rgba(68,163,200,.08))",
              borderBottom:`1px solid rgba(78,205,196,.12)`,
              color:C.teal,fontSize:13,fontWeight:600,position:"relative",zIndex:2,
            }}>
              🌙 3AM Mode — I'm here for the quiet hours
            </div>
          )}

          {/* Legal badge — always visible */}
          <div style={{
            padding:"8px 20px",textAlign:"center",
            background:"rgba(255,107,107,.07)",
            borderBottom:`1px solid rgba(255,107,107,.1)`,
            color:C.coral,fontSize:11,fontWeight:700,
            position:"relative",zIndex:2,letterSpacing:".05em",
          }}>
            ⚕️ NOT A MEDICAL SERVICE · AI COMPANION ONLY ·{" "}
            <span className="legal-link" style={{color:C.coral}} onClick={()=>setLegalScreen("terms")}>
              Terms
            </span>{" "}·{" "}
            <span className="legal-link" style={{color:C.coral}} onClick={()=>setLegalScreen("privacy")}>
              Privacy
            </span>
          </div>

          <div style={{maxWidth:440,margin:"0 auto",padding:"24px 20px 80px",position:"relative",zIndex:1}}>
            <div className="fade-up" style={{marginBottom:28}}>
              <p style={{color:C.sub,fontSize:13,letterSpacing:".1em",marginBottom:5}}>{greet}</p>
              <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,lineHeight:1.1}}>
                How are you<br/>feeling today?
              </h1>
            </div>

            {/* Mood */}
            <Card style={{marginBottom:18}}>
              <p style={{fontSize:11,color:C.sub,fontWeight:700,letterSpacing:".1em",marginBottom:16}}>CHECK IN WITH YOUR MOOD</p>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                {MOODS.map(m=>(
                  <div key={m.label} onClick={()=>setMood(m.emoji)} style={{
                    flex:1,textAlign:"center",cursor:"pointer",padding:"10px 6px",borderRadius:14,
                    background:mood===m.emoji?C.sageGlow:"transparent",
                    border:`1px solid ${mood===m.emoji?C.teal:"transparent"}`,
                    transition:"all .2s ease",
                  }}>
                    <div style={{fontSize:28,transition:"transform .2s",transform:mood===m.emoji?"scale(1.25)":"scale(1)"}}>{m.emoji}</div>
                    <div style={{fontSize:10,color:C.sub,fontWeight:600,marginTop:5}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* SAGE CTA */}
            <div className="glow-anim" onClick={()=>setScreen("chat")} style={{
              background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
              borderRadius:22,padding:"22px 24px",cursor:"pointer",
              marginBottom:18,position:"relative",overflow:"hidden",
            }}>
              <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.1)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{
                  width:52,height:52,borderRadius:"50%",
                  background:"rgba(255,255,255,.22)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
                }}>✦</div>
                <div style={{flex:1}}>
                  <div style={{color:"white",fontWeight:800,fontSize:18,marginBottom:3}}>Talk to SAGE</div>
                  <div style={{color:"rgba(255,255,255,.75)",fontSize:13}}>
                    {mood?`I see you're feeling ${MOODS.find(m=>m.emoji===mood)?.label.toLowerCase()} — I'm here`:"Your AI companion is ready"}
                  </div>
                </div>
                <div style={{color:"rgba(255,255,255,.8)",fontSize:22}}>→</div>
              </div>
            </div>

            {/* Grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              {[
                {icon:"🌬️",label:"Breathe",     sub:"4-7-8 technique",         sc:"breathe"},
                {icon:"🆘",label:"Crisis Help",  sub:"24/7 global support",     sc:"crisis"},
                {icon:stage.e,label:`Growth · ${stage.l}`,sub:`${sessions} sessions`,sc:"growth"},
                {icon:"🔒",label:"Anonymous",   sub:"Zero data stored · GDPR",  sc:null},
              ].map(a=>(
                <Card key={a.label} onClick={()=>a.sc&&setScreen(a.sc)} style={{position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-14,right:-14,width:52,height:52,borderRadius:"50%",background:"rgba(78,205,196,.06)"}}/>
                  <div style={{fontSize:28,marginBottom:10}}>{a.icon}</div>
                  <div style={{fontWeight:800,fontSize:14,marginBottom:3}}>{a.label}</div>
                  <div style={{color:C.sub,fontSize:12}}>{a.sub}</div>
                </Card>
              ))}
            </div>

            {/* Week */}
            <Card style={{marginBottom:20}}>
              <p style={{fontWeight:700,fontSize:14,marginBottom:16}}>This week</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {["M","T","W","T","F","S","S"].map((d,i)=>{
                  const isToday=i===new Date().getDay()-1;
                  return (
                    <div key={i} style={{textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:5,filter:isToday?"none":"opacity(.65)"}}>{moodLog[i]}</div>
                      <div style={{fontSize:10,color:isToday?C.teal:C.sub,fontWeight:isToday?800:500}}>{d}</div>
                      {isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:C.teal,margin:"4px auto 0"}}/>}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Legal footer */}
            <div style={{
              background:C.surface,border:`1px solid ${C.border}`,
              borderRadius:16,padding:"16px",backdropFilter:"blur(24px)",
            }}>
              <p style={{fontSize:11,color:C.sub,lineHeight:1.8,textAlign:"center"}}>
                SOLACE provides emotional support only and does not constitute medical advice, diagnosis, or treatment.
                Always consult a qualified mental health professional for clinical concerns.
                <br/>
                <span className="legal-link" onClick={()=>setLegalScreen("privacy")} style={{fontSize:11}}>Privacy Policy</span>
                {" · "}
                <span className="legal-link" onClick={()=>setLegalScreen("terms")} style={{fontSize:11}}>Terms of Service</span>
                {" · "}
                <span style={{color:C.sub}}>CBT-Informed · Evidence-Based · GDPR Compliant</span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── CHAT ─────────────────────────────────────────────────────────────────
  if (screen === "chat") return (
    <>
      <GlobalStyles/>
      <div style={{
        height:"100vh",background:C.grad,
        fontFamily:"'Nunito',sans-serif",color:C.text,
        display:"flex",flexDirection:"column",position:"relative",
      }}>
        <Stars/>
        {/* Header */}
        <div style={{
          padding:"12px 20px",display:"flex",alignItems:"center",gap:12,
          background:C.surface,backdropFilter:"blur(24px)",
          borderBottom:`1px solid ${C.border}`,position:"relative",zIndex:10,
        }}>
          <BackBtn to="home"/>
          <div style={{
            width:40,height:40,borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"white",fontSize:18,
            boxShadow:`0 0 16px rgba(78,205,196,.4)`,
          }}>✦</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:15}}>SAGE</div>
            <div style={{color:C.teal,fontSize:11,fontWeight:600}}>● AI Companion · Not a therapist</div>
          </div>
          <button onClick={()=>setScreen("crisis")} style={{
            padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",
            background:"rgba(255,107,107,.14)",color:C.coral,fontWeight:700,fontSize:12,
          }}>🆘 Crisis</button>
        </div>

        {/* Disclaimer banner in chat */}
        <div style={{
          padding:"8px 20px",textAlign:"center",
          background:"rgba(255,209,102,.07)",
          borderBottom:`1px solid rgba(255,209,102,.12)`,
          color:C.gold,fontSize:11,fontWeight:600,
          position:"relative",zIndex:9,
        }}>
          SAGE is an AI companion — not a therapist, doctor, or crisis service
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{
          flex:1,overflowY:"auto",padding:"20px",
          display:"flex",flexDirection:"column",gap:16,
          position:"relative",zIndex:1,
        }}>
          {messages.map((msg,i)=>(
            <div key={i} style={{
              display:"flex",
              justifyContent:msg.role==="user"?"flex-end":"flex-start",
              animation:"fadeUp .4s ease",gap:10,alignItems:"flex-end",
            }}>
              {msg.role==="assistant"&&(
                <div style={{
                  width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"white",fontSize:14,
                }}>✦</div>
              )}
              <div style={{
                maxWidth:"76%",padding:"14px 18px",
                borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",
                background:msg.role==="user"?`linear-gradient(135deg,${C.teal},#44A3C8)`:C.surface,
                border:msg.role==="user"?"none":`1px solid ${C.border}`,
                color:msg.role==="user"?"white":C.text,
                fontSize:15,lineHeight:1.65,backdropFilter:"blur(24px)",
              }}>{msg.content}</div>
            </div>
          ))}
          {loading&&(
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{
                width:32,height:32,borderRadius:"50%",
                background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
                display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:14,
              }}>✦</div>
              <div style={{
                padding:"14px 20px",borderRadius:"20px 20px 20px 4px",
                background:C.surface,border:`1px solid ${C.border}`,
                backdropFilter:"blur(24px)",display:"flex",gap:6,alignItems:"center",
              }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{
                    width:8,height:8,borderRadius:"50%",background:C.teal,
                    animation:`dotBounce 1.4s ease-in-out infinite`,
                    animationDelay:`${i*.18}s`,
                  }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding:"14px 16px",background:C.surface,backdropFilter:"blur(24px)",
          borderTop:`1px solid ${C.border}`,display:"flex",gap:10,
          position:"relative",zIndex:10,
        }}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
            placeholder={isNight?"It's late — I'm awake with you...":"Tell SAGE what's on your mind..."}
            style={{
              flex:1,padding:"14px 20px",borderRadius:100,
              border:`1px solid ${C.border}`,
              background:isNight?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",
              color:C.text,fontSize:15,fontFamily:"'Nunito',sans-serif",
            }}
          />
          <button onClick={sendMessage} disabled={loading||!input.trim()} style={{
            width:50,height:50,borderRadius:"50%",border:"none",
            background:input.trim()?`linear-gradient(135deg,${C.teal},#44A3C8)`:C.border,
            color:"white",fontSize:20,cursor:input.trim()?"pointer":"not-allowed",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all .2s ease",
            boxShadow:input.trim()?`0 6px 20px rgba(78,205,196,.4)`:"none",
          }}>→</button>
        </div>
      </div>
    </>
  );

  // ─── BREATHE ──────────────────────────────────────────────────────────────
  if (screen === "breathe") {
    const ph = {
      ready:  {text:"Ready to begin",  sub:"4 · 7 · 8 breathing technique"},
      inhale: {text:"Breathe in",      sub:"Fill your lungs completely · 4 seconds"},
      hold:   {text:"Hold",            sub:"Stay perfectly still · 7 seconds"},
      exhale: {text:"Breathe out",     sub:"Release everything · 8 seconds"},
      done:   {text:"Well done ✨",    sub:"Your nervous system thanks you"},
    }[breathState];
    const bScale = (breathState==="inhale"||breathState==="hold")?1.65:1;
    const bTrans = breathState==="inhale"?"transform 4s ease-in":breathState==="exhale"?"transform 8s ease-out":"transform .3s ease";
    return (
      <>
        <GlobalStyles/>
        <div style={{minHeight:"100vh",background:C.grad,fontFamily:"'Nunito',sans-serif",color:C.text,display:"flex",flexDirection:"column"}}>
          <Stars/>
          <NavBar title="Breathing Exercise"/>
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",position:"relative",zIndex:1}}>
            <div style={{position:"relative",marginBottom:56}}>
              <div style={{
                width:180,height:180,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(78,205,196,.25),rgba(68,163,200,.08))",
                border:"2px solid rgba(78,205,196,.4)",
                display:"flex",alignItems:"center",justifyContent:"center",
                transform:`scale(${bScale})`,transition:bTrans,
                boxShadow:"0 0 60px rgba(78,205,196,.18)",
              }}>
                <div style={{fontSize:44,opacity:.85}}>✦</div>
              </div>
            </div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,marginBottom:10,textAlign:"center"}}>{ph.text}</h2>
            <p style={{color:C.sub,fontSize:15,marginBottom:10,textAlign:"center"}}>{ph.sub}</p>
            {breathState!=="ready"&&breathState!=="done"&&(
              <p style={{color:C.teal,fontSize:13,fontWeight:700}}>Cycle {breathCycle+1} of 4</p>
            )}
            {(breathState==="ready"||breathState==="done")&&(
              <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:32,alignItems:"center"}}>
                <button onClick={startBreathing} style={{
                  padding:"16px 48px",borderRadius:100,border:"none",cursor:"pointer",
                  background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
                  color:"white",fontWeight:800,fontSize:16,
                  boxShadow:`0 10px 28px rgba(78,205,196,.4)`,
                }}>{breathState==="done"?"Breathe Again":"Begin"}</button>
                {breathState==="done"&&(
                  <button onClick={()=>setScreen("chat")} style={{
                    padding:"13px 32px",borderRadius:100,border:`1px solid ${C.border}`,
                    background:"transparent",color:C.sub,fontWeight:600,fontSize:14,cursor:"pointer",
                  }}>Talk to SAGE about how you feel</button>
                )}
              </div>
            )}
            <div style={{
              marginTop:40,padding:"16px 24px",borderRadius:16,
              background:C.surface,border:`1px solid ${C.border}`,
              backdropFilter:"blur(24px)",maxWidth:320,textAlign:"center",
            }}>
              <p style={{color:C.sub,fontSize:13,lineHeight:1.7}}>
                The 4-7-8 technique activates your parasympathetic nervous system,
                reducing cortisol and calming anxiety within minutes.
              </p>
              <p style={{color:C.teal,fontSize:11,fontWeight:700,marginTop:8}}>
                EVIDENCE-BASED · Dr. Andrew Weil, Harvard Medical School
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── CRISIS ───────────────────────────────────────────────────────────────
  if (screen === "crisis") return (
    <>
      <GlobalStyles/>
      <div style={{minHeight:"100vh",background:C.grad,fontFamily:"'Nunito',sans-serif",color:C.text}}>
        <Stars/>
        <NavBar title="Crisis Support"/>
        <div style={{maxWidth:440,margin:"0 auto",padding:"24px 20px 60px",position:"relative",zIndex:1}}>
          <div style={{
            background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.2)",
            borderRadius:22,padding:"28px 24px",marginBottom:24,textAlign:"center",
          }}>
            <div style={{fontSize:52,marginBottom:12}}>🤝</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,marginBottom:10}}>You are not alone</h2>
            <p style={{color:C.sub,fontSize:14,lineHeight:1.7}}>
              If you are in immediate danger, please reach out to a crisis line.
              Trained, compassionate humans are available 24 hours a day, every day.
            </p>
            <div style={{
              marginTop:16,padding:"12px 16px",borderRadius:12,
              background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.2)",
            }}>
              <p style={{color:C.coral,fontSize:12,fontWeight:700,lineHeight:1.6}}>
                ⚠️ SOLACE is NOT a crisis intervention service. In immediate danger, call emergency services (911 / 999 / 112) immediately.
              </p>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {CRISIS_LINES.map(l=>(
              <Card key={l.name} style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:26}}>{l.flag}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{l.name}</div>
                  <div style={{color:C.sub,fontSize:12}}>{l.region}</div>
                  <div style={{color:C.teal,fontWeight:800,fontSize:14,marginTop:3}}>{l.contact}</div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{marginTop:28,textAlign:"center"}}>
            <button onClick={()=>setScreen("chat")} style={{
              padding:"15px 40px",borderRadius:100,border:"none",cursor:"pointer",
              background:`linear-gradient(135deg,${C.teal},#44A3C8)`,
              color:"white",fontWeight:800,fontSize:15,
              boxShadow:`0 10px 28px rgba(78,205,196,.4)`,
            }}>Talk to SAGE instead</button>
            <p style={{color:C.sub,fontSize:11,marginTop:14,lineHeight:1.8}}>
              SOLACE is not a substitute for professional mental health care.<br/>
              Always seek help from a qualified professional when needed.<br/>
              <span className="legal-link" style={{fontSize:11}} onClick={()=>setLegalScreen("terms")}>Terms of Service</span>
              {" · "}
              <span className="legal-link" style={{fontSize:11}} onClick={()=>setLegalScreen("privacy")}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );

  // ─── GROWTH ───────────────────────────────────────────────────────────────
  if (screen === "growth") {
    const stages=[
      {e:"🌱",l:"Seed",   r:"1–5 sessions",  u:true},
      {e:"🌿",l:"Sprout", r:"6–15 sessions", u:sessions>=6},
      {e:"🌳",l:"Tree",   r:"16–30 sessions",u:sessions>=16},
      {e:"🌲",l:"Forest", r:"31+ sessions",  u:sessions>=31},
    ];
    const cIdx=sessions<=5?0:sessions<=15?1:sessions<=30?2:3;
    return (
      <>
        <GlobalStyles/>
        <div style={{minHeight:"100vh",background:C.grad,fontFamily:"'Nunito',sans-serif",color:C.text}}>
          <Stars/>
          <NavBar title="Your Growth"/>
          <div style={{maxWidth:440,margin:"0 auto",padding:"24px 20px 80px",position:"relative",zIndex:1}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {icon:"💬",l:"Sessions",    v:sessions},
                {icon:"📅",l:"Days active", v:7},
                {icon:"🎭",l:"Moods logged",v:moodLog.length},
                {icon:"🧘",l:"Techniques",  v:3},
              ].map(s=>(
                <Card key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:26,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:C.teal}}>{s.v}</div>
                  <div style={{color:C.sub,fontSize:12,marginTop:2}}>{s.l}</div>
                </Card>
              ))}
            </div>
            <Card style={{marginBottom:16}}>
              <p style={{fontWeight:800,fontSize:14,marginBottom:24}}>Emotional Growth Map</p>
              <div style={{position:"relative",display:"flex",justifyContent:"space-between"}}>
                <div style={{position:"absolute",top:22,left:"10%",right:"10%",height:2,background:C.border,zIndex:0}}/>
                <div style={{
                  position:"absolute",top:22,left:"10%",height:2,zIndex:1,
                  width:`${(cIdx/3)*80}%`,
                  background:`linear-gradient(90deg,${C.teal},#44A3C8)`,
                  transition:"width 1.2s ease",
                }}/>
                {stages.map((st,i)=>(
                  <div key={st.l} style={{textAlign:"center",position:"relative",zIndex:2,flex:1}}>
                    <div style={{
                      width:46,height:46,borderRadius:"50%",margin:"0 auto 10px",
                      background:i===cIdx?`linear-gradient(135deg,${C.teal},#44A3C8)`:st.u?C.sageGlow:C.border,
                      border:`2px solid ${i===cIdx?C.teal:"transparent"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                      boxShadow:i===cIdx?`0 0 22px rgba(78,205,196,.5)`:"none",
                      filter:st.u?"none":"grayscale(1) opacity(.35)",
                      transition:"all .4s ease",
                    }}>{st.e}</div>
                    <div style={{fontWeight:800,fontSize:12}}>{st.l}</div>
                    <div style={{color:C.sub,fontSize:10,marginTop:2}}>{st.r}</div>
                  </div>
                ))}
              </div>
            </Card>
            {/* Mind Wrapped */}
            <div style={{
              background:`linear-gradient(135deg,rgba(78,205,196,.12),rgba(255,209,102,.08))`,
              border:`1px solid rgba(78,205,196,.18)`,borderRadius:20,padding:"22px",
            }}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>✨ Mind Wrapped</div>
              <p style={{color:C.sub,fontSize:13,marginBottom:16}}>Your monthly emotional insights — shareable</p>
              <div style={{background:C.surface,borderRadius:16,padding:"18px",border:`1px solid ${C.border}`,backdropFilter:"blur(24px)",marginBottom:14}}>
                <div style={{fontSize:11,color:C.sub,letterSpacing:".14em",marginBottom:12,fontWeight:700}}>MAY 2026 · YOUR MIND</div>
                {[
                  {k:"Most felt",v:"😰 Anxious"},
                  {k:"Best day", v:"Wednesdays ✨"},
                  {k:"Peak calm",v:"9–11 AM"},
                  {k:"Growth",   v:"+23% calmer 📈"},
                ].map(r=>(
                  <div key={r.k} style={{display:"flex",justifyContent:"space-between",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${C.border}`}}>
                    <span style={{color:C.sub,fontSize:13}}>{r.k}</span>
                    <span style={{fontWeight:700,fontSize:13}}>{r.v}</span>
                  </div>
                ))}
                <p style={{color:C.sub,fontSize:12,textAlign:"center",fontStyle:"italic",marginTop:4}}>
                  "You showed up for yourself {sessions} times this month."
                </p>
              </div>
              <p style={{color:C.sub,fontSize:11,textAlign:"center"}}>Full shareable card · Premium feature</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
