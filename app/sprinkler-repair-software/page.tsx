'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

const SBP_URL  = 'https://knjdbgroiyhvqwrpqzcx.supabase.co';
const SBP_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
let sbpClient: any = null;
let sbpOpenForm = 0;

function getSbpClient() {
  if (!sbpClient) sbpClient = (window as any).supabase.createClient(SBP_URL, SBP_ANON);
  return sbpClient;
}

function openSignupModal(n: number, btn: HTMLElement) {
  closeAllModals();
  sbpOpenForm = n;
  const form = document.getElementById('sbp-form-' + n)!;
  const rect = btn.getBoundingClientRect();
  const formW = Math.min(420, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  let top  = rect.bottom + 12;
  let left = centerX - formW / 2;
  if (top + 460 > window.innerHeight) { top = rect.top - 460 - 12; if (top < 12) top = 12; }
  top  = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - formW - 12));
  form.style.top  = top  + 'px';
  form.style.left = left + 'px';
  form.style.display = 'block';
  document.getElementById('sbp-backdrop')!.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSignupModal(n: number) {
  document.getElementById('sbp-form-' + n)!.style.display = 'none';
  document.getElementById('sbp-backdrop')!.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function closeAllModals() {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('sbp-form-' + i);
    if (el) el.style.display = 'none';
  });
  const backdrop = document.getElementById('sbp-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function sbpStep2(n: number) {
  const err = document.getElementById(`sbp${n}-err1`)!;
  err.style.display = 'none';
  const first = (document.getElementById(`sbp${n}-first`) as HTMLInputElement).value.trim();
  const last  = (document.getElementById(`sbp${n}-last`)  as HTMLInputElement).value.trim();
  const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
  const email = (document.getElementById(`sbp${n}-email`) as HTMLInputElement).value.trim();
  if (!first || !last)                return sbpShowErr(err, 'Please enter your first and last name.');
  if (!comp)                          return sbpShowErr(err, 'Please enter your company name.');
  if (!email || !email.includes('@')) return sbpShowErr(err, 'Please enter a valid email address.');
  (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value = email;
  document.getElementById(`sbp${n}-step1`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step2`)!.style.display = 'block';
  (document.getElementById(`sbp${n}-password`) as HTMLInputElement).focus();
}

function sbpBackToStep1(n: number) {
  document.getElementById(`sbp${n}-step2`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step1`)!.style.display = 'block';
  document.getElementById(`sbp${n}-err2`)!.style.display  = 'none';
}

async function sbpCreateAccount(n: number) {
  const err = document.getElementById(`sbp${n}-err2`)!;
  const btn = document.getElementById(`sbp${n}-create-btn`) as HTMLButtonElement;
  err.style.display = 'none';
  const email    = (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value.trim();
  const password = (document.getElementById(`sbp${n}-password`)    as HTMLInputElement).value;
  const confirm  = (document.getElementById(`sbp${n}-confirm`)     as HTMLInputElement).value;
  if (password.length < 8)  return sbpShowErr(err, 'Password must be at least 8 characters.');
  if (password !== confirm)  return sbpShowErr(err, 'Passwords do not match.');
  if (!(document.getElementById(`sbp${n}-agree`) as HTMLInputElement).checked)
    return sbpShowErr(err, 'Please agree to the Terms of Service and Privacy Policy.');
  btn.disabled = true;
  btn.textContent = 'Creating your account…';
  try {
    const res = await fetch(SBP_URL + '/functions/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SBP_ANON, 'apikey': SBP_ANON },
      body: JSON.stringify({ action: 'create', email, password }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    const sb = getSbpClient();
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(signInErr.message);
    const uid   = signInData.user.id;
    const first = (document.getElementById(`sbp${n}-first`)   as HTMLInputElement).value.trim();
    const last  = (document.getElementById(`sbp${n}-last`)    as HTMLInputElement).value.trim();
    const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
    await sb.auth.updateUser({ data: { full_name: first + ' ' + last } });
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('user_profiles').upsert(
      { id: uid, email, role: 'full_access', is_primary_owner: true, tenant_id: null, trial_ends_at: trialEnd },
      { onConflict: 'id' }
    );
    await sb.from('company_info').insert({ user_id: uid, company_name: comp, display_name: comp });
    const reasons = ['Cancel Maintaining Self','Cancel Sold House','Cancel Too Expensive','Cancel Unknown','Dropping Customer','Sold House']
      .map(nm => ({ name: nm, active: true, user_id: uid }));
    await sb.from('cancellation_reasons').insert(reasons);
    document.getElementById(`sbp${n}-step2`)!.style.display   = 'none';
    document.getElementById(`sbp${n}-success`)!.style.display = 'block';
    let secs = 4;
    const cd = document.getElementById(`sbp${n}-countdown`)!;
    cd.textContent = 'Redirecting in ' + secs + ' seconds…';
    const iv = setInterval(() => {
      secs--;
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.irrigationbosspro.com/dashboard.html' + (typeof signInData!=='undefined'&&signInData&&signInData.session?'#access_token='+encodeURIComponent(signInData.session.access_token)+'&refresh_token='+encodeURIComponent(signInData.session.refresh_token):''); }
      else cd.textContent = 'Redirecting in ' + secs + ' second' + (secs === 1 ? '' : 's') + '…';
    }, 1000);
  } catch (e: any) {
    sbpShowErr(err, e.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create My Account';
  }
}

function sbpShowErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = 'block'; }

function SignupForm({ n }: { n: number }) {
  return (
    <div id={`sbp-form-${n}`} className="sbp-form">
      <div className="sbp-form-header">
        <div className="sbp-form-title">Start Your 14-Day Free Trial</div>
        <div className="sbp-form-subtitle">No credit card required. Full access. Cancel anytime.</div>
        <button className="sbp-form-close" onClick={() => closeSignupModal(n)}>×</button>
      </div>
      <div id={`sbp${n}-step1`} className="sbp-form-body">
        <div id={`sbp${n}-err1`} className="sbp-err"></div>
        <div className="sbp-field-row">
          <div className="sbp-field-half">
            <label className="sbp-label">First Name</label>
            <input id={`sbp${n}-first`} type="text" placeholder="John" className="sbp-input" />
          </div>
          <div className="sbp-field-half">
            <label className="sbp-label">Last Name</label>
            <input id={`sbp${n}-last`} type="text" placeholder="Smith" className="sbp-input" />
          </div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Company Name</label>
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Irrigation" className="sbp-input" />
        </div>
        <div className="sbp-field-last">
          <label className="sbp-label">Email Address</label>
          <input id={`sbp${n}-email`} type="email" placeholder="you@yourcompany.com" className="sbp-input" />
        </div>
        <button onClick={() => sbpStep2(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Next: Create Password →
        </button>
      </div>
      <div id={`sbp${n}-step2`} className="sbp-form-body" style={{display:'none'}}>
        <div id={`sbp${n}-err2`} className="sbp-err"></div>
        <div className="sbp-trial-note">
          <div className="sbp-trial-note-title">14-Day Free Trial — No Credit Card Required</div>
          <div className="sbp-trial-note-sub">Full access to every feature. $129/month after trial.</div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Login Email</label>
          <input id={`sbp${n}-login-email`} type="email" readOnly className="sbp-input sbp-input-readonly" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Password</label>
          <input id={`sbp${n}-password`} type="password" placeholder="At least 8 characters" className="sbp-input" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Confirm Password</label>
          <input id={`sbp${n}-confirm`} type="password" placeholder="Repeat password" className="sbp-input" />
        </div>
        <div className="sbp-agree-row">
          <input type="checkbox" id={`sbp${n}-agree`} className="sbp-agree-check" />
          <label htmlFor={`sbp${n}-agree`} className="sbp-agree-label">
            I agree to the{' '}
            <a href="https://irrigationbosspro.com/terms" target="_blank" rel="noreferrer" className="sbp-link">Terms of Service</a>
            {' '}and{' '}
            <a href="https://irrigationbosspro.com/privacy-policy" target="_blank" rel="noreferrer" className="sbp-link">Privacy Policy</a>
          </label>
        </div>
        <button id={`sbp${n}-create-btn`} onClick={() => sbpCreateAccount(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Create My Account
        </button>
        <button className="sbp-btn-back" onClick={() => sbpBackToStep1(n)}>← Back</button>
      </div>
      <div id={`sbp${n}-success`} className="sbp-success-panel">
        <div className="sbp-success-icon">✓</div>
        <div className="sbp-success-title">You&#39;re In!</div>
        <div className="sbp-success-sub">Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
        <div id={`sbp${n}-countdown`} className="sbp-countdown"></div>
      </div>
    </div>
  );
}

export default function SprinklerRepairSoftware() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !sbpOpenForm) return;
      const n = sbpOpenForm;
      if (document.getElementById('sbp-form-' + n)?.style.display !== 'block') return;
      if (document.getElementById(`sbp${n}-step2`)?.style.display === 'block') sbpCreateAccount(n);
      else sbpStep2(n);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Navbar onTrialClick={(el) => openSignupModal(1, el)} />

      <div className="hero">
        <div className="hero-badge">Built Specifically for Irrigation &amp; Sprinkler Pros</div>
        <h1>Sprinkler Repair Software<br /><span>Built for How Irrigation Crews Actually Work</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. IrrigationBossPro is built from the ground up for irrigation and sprinkler companies &mdash; new system installs, valve and head repairs, backflow testing, fall winterizations, and spring start-ups. Your work is project-heavy, parts-heavy, and seasonal, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Bids</div><div className="hero-stat-lbl">Line-Item Estimates in Minutes</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'var(--purple-dark)', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="IrrigationBossPro sprinkler repair software dashboard on laptop showing the job board and line-item estimate builder, with the crew mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Sprinkler Repair Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. IrrigationBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📝</div><h4>Line-Item Estimates</h4><p>Build a sprinkler repair or full install bid with parts and labor on separate lines &mdash; heads, valves, controllers, pipe, and backflow devices priced individually. Email it, let the customer approve with one click, and convert it straight to an invoice.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts Tracking</h4><p>Keep a full catalog of rotors, spray heads, valves, controllers, pipe, fittings, and backflow assemblies with your cost and price. Pull parts onto any estimate or work order and know your real margin on every job.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📅</div><h4>Project Scheduling</h4><p>Multi-day installs, single-stop repairs, and seasonal blowouts all live on one schedule. Assign the date, the crew, and the truck, and watch the whole week fill in across the dispatch board.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, invoicing, charge after the repair, payment tracking, and overdue reports &mdash; the full Stripe integration is wired in. Collect a deposit on an install up front and the balance the day you finish.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Seasonal Service</h4><p>Winterization blowouts in the fall, start-ups in the spring, mid-season tune-ups in between. IrrigationBossPro tracks who is due each season and queues them on the Job Board so no recurring customer slips.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your techs get a mobile dashboard with their jobs for the day, the property notes, the parts list, and the complete button. Log repairs, add parts used, and close the work order &mdash; all from the truck without calling the office.</p></div>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Job Board — Your Daily Hub</span>
            <h2 style={{color:'#fff'}}>Every Install, Repair, and Blowout in One Place.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The Job Board is where your whole operation lives. Every approved estimate, every service call, and every seasonal winterization lands here the moment it is booked. You see what is scheduled, what is waiting, which crew owns it, and what parts each job needs &mdash; before a single truck rolls out of the yard.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>New installs, valve &amp; head repairs, backflow tests, and blowouts on one board</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Filter by job type, crew, status, or service date in one click</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>See approved estimates and the parts each job requires</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag a job onto a date and assign it to a crew and truck</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Multi-day install projects tracked from deposit to final invoice</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Seasonal winterization and start-up lists build themselves each season</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark jobs complete, parked, or rescheduled right from the field</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No more whiteboard, no more sticky notes, no more lost service calls</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Job Board — This Week</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>New System Install — 6 Zones</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew A · Tue–Wed · 14 Oak Ridge Dr</div></div>
              <div style={{marginLeft:'auto', background:'#65a30d', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$6,480</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Valve &amp; Head Repair</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew B · Tue · 8 stuck rotors, 1 valve</div></div>
              <div style={{marginLeft:'auto', background:'#65a30d', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$420</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#bef264', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Backflow Test &amp; Certify</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew B · Wed · cert report to city</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$95</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Fall Winterization — Blowout</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew A · Thu · 11 recurring accounts</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$880</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'16px', fontWeight:700}}>One board. Your whole week.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Installs, repairs, backflow, and seasonal &mdash; together.</div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Sprinkler Repair Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. IrrigationBossPro is the exception. Every screen was designed by people who have actually pulled valves and pressure-tested mainlines &mdash; not UX designers who have never opened a valve box. Your crew will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your services and parts catalog, import your clients and properties, set up your automated texts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimates, the Job Board, dispatch, parts, and invoicing are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the board and every install, repair, and blowout for the day is right there in a single view.'},
            {n:'03', title:'Your Crew Learns It in Minutes', body:'The mobile app your techs use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property notes, the parts list, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your customer texts, estimate follow-ups, and payment reminders once. After that, IrrigationBossPro handles every on-my-way text, every follow-up, and every review request automatically — whether you\'re on a job, at home, or on vacation.'},
          ].map(({n, title, body}) => (
            <div key={n} style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'30px 26px'}}>
              <div style={{fontSize:'40px', fontWeight:800, color:'var(--orange)', opacity:.25, lineHeight:1, marginBottom:'12px'}}>{n}</div>
              <h3 style={{fontSize:'17px', fontWeight:700, color:'var(--text)', marginBottom:'8px'}}>{title}</h3>
              <p style={{color:'var(--muted)', fontSize:'14px', lineHeight:1.6}}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Irrigation Work</h2>
          <p className="section-sub">Sprinkler work is not plumbing. One day it&apos;s a multi-day, six-zone install with a thousand dollars of parts on the truck. The next it&apos;s eight stuck rotors and a leaking valve. Then fall hits and you have two hundred winterization blowouts to run before the first hard freeze.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running irrigation crews ourselves, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to build a <strong>line-item install bid with forty parts on it</strong>, track the deposit, schedule a two-day crew, and then bill the balance the day the system fired up clean.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t do that well. Because they weren&apos;t built by someone who runs an irrigation business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and IrrigationBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in IrrigationBossPro exists because we needed it on a real install, a real repair call, or a real blowout route. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Irrigation</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in IrrigationBossPro was built with irrigation and sprinkler workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📝', title:'Line-Item Estimates & Bids', body:'Build install and repair bids with parts and labor on separate lines — heads, valves, controllers, pipe, and backflow devices each priced out. Email it, let the customer approve with one click, and auto-follow-ups go out if they don\'t respond.'},
            {icon:'📦', title:'Materials & Parts Catalog', body:'Keep rotors, spray heads, valves, controllers, pipe, fittings, and backflow assemblies in a full catalog with your cost and price. Drop parts onto any estimate or work order and know your true margin on every job.'},
            {icon:'📅', title:'Project & Job Scheduling', body:'Schedule multi-day installs, single-stop repairs, backflow tests, and seasonal blowouts on one calendar. Assign the date, the crew, and the truck — the whole week fills in on the board.'},
            {icon:'🗂️', title:'The Job Board', body:'Every approved estimate, service call, and seasonal job lands on one board. See what\'s scheduled, what\'s waiting, who owns it, and what parts it needs before any truck leaves the yard.'},
            {icon:'🚚', title:'Crew Dispatch & Routing', body:'Assign jobs to crews and trucks, order the day\'s stops to cut drive time, and dispatch the whole route from one screen. Your repair tech and your install crew each see their own day.'},
            {icon:'🔁', title:'Seasonal Service Tracking', body:'Fall winterizations, spring start-ups, and mid-season tune-ups recur every year. IrrigationBossPro tracks who is due each season and queues them automatically so no recurring customer slips.'},
            {icon:'🛡️', title:'Backflow Testing Records', body:'Log backflow test results, device details, and certification dates per property. Pull a clean record when a customer or the city asks who tested the device and when.'},
            {icon:'💬', title:'Automated Customer Texts', body:'Automatically text customers when a job is scheduled, when your crew is on the way, and when the work is done. Set it once — IrrigationBossPro handles the communication for every single job.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Take a deposit on an install, charge the balance after a repair, send invoices, and collect without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Crews', body:'Your techs get a mobile view of their jobs for the day. Add parts used, mark work complete, skip, or reschedule — right from the truck without calling the office.'},
            {icon:'🏠', title:'Property & Client Profiles', body:'Every property has its own record — zone count, controller model, valve and head history, backflow device, service notes, GPS, and photos. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive texts with customers directly inside IrrigationBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install or repair, IrrigationBossPro automatically sends a Google review request — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a customer doesn\'t respond to your install or repair bid. Let IrrigationBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you\'re owed on installs and repairs without making uncomfortable calls.'},
            {icon:'👥', title:'Client & Lead Management', body:'Manage existing clients and active prospects side by side. Track bids, service history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any bid. Set sales tax rates by jurisdiction and let IrrigationBossPro calculate and track tax on parts and labor automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Technician, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck Management', body:'Create truck profiles, assign vehicles to crews and jobs, and track which truck handled each job. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track tech hours per job and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards show today\'s revenue, jobs completed, properties served, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Job scheduled, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every office staffer, install crew, and repair tech at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESTIMATES & PARTS */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Estimates, Parts &amp; Margin</span>
            <h2>Bid Installs and Repairs With Real Parts and Real Margin</h2>
            <p>Irrigation work lives and dies on the bid. IrrigationBossPro lets you build a line-item estimate with every head, valve, controller, length of pipe, and backflow device priced individually &mdash; so the customer sees a clean professional quote and you see your true margin before you ever pick up a wrench. For a full walkthrough of how estimates, parts, scheduling, and seasonal service fit together, read <a href="/blogs/sprinkler-repair-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Sprinkler Repair Software: The Complete Guide for Irrigation Service Pros</a>.</p>
            <ul className="check-list">
              <li>Separate parts and labor lines on every estimate</li>
              <li>Pull parts straight from your catalog with cost and price</li>
              <li>Take a deposit on an install, bill the balance at completion</li>
              <li>One-click customer approval, then convert to an invoice</li>
              <li>Automated follow-up texts on bids that go quiet</li>
              <li>Discounts and sales tax calculated automatically</li>
              <li>See margin per job before the truck rolls</li>
              <li>Full payment history tied to every invoice</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Estimate — 6-Zone Install</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Rotor Heads × 18</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Part · catalog price</div></div>
              <div style={{marginLeft:'auto', background:'#65a30d', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$324</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Zone Valves × 6</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Part · catalog price</div></div>
              <div style={{marginLeft:'auto', background:'#65a30d', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$210</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#bef264', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Smart Controller + Pipe</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Parts · controller, 600 ft poly</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$686</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Install Labor — 2 Days</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew of 3 · trenching &amp; setup</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$3,900</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'16px', fontWeight:700}}>Bid total: $6,480 &mdash; margin shown live.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Parts and labor, line by line.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEASONAL SERVICE */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Seasonal Recurring Work</span>
            <h2>Winterizations and Start-Ups That Schedule Themselves</h2>
            <p>The irrigation calendar runs on seasons. Every fall you owe your customers a blowout before the freeze, and every spring you owe them a start-up. IrrigationBossPro tracks who is due each season, builds the list for you, and queues it on the Job Board so a full route of recurring revenue is ready to dispatch &mdash; no digging through last year&apos;s notes.</p>
            <ul className="check-list">
              <li>Tag customers for fall winterization and spring start-up</li>
              <li>Seasonal lists build automatically each year</li>
              <li>Batch-schedule a whole blowout route to a crew and day</li>
              <li>Auto-text customers their seasonal service date</li>
              <li>Track which properties are done vs. still waiting</li>
              <li>Roll mid-season tune-ups into the same recurring system</li>
              <li>Bill seasonal service with card-on-file in one tap</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Fall Winterization — Due List</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>214</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Accounts Due</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>146</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Scheduled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>68</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Still Waiting</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>$17.1K</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Season Revenue</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Blowout Route — North Side</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew A · Thu · 11 stops</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Scheduled</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Blowout Route — West Side</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Unassigned · 68 still due</div></div>
              <div style={{background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Waiting</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500&ndash;$700 a month for software that nickel-and-dimed us. We built IrrigationBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>129</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited clients, properties, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Line-Item Estimates &amp; Parts Catalog</li>
              <li>Job Board, Scheduling &amp; Crew Dispatch</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Backflow Testing Records</li>
              <li>Seasonal Winterization &amp; Start-Up Tracking</li>
              <li>Mobile App for Crews</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Sprinkler Repair Software &mdash; Common Questions</h2>
          {[
            {q:'Is IrrigationBossPro built for irrigation and sprinkler businesses?', a:'Yes. IrrigationBossPro handles the full irrigation operation: new system installs, valve and head repairs, backflow testing, fall winterizations, and spring start-ups. It runs line-item estimates, a parts catalog, project scheduling, crew dispatch, invoicing, and card-on-file payments — designed for companies doing project and repair work, not general service businesses.'},
            {q:'Can I quote installs and repairs with parts and labor?', a:'Yes. Every estimate supports separate parts and labor lines. Pull heads, valves, controllers, pipe, and backflow devices straight from your catalog with your cost and price, add labor, and the customer sees a clean professional bid while you see your real margin before the truck rolls.'},
            {q:'How does scheduling work for installs, repairs, and blowouts?', a:'Everything lands on the Job Board. Multi-day installs, single-stop repairs, backflow tests, and seasonal blowouts all share one schedule. You assign each job a date, a crew, and a truck, order the day to cut drive time, and dispatch the whole route from one screen.'},
            {q:'Does IrrigationBossPro handle seasonal winterizations and start-ups?', a:'Yes. Tag a customer for fall winterization or spring start-up and IrrigationBossPro tracks who is due each season, builds the list, and queues it on the Job Board. You batch-schedule a whole blowout route to a crew, auto-text customers their date, and bill with card-on-file.'},
            {q:'Can it store backflow test records?', a:'Yes. Log backflow test results, device details, and certification dates on each property record, so when a customer or the city asks who tested the device and when, the answer is one click away.'},
            {q:'How much does IrrigationBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for SMS or scheduling tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>IrrigationBossPro runs installs, repairs, backflow testing, and seasonal service all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>IrrigationBossPro</a> gives you the full platform overview.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Irrigation Business<br />on Software Built for Plumbers.</h2>
        <p>IrrigationBossPro is the only sprinkler repair software built by someone who has actually run installs, repairs, and blowout routes. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
