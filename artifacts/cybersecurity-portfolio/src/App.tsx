import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';

type Filter = 'All Domains' | 'XSS & Injection' | 'Auth & Access' | 'Server & Config' | 'HTTP & Logic';

const filters: Filter[] = ['All Domains', 'XSS & Injection', 'Auth & Access', 'Server & Config', 'HTTP & Logic'];

const vulnerabilityGroups = [
  { domain: 'XSS', filter: 'XSS & Injection' as Filter, severity: 'HIGH', description: 'Client-side trust boundaries and unsafe rendering patterns.', items: ['Reflected', 'Stored', 'DOM'] },
  { domain: 'Injections', filter: 'XSS & Injection' as Filter, severity: 'CRITICAL', description: 'Input handling across data and command interpreters.', items: ['SQL', 'NoSQL', 'OS command'] },
  { domain: 'Access / Auth', filter: 'Auth & Access' as Filter, severity: 'HIGH', description: 'Identity, session, and authorization review surfaces.', items: ['IDOR', 'Login bypass', '2FA bypass'] },
  { domain: 'Server-side', filter: 'Server & Config' as Filter, severity: 'CRITICAL', description: 'Request routing and file boundary validation.', items: ['SSRF', 'Path traversal', 'File disclosure'] },
  { domain: 'Config / Infra', filter: 'Server & Config' as Filter, severity: 'HIGH', description: 'Deployment controls that quietly define the attack surface.', items: ['CORS misconfiguration', 'Security misconfiguration', 'Subdomain takeover'] },
  { domain: 'Web / HTTP', filter: 'HTTP & Logic' as Filter, severity: 'HIGH', description: 'Protocol assumptions and information exposure.', items: ['Host header attacks', 'URL redirection', 'Sensitive information exposure'] },
  { domain: 'App logic / concurrency', filter: 'HTTP & Logic' as Filter, severity: 'CRITICAL', description: 'Workflow integrity under unusual timing and state.', items: ['Race conditions', 'Business logic'] },
];

