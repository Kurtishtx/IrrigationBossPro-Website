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

export default function IrrigationBusinessSoftware() {
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
        <div className="hero-badge">Built Specifically for Irrigation</div>
        <h1>Irrigation Business Software<br /><span>Built for How Sprinkler Work Actually Runs</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. IrrigationBossPro is built from the ground up for irrigation and sprinkler companies &mdash; new system installs, valve and head repairs, backflow testing, fall blowouts, and spring start-ups all live in one place, the way you actually bid, schedule, and bill them.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Bids</div><div className="hero-stat-lbl">Line-Item Estimates for Every Install</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'var(--charcoal)', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="IrrigationBossPro irrigation business software dashboard on laptop showing the job board, install estimate, and seasonal service schedule, with the mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Irrigation Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. IrrigationBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📐</div><h4>Line-Item Estimates</h4><p>Build a full sprinkler install bid by zone, head, valve, controller, pipe, and labor &mdash; priced line by line. Email it, let the customer accept with one click, and turn it into a scheduled job and an invoice without re-typing a thing.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts Tracking</h4><p>Heads, rotors, valves, controllers, backflow devices, pipe, fittings, and wire &mdash; track what each job consumes and what it cost. Know your true material margin on every install and repair instead of guessing.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Seasonal Recurring Service</h4><p>Fall winterizations and spring start-ups repeat every year. IrrigationBossPro stores each property on its seasonal list and surfaces them automatically when blowout and start-up season arrives &mdash; nobody gets missed.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, deposits on installs, invoicing, charge after service, payment tracking, overdue reports &mdash; the full Stripe integration is wired in. Customers pay instantly and you see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Technician, and Mobile-only roles. Granular permission control so your install crew only sees what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your techs get a mobile-optimized dashboard with the day&apos;s jobs. Complete, skip, reschedule, log parts used, and add notes &mdash; all from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Job Board — Dispatch &amp; Routing</span>
            <h2 style={{color:'#fff'}}>Every Install, Repair, and Service Call on One Board.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The Job Board is the daily command center for an irrigation company. New system installs, valve and head repairs, backflow tests, winterizations, and start-ups all land in one place. Assign each job to a crew and a truck, order the stops geographically, and send the whole day out the door in minutes instead of an hour on the phone.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Every job type on one board &mdash; installs, repairs, backflow, blowouts, start-ups</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag-and-drop dispatch to any crew, truck, or date</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Order stops geographically so crews aren&apos;t crossing town twice</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>See multi-day install jobs alongside quick service calls</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark jobs complete, skipped, or rescheduled from the field</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Parts and labor flow straight from the estimate onto the job</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Print dispatch sheets for each crew before they roll out</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Summary bar shows the day&apos;s stops, hours, and revenue at a glance</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Job Board — Today</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #84cc16', borderRadius:'12px', opacity:.6}}></div>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['s','s','u','s','s','s','u','s','s','u','s','s','s','u','s','s','s','u','s'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'50%', flexShrink:0, background: t==='s' ? '#84cc16' : 'rgba(255,255,255,.2)', boxShadow: t==='s' ? '0 0 0 3px rgba(132,204,22,.3)' : 'none'}}></div>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>14</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Jobs Scheduled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>3</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Crews Out</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>$9,840</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Revenue Booked</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Multi-Day Installs</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Installs · 2 &nbsp;|&nbsp; Repairs · 5 &nbsp;|&nbsp; Backflow · 3 &nbsp;|&nbsp; Blowouts · 4</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Job Type</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Irrigation Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. IrrigationBossPro is the exception. Every screen was designed by people who have actually run sprinkler installs and chased down a stuck valve &mdash; not UX designers who&apos;ve never opened a valve box. Your team will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your services and parts catalog, import your clients and properties, set up your automated alerts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimates, the Job Board, dispatch, materials, and invoicing are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the Job Board and everything you need for the day is right there in a single view.'},
            {n:'03', title:'Your Techs Learn It in Minutes', body:'The mobile app your crews use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property info, the job notes, the parts list, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and seasonal reminders once. After that, IrrigationBossPro handles every notification, every follow-up, and every winterization reminder automatically — whether you\'re on a job, at home, or on vacation.'},
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Irrigation</h2>
          <p className="section-sub">Irrigation is not plumbing. One day it&apos;s a multi-day install with a truckload of heads, valves, and pipe to bid and track. The next it&apos;s twelve quick repair calls and a backflow test. And every fall the same hundreds of properties need a blowout. Generic software can&apos;t hold all of that.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own irrigation crews, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to bid a <strong>full sprinkler install line by line</strong> &mdash; every zone, head, valve, controller, and foot of pipe &mdash; and then still keep a fall winterization list of hundreds of properties that had to go out the door on time.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs an irrigation business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and IrrigationBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in IrrigationBossPro exists because we needed it on a real install or a real service call. Not because a product manager in a tech office decided it sounded good.</p>
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
            {icon:'📐', title:'Line-Item Install Estimates', body:'Build a full sprinkler install bid by zone, head, valve, controller, pipe, wire, and labor — each line priced and totaled. Email it from the platform and let the client accept with one click.'},
            {icon:'📦', title:'Materials & Parts Catalog', body:'Store every part you use — rotors, sprays, valves, controllers, backflow devices, fittings — with cost and price. Drop them onto any estimate or job and track exactly what each install consumed.'},
            {icon:'🔁', title:'Seasonal Service Lists', body:'Winterizations and spring start-ups repeat every year. Keep each property on its seasonal list and let IrrigationBossPro surface them automatically when blowout and start-up season comes around.'},
            {icon:'🗓️', title:'Job & Project Scheduling', body:'Schedule single-visit repairs and multi-day installs on the same calendar. Assign each job a date, a crew, and a truck, and see your whole week laid out at a glance.'},
            {icon:'🧭', title:'Crew Dispatch & Routing', body:'Assign jobs to crews and order their stops geographically so they\'re not crossing town twice. Send the day out from one board instead of an hour of phone calls.'},
            {icon:'💧', title:'Backflow Testing & Certs', body:'Track backflow tests and certification deadlines per property so nothing lapses. Know which devices are due, which passed, and which need a return visit — all from one list.'},
            {icon:'💬', title:'Automated Service Alerts', body:'Automatically text customers when a job is scheduled, when the crew is on the way, and when the work is done. Set it once — IrrigationBossPro handles the communication for every job.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Collect a deposit on an install, charge after a repair, send invoices, and collect payments without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Technicians', body:'Your crews get a mobile-optimized view of their jobs for the day. Mark jobs complete, log the parts used, and add notes — right from the truck without calling the office.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property has its own record — zones, head and valve locations, controller model, install history, service notes, GPS coordinates, and photos. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside IrrigationBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install or service, IrrigationBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a client doesn\'t respond to an install or repair estimate. Let IrrigationBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you\'re owed on a finished install without making uncomfortable calls.'},
            {icon:'👥', title:'Client & Lead Management', body:'Manage existing clients and active prospects side by side. Track estimates, install history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax rates by jurisdiction and let IrrigationBossPro calculate and track tax on every invoice — material and labor alike.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Technician, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck Management', body:'Create truck profiles, assign vehicles to crews, and track which truck handled each job. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track employee hours per job and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards on your dashboard show today\'s revenue, jobs completed, properties served, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Job scheduled, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every employee, office staff member, and technician at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients & Properties', body:'No caps on clients, properties, or leads. Whether you have 50 accounts or 5,000 — IrrigationBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEDULING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Seasonal Service</span>
            <h2>Never Miss a Winterization or a Spring Start-Up Again</h2>
            <p>This is the side of the business generic software forgets. Every property you blow out in the fall needs a start-up in the spring &mdash; and that same list comes due again the following year. IrrigationBossPro keeps each property on its seasonal service list and surfaces the whole batch automatically when the season turns, so you can dispatch hundreds of blowouts without rebuilding the list by hand. For a closer look at how the platform keeps recurring compliance work on schedule, read <a href="/blogs/backflow-testing-certification-tracking-irrigation-business-software" style={{color:'var(--orange)', fontWeight:600}}>How Irrigation Business Software Tracks Backflow Testing &amp; Certification Deadlines</a>.</p>
            <ul className="check-list">
              <li>Seasonal lists for fall winterizations and spring start-ups</li>
              <li>Whole list resurfaces automatically when the season turns</li>
              <li>Dispatch the batch to crews and trucks in a few clicks</li>
              <li>Assign date, technician, and truck at scheduling time</li>
              <li>Order stops geographically so crews aren&apos;t backtracking</li>
              <li>Mark jobs complete, skipped, or rescheduled from the field</li>
              <li>Print dispatch sheets for each crew</li>
              <li>Summary bar: total stops, hours, and revenue for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Seasonal List — By Service Type</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Fall Winterization</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>312 properties due</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>312 jobs</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Spring Start-Up</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>298 properties due</div></div>
              <div style={{marginLeft:'auto', background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>298 jobs</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#bef264', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Backflow Test Due</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>64 devices due</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>64 tests</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Controller Upgrades</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>18 properties flagged</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>18 jobs</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'16px', fontWeight:700}}>The list builds itself.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No other irrigation software brings the whole season back automatically.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MATERIALS TRACKING */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Margin</span>
            <h2>Track Every Part on Every Install &mdash; and Your Real Margin</h2>
            <p>Irrigation is material-heavy. A single install can run through dozens of heads, valves, a controller, a backflow device, and hundreds of feet of pipe and wire. IrrigationBossPro stores your full parts catalog with cost and price, drops parts onto estimates and jobs, and shows you what each install actually consumed &mdash; so you know your true margin, not a guess.</p>
            <ul className="check-list">
              <li>Full parts catalog: heads, rotors, valves, controllers, backflow, pipe, wire</li>
              <li>Each part carries your cost and your sell price</li>
              <li>Drop parts onto any estimate or job in seconds</li>
              <li>See material cost vs. revenue on every install</li>
              <li>Track what each property&apos;s system is built from</li>
              <li>Filter usage by job, client, part, or date range</li>
              <li>Material and labor totals roll straight into the invoice</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Install Estimate — Materials</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>6</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Zones</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>38</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Heads</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>$2,140</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Material Cost</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>$5,480</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Job Total</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>4&quot; Pop-Up Spray Head × 24</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Zones 1–3 · front &amp; side beds</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$312</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>1&quot; Inline Valve × 6 + Controller</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Manifold · 8-station timer</div></div>
              <div style={{background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$648</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500–$700 a month for software that nickel-and-dimed us. We built IrrigationBossPro to be the pricing we always wished existed.</p>
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
              <li>Job Board, Dispatch &amp; Routing</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Backflow Testing &amp; Cert Tracking</li>
              <li>Seasonal Winterization &amp; Start-Up Lists</li>
              <li>Mobile App for Technicians</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees — ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Irrigation Business Software — Common Questions</h2>
          {[
            {q:'Is IrrigationBossPro built for irrigation and sprinkler businesses?', a:'Yes. IrrigationBossPro handles the full irrigation operation: line-item install estimates, parts and materials tracking, job and project scheduling, crew dispatch, backflow test tracking, seasonal winterization and start-up lists, automated customer SMS, and card-on-file payments. It\'s designed for companies that install and service sprinkler systems, not general service businesses.'},
            {q:'Can I manage installs, repairs, backflow tests, and seasonal service in one platform?', a:'Yes. New system installs, valve and head repairs, backflow testing, fall winterizations, and spring start-ups all live on one Job Board. Each job type carries its own estimate, parts list, and SMS alerts, and seasonal work resurfaces automatically when the season turns.'},
            {q:'How do estimates work for a sprinkler install?', a:'You build the bid line by line — zones, heads, valves, controller, backflow device, pipe, wire, and labor — pulling parts straight from your catalog with cost and price already set. Email it from the platform, let the client accept with one click, and turn the accepted estimate into a scheduled job and an invoice without re-typing anything.'},
            {q:'Does IrrigationBossPro track backflow testing and certification deadlines?', a:'Yes. Each property\'s backflow device is tracked with its test result and certification due date, so you can see which devices are coming due, which passed, and which need a return visit. The whole list surfaces when testing season arrives so nothing lapses.'},
            {q:'Does it handle recurring seasonal work like winterizations and start-ups?', a:'Yes. Every property you blow out in the fall stays on its seasonal list for the spring start-up, and the whole batch resurfaces automatically the following year. You can dispatch hundreds of seasonal jobs to crews and trucks in a few clicks instead of rebuilding the list by hand.'},
            {q:'How much does IrrigationBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for SMS, estimates, or parts tracking, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>IrrigationBossPro runs installs, repairs, backflow testing, and seasonal service &mdash; all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full IrrigationBossPro overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Irrigation Business<br />on Software Built for Plumbers.</h2>
        <p>IrrigationBossPro is the only irrigation management software built by someone who has actually bid a sprinkler install and run a fall blowout route. Try it free for 14 days.</p>
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