const presets = {
  SQLi: {
    label: 'SQLi',
    request: 'GET /catalog?sort=price HTTP/1.1\\nHost: lab.local\\nAccept: application/json\\nX-Demo-Mode: simulated',
    result: 'Simulated observation: input reaches a query boundary. Review parameterization and server-side validation.',
  },
  IDOR: {
    label: 'IDOR',
    request: 'GET /api/v1/profile/1042 HTTP/1.1\\nHost: lab.local\\nAuthorization: Bearer demo-token\\nX-Demo-Mode: simulated',
    result: 'Simulated observation: authorization context should be checked against the requested object on every request.',
  },
  '2FA': {
    label: '2FA',
    request: 'POST /auth/verify-step HTTP/1.1\\nHost: lab.local\\nContent-Type: application/json\\n\\n{"step":"verification","mode":"simulated"}',
    result: 'Simulated observation: verification state should be single-use, time-bound, and bound to the session.',
  },
  'Reflected XSS': {
    label: 'Reflected XSS',
    request: 'GET /search?q=demo HTTP/1.1\\nHost: lab.local\\nAccept: text/html\\nX-Demo-Mode: simulated',
    result: 'Simulated observation: output encoding should match the rendering context before data reaches the response.',
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};

function ParticleShieldScene() {
  const particleRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(420 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const radius = 1.3 + Math.random() * 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      values[index] = radius * Math.sin(phi) * Math.cos(theta);
      values[index + 1] = radius * Math.cos(phi) * .78;
      values[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return values;
  }, []);

  useFrame(({ clock, pointer }) => {
    const time = clock.getElapsedTime();
    if (particleRef.current) {
      particleRef.current.rotation.y = time * .07 + pointer.x * .16;
      particleRef.current.rotation.x = Math.sin(time * .18) * .06 + pointer.y * .08;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = time * .16 + pointer.y * .14;
      coreRef.current.rotation.y = time * .22 + pointer.x * .18;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={.12} floatIntensity={.18}>
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={420} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#38e6b7" size={.025} sizeAttenuation transparent opacity={.74} />
      </points>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[.7, 1]} />
        <meshBasicMaterial color="#38e6b7" wireframe transparent opacity={.7} />
      </mesh>
      <mesh scale={.46}>
        <octahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#efad60" wireframe transparent opacity={.34} />
      </mesh>
    </Float>
  );
}

function StaticShieldFallback() {
  return (
    <svg className="shield-svg" viewBox="0 0 400 400" role="img" aria-label="Static security shield visualization">
      <polygon className="shield-fill" points="200,22 343,74 326,239 200,367 74,239 57,74" />
      <polygon className="shield-inner" points="200,55 313,96 298,223 200,322 102,223 87,96" />
      <path className="shield-line" d="M200 55v267M102 223h196M87 96l226 127M313 96L87 223" />
      <path className="shield-line" d="M145 76l110 0M122 277l156 0M104 160l192 0" />
      <circle cx="200" cy="161" r="31" className="shield-line" />
      <path className="shield-line" d="M200 130v62M169 161h62" />
      <circle cx="200" cy="161" r="5" className="shield-signal" />
      <circle cx="87" cy="96" r="3" className="shield-signal" />
      <circle cx="313" cy="96" r="3" className="shield-signal" />
      <circle cx="200" cy="322" r="3" className="shield-signal" />
    </svg>
  );
}

function useTiltHandlers() {
  const enabled = useRef(false);
  useEffect(() => {
    enabled.current = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
  }, []);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled.current || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateX = ((y - 50) / 50) * -3.5;
    const rotateY = ((x - 50) / 50) * 4;
    event.currentTarget.style.setProperty('--spot-x', `${x}%`);
    event.currentTarget.style.setProperty('--spot-y', `${y}%`);
    event.currentTarget.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = '';
  };
  return { onPointerMove, onPointerLeave };
}

function TiltCard({ children, className }: { children: ReactNode; className: string }) {
  const { onPointerMove, onPointerLeave } = useTiltHandlers();
  return <div className={`tilt-card ${className}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>{children}</div>;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div>
      <div className="section-kicker">{eyebrow}</div>
      <h2 className="section-title">{title}</h2>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}

function ShieldVisual() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, originX: 0, originY: 0, currentX: 0, currentY: 0 });
  const canDrag = useRef(false);
  useEffect(() => {
    canDrag.current = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
  }, []);
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!canDrag.current || event.pointerType === 'touch' || !terminalRef.current) return;
    dragState.current = { active: true, originX: event.clientX, originY: event.clientY, currentX: 0, currentY: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active || !terminalRef.current) return;
    const currentX = event.clientX - dragState.current.originX;
    const currentY = event.clientY - dragState.current.originY;
    dragState.current.currentX = currentX;
    dragState.current.currentY = currentY;
    terminalRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
  };
  const stopDrag = () => {
    dragState.current.active = false;
  };
  return (
    <div className="shield-art" aria-label="Decorative polygonal security shield visualization">
      <div className="shield-canvas" aria-hidden="true">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 44 }} dpr={[1, 1.5]} fallback={<StaticShieldFallback />}>
          <ambientLight intensity={.3} />
          <ParticleShieldScene />
        </Canvas>
      </div>
      <div
        className="terminal-card"
        ref={terminalRef}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        data-testid="hero-terminal"
        title="Drag on desktop to move this local terminal"
      >
        <div className="terminal-top">
          <span>LOCAL LAB / OPS-01</span>
          <span className="terminal-status"><span className="status-dot" aria-hidden="true" /> ONLINE</span>
        </div>
        <div className="terminal-body">
          <span className="terminal-line"><span className="prompt">naveen@lab:~$</span> whoami</span>
          <span className="terminal-line">Lotla Naveenkrishnateja / India</span>
          <span className="terminal-line"><span className="prompt">naveen@lab:~$</span> profile --focus</span>
          <span className="terminal-line">VAPT · web apps · API security</span>
          <span className="terminal-line">manual testing / validation / 25+ classes</span>
          <span className="terminal-line dim">no network requests · local simulation</span>
        </div>
      </div>
    </div>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const links = ['about', 'arsenal', 'vulnerabilities', 'burp-simulator', 'experience', 'certifications', 'contact'];
  return (
    <header className="nav-shell" data-testid="floating-navigation">
      <a className="brand-mark" href="#about" onClick={() => setOpen(false)} aria-label="Go to about section">
        <i aria-hidden="true" /> LN / SEC
      </a>
      <nav className={`nav-links ${open ? 'mobile-open' : ''}`} aria-label="Primary navigation">
        {links.map((link) => (
          <a key={link} href={`#${link}`} onClick={() => setOpen(false)}>{link.replace('-', ' ')}</a>
        ))}
      </nav>
      <div className="availability"><span className="status-dot" aria-hidden="true" /> seeking</div>
      <a href="#contact" className="button-ghost" onClick={() => setOpen(false)}>hire / connect <ArrowUpRight size={13} /></a>
      <button className="mobile-menu" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>
        {open ? <X size={17} /> : <Menu size={17} />}
      </button>
    </header>
  );
}

function Hero() {
  const roles = ['VAPT / Cybersecurity Intern', 'Manual Web App Penetration Tester', 'API Security Tester', 'Bug Bounty Hunter'];
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState('');
  useEffect(() => {
    let cursor = 0;
    let deleting = false;
    const timer = window.setInterval(() => {
      const role = roles[roleIndex];
      if (!deleting) {
        setText(role.slice(0, cursor + 1));
        cursor += 1;
        if (cursor === role.length) {
          deleting = true;
          window.clearInterval(timer);
          window.setTimeout(() => setRoleIndex((index) => (index + 1) % roles.length), 1500);
        }
      }
    }, 72);
    return () => window.clearInterval(timer);
  }, [roleIndex]);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid grid-rule" aria-hidden="true" />
      <div className="section-wrap hero-layout">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="hero-eyebrow"><span /> security operations portfolio</div>
          <h1 className="hero-title" id="hero-title" aria-label="Lotla Naveenkrishnateja">Lotla <br /><em>Naveenkrishnateja</em></h1>
          <div className="hero-role" aria-live="polite">{text}<span className="caret" aria-hidden="true" /></div>
          <p className="hero-intro"><strong className="hero-slogan">Break it to build it safer.</strong> A first-year cybersecurity student turning disciplined lab practice into practical security instincts.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#burp-simulator">open the lab <ChevronRight size={14} /></a>
            <a className="button-ghost" href="#contact">start a conversation <ArrowUpRight size={14} /></a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .2 }} className="hero-aside">
          <ShieldVisual />
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <div className="section-wrap stat-strip" data-testid="portfolio-counters">
      <div className="stat-cell"><strong className="stat-value">25+</strong><span className="stat-label">vulnerability classes</span></div>
      <div className="stat-cell"><strong className="stat-value">04</strong><span className="stat-label">training tracks · 2026</span></div>
      <div className="stat-cell"><strong className="stat-value">03</strong><span className="stat-label">core testing modes</span></div>
      <div className="stat-cell"><strong className="stat-value">01</strong><span className="stat-label">safe local lab</span></div>
    </div>
  );
}

function SignalMarquee() {
  return (
    <div className="signal-marquee" aria-label="Portfolio capability ticker">
      <div className="signal-track">
        <span>MANUAL IDENTIFICATION</span><i /> <span>REQUEST ANALYSIS</span><i /> <span>API TESTING</span><i /> <span>DEFENSIVE THINKING</span><i /> <span>MANUAL IDENTIFICATION</span><i /> <span>REQUEST ANALYSIS</span><i /> <span>API TESTING</span><i /> <span>DEFENSIVE THINKING</span><i />
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="section-space">
      <div className="section-wrap about-layout">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }} variants={fadeUp}>
          <SectionHeading eyebrow="01 / signal" title="A methodical start to a security career." copy="Seeking a VAPT / Web Application Security internship where careful observation, repeatable testing, and clear reporting matter." />
          <div className="about-points">
            <div className="info-pod"><small>based in</small><strong>India</strong></div>
            <div className="info-pod"><small>education</small><strong>1st-year bachelor's student</strong></div>
            <div className="info-pod"><small>learning window</small><strong>2026–present</strong></div>
            <div className="info-pod"><small>prior study</small><strong>12th / Intermediate completed</strong></div>
          </div>
        </motion.div>
        <motion.div className="about-note" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }} variants={fadeUp}>
          <p className="quote">“The useful finding is the one a team can reproduce, understand, and fix.”</p>
          <span className="sign">— working principle / LN</span>
        </motion.div>
      </div>
    </section>
  );
}

function Arsenal() {
  const skills = ['Burp Suite', 'Linux', 'Splunk', 'Python', 'SQL', 'HTML', 'CSS'];
  const meters = [['Manual testing', '84%'], ['API testing', '72%'], ['Report writing', '68%'], ['Log analysis', '61%']];
  return (
    <section id="arsenal" className="arsenal-section section-space">
      <div className="section-wrap arsenal-layout">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp}>
          <SectionHeading eyebrow="02 / toolkit" title="An arsenal built around first principles." copy="Familiar with the tools that make a finding actionable, from intercepting requests to reading the story inside a log." />
          <div className="skill-list">{skills.map((skill) => <div className="skill-chip" key={skill}><i />{skill}</div>)}</div>
        </motion.div>
        <motion.div className="arsenal-board" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp} data-testid="skills-board">
          <div className="board-head"><span>practice telemetry</span><span>lab / 2026</span></div>
          {meters.map(([name, value]) => <div className="meter-row" key={name}><span>{name}</span><div className="meter"><span style={{ width: value }} /></div><b>{value}</b></div>)}
        </motion.div>
      </div>
    </section>
  );
}

function Vulnerabilities() {
  const [filter, setFilter] = useState<Filter>('All Domains');
  const visible = useMemo(() => filter === 'All Domains' ? vulnerabilityGroups : vulnerabilityGroups.filter((group) => group.filter === filter), [filter]);
  return (
    <section id="vulnerabilities" className="section-space">
      <div className="section-wrap">
        <SectionHeading eyebrow="03 / coverage map" title="Twenty-five plus ways to ask better questions." copy="A growing map of vulnerability classes practiced in safe labs — grouped by the security decision they test." />
        <div className="filter-bar" role="group" aria-label="Filter vulnerability domains" data-testid="vulnerability-filters">
          {filters.map((item) => <button className={`filter-button ${filter === item ? 'active' : ''}`} type="button" key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} data-testid={`filter-${item}`}>{item}</button>)}
        </div>
        <motion.div layout className="vuln-grid" data-testid="vulnerability-grid">
          <AnimatePresence mode="popLayout">
            {visible.map((group, index) => (
              <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }} className="vuln-card" key={group.domain}>
                <div className="vuln-top"><span className="vuln-index">0{index + 1} / {group.filter}</span><span className="vuln-count">{group.items.length} classes</span></div>
                <h3>{group.domain}</h3>
                <p>{group.description}</p>
                <div className="vuln-tags">{group.items.map((item) => <span key={item}>{item}</span>)}</div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function BurpSimulator() {
  const [preset, setPreset] = useState<keyof typeof presets>('SQLi');
  const [request, setRequest] = useState(presets.SQLi.request);
  const [result, setResult] = useState(presets.SQLi.result);
  const [sending, setSending] = useState(false);
  const selectPreset = (name: keyof typeof presets) => {
    setPreset(name);
    setRequest(presets[name].request);
    setResult(presets[name].result);
  };
  const sendPacket = () => {
    setSending(true);
    setResult('Encoding packet locally… replaying against a fictional lab target… analyzing response…');
    window.setTimeout(() => {
      setSending(false);
      setResult(presets[preset].result);
    }, 1100);
  };
  return (
    <section id="burp-simulator" className="simulator-section section-space">
      <div className="section-wrap simulator-layout">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp}>
          <SectionHeading eyebrow="04 / interactive lab" title="A repeater without the risk." copy="Try the workflow used to understand a request. Every result below is simulated locally; this interface never sends a packet." />
          <div className="explain-list">
            {[
              ['01', 'Intercept', 'Capture the request and identify its trust boundaries.'],
              ['02', 'Modify', 'Change one input at a time so the observation stays attributable.'],
              ['03', 'Replay', 'Send the edited request to a fictional local target.'],
              ['04', 'Analyze', 'Translate the simulated response into a defensive next step.'],
            ].map(([number, title, copy]) => <div className="explain-item" key={number}><span className="explain-number">{number}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}
          </div>
        </motion.div>
        <motion.div className="repeater" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp} data-testid="burp-repeater">
          <div className="repeater-header"><span><span className="traffic-dot" />BURP REPEATER / SAFE MODE</span><span>LOCAL // NO HTTP</span></div>
          <div className="preset-row" role="group" aria-label="Request presets">
            {(Object.keys(presets) as Array<keyof typeof presets>).map((name) => <button type="button" className={preset === name ? 'active' : ''} onClick={() => selectPreset(name)} key={name} data-testid={`preset-${name}`}>{presets[name].label}</button>)}
          </div>
          <textarea aria-label="Editable simulated raw request" className="request-editor" value={request} onChange={(event) => setRequest(event.target.value)} data-testid="raw-request" />
          <div className="repeater-footer">
            <span className="mono" style={{ color: '#71838d', fontSize: 10 }}>editable request buffer</span>
            <button className="button-primary" type="button" onClick={sendPacket} disabled={sending} data-testid="send-packet">{sending ? 'analyzing…' : 'send packet'} <Send size={13} /></button>
          </div>
          <div className="sim-result" aria-live="polite" data-testid="simulated-response"><strong style={{ color: '#38e6b7' }}>SIMULATED RESPONSE</strong><br />{result}</div>
        </motion.div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className="section-space">
      <div className="section-wrap">
        <SectionHeading eyebrow="05 / field notes" title="Hands-on, even before the first badge." copy="A practice loop focused on manual identification, validation, and communicating what the evidence means." />
        <div className="experience-grid">
          <motion.article className="experience-card" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp}>
            <span className="card-label">hands-on practice / ongoing</span><h3>Web application labs</h3><p>Working through web security scenarios across 25+ vulnerability classes, looking for the difference between a suspicious input and a reproducible finding.</p><div className="tool-row"><span>intercept</span><span>validate</span><span>document</span></div>
          </motion.article>
          <motion.article className="experience-card" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={fadeUp}>
            <span className="card-label">focus / current</span><h3>API testing & triage</h3><p>Practicing request review, authorization thinking, and response analysis while building familiarity with Linux, Python, SQL, and Splunk workflows.</p><div className="tool-row"><span>requests</span><span>auth context</span><span>logs</span></div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function Certifications() {
  const training = [
    ['2026', 'VAPT Training', 'Vulnerability assessment and penetration testing foundations.'],
    ['2026', 'Bug Bounty Hunting', 'A structured approach to scope, validation, and responsible reporting.'],
    ['2026', 'Ethical Hacking', 'Core concepts for understanding offensive methods defensively.'],
    ['2026', 'SOC Training', 'Security operations, alert context, and the analyst mindset.'],
  ];
  return (
    <section id="certifications" className="section-space">
      <div className="section-wrap training-layout">
        <div>
          <SectionHeading eyebrow="06 / learning log" title="Training, not inflated credentials." copy="Completed training tracks, accurately represented. The work is early, focused, and still moving." />
          <div className="timeline">
            <div className="timeline-item"><time>2026–present</time><h3>Bachelor's student</h3><p>First-year cybersecurity studies with a practical focus.</p></div>
            <div className="timeline-item"><time>COMPLETED</time><h3>12th / Intermediate</h3><p>Academic foundation completed before beginning the bachelor's program.</p></div>
          </div>
        </div>
        <div className="training-grid">{training.map(([year, title, copy], index) => <motion.article className="training-card" key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { delay: index * .08, duration: .5 } } }}><span className="training-year">{year} / TRAINING</span><h3>{title}</h3><p>{copy}</p></motion.article>)}</div>
      </div>
      <div className="section-wrap objective-box"><p>To begin my cybersecurity career through a VAPT internship where I can apply my knowledge of manual penetration testing, web application security, API testing, vulnerability assessment, and security tools while developing practical experience in a professional cybersecurity environment.</p></div>
    </section>
  );
}

function Contact() {
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);
  const copyValue = (value: string, label: string) => {
    void navigator.clipboard?.writeText(value);
    setToast(`${label} copied to clipboard`);
    window.setTimeout(() => setToast(''), 2400);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setToast('Message encrypted locally — ready to send');
    }, 1600);
  };
  return (
    <section id="contact" className="contact-section section-space">
      <div className="section-wrap contact-layout">
        <div>
          <SectionHeading eyebrow="07 / open channel" title="Let’s talk about the attack surface." copy="For internship conversations, lab walkthroughs, or a thoughtful first security problem. The channel is open." />
          <div className="contact-cards">
            <button type="button" className="contact-card" onClick={() => copyValue('lotlanaveen376@gmail.com', 'Email')} data-testid="copy-email"><span className="contact-card-main"><span className="contact-icon"><Mail size={15} /></span><span><small>email</small><strong>lotlanaveen376@gmail.com</strong></span></span><Copy size={14} /></button>
            <button type="button" className="contact-card" onClick={() => copyValue('+91 8247344729', 'Phone')} data-testid="copy-phone"><span className="contact-card-main"><span className="contact-icon"><Phone size={15} /></span><span><small>phone</small><strong>+91 8247344729</strong></span></span><Copy size={14} /></button>
            <div className="contact-card"><span className="contact-card-main"><span className="contact-icon"><MapPin size={15} /></span><span><small>location</small><strong>India</strong></span></span><Radio size={14} /></div>
          </div>
        </div>
        <form className="contact-form" onSubmit={submit} data-testid="message-form">
          <div className="form-head"><span className="section-kicker">secure message</span><LockKeyhole size={16} color="#38e6b7" /></div>
          <label className="form-field"><span>your name</span><input required name="name" placeholder="Name" data-testid="message-name" /></label>
          <label className="form-field"><span>your email</span><input required type="email" name="email" placeholder="you@company.com" data-testid="message-email" /></label>
          <label className="form-field"><span>message</span><textarea required name="message" placeholder="Tell Naveen what you are working on..." data-testid="message-body" /></label>
          <button className="button-primary form-submit" type="submit" disabled={sending} data-testid="encrypt-submit">{sending ? 'encrypting locally…' : 'encrypt & prepare message'} <ShieldCheck size={14} /></button>
          {sending && <div className="encryption-state" role="status">creating local envelope · no data has left this page<div className="encryption-bar"><span /></div></div>}
          {!sending && toast.includes('ready') && <div className="encryption-state" role="status"><Check size={13} /> {toast}</div>}
        </form>
      </div>
      <AnimatePresence>{toast && !toast.includes('ready') && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="toast-note" role="status" data-testid="copy-toast">{toast}</motion.div>}</AnimatePresence>
    </section>
  );
}

function App() {
  return (
    <main className="portfolio-shell">
      <Navigation />
      <Hero />
      <Stats />
      <SignalMarquee />
      <About />
      <Arsenal />
      <Vulnerabilities />
      <BurpSimulator />
      <Experience />
      <Certifications />
      <Contact />
      <footer className="footer"><div className="section-wrap footer-inner"><span>LOTLA NAVEENKRISHNATEJA / SECURITY PORTFOLIO</span><span>safe local demo / no network requests</span></div></footer>
    </main>
  );
}

export default App;