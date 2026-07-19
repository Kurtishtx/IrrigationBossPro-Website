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

export default function IrrigationEstimatingSoftware() {
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
        <div className="hero-badge">Built Specifically for Irrigation Contractors</div>
        <h1>Irrigation Estimating Software<br /><span>Built for How Sprinkler Pros Actually Bid</span></h1>
        <p>Most field service software wasn&apos;t built to price a sprinkler system. IrrigationBossPro is built from the ground up for irrigation contractors &mdash; the way you bid line-item installs, count heads and valves, schedule repairs, and run seasonal winterizations is completely different, and your estimating software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Line-Item</div><div className="hero-stat-lbl">Bids With Parts &amp; Labor</div></div>
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
          alt="IrrigationBossPro irrigation estimating software dashboard on laptop showing a line-item sprinkler bid with heads, valves, and controllers, plus the mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Irrigation Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. IrrigationBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need to bid and run a sprinkler business.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📝</div><h4>Line-Item Estimating</h4><p>Build a full sprinkler bid in minutes &mdash; zones, heads, valves, controllers, pipe, fittings, and backflow devices &mdash; each line with its own quantity, part cost, markup, and labor. The total tallies itself as you build it.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts Catalog</h4><p>Store your real prices for spray heads, rotors, valves, controllers, pipe, wire, and backflow assemblies. Drop a part onto an estimate and the cost, markup, and margin are already there &mdash; no more guessing on a notepad in the truck.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, estimate follow-up sequences, payment reminders, and review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, invoicing, charge after the repair, deposit collection, and overdue reports &mdash; the full Stripe integration is wired in. Customers pay instantly and you see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Technician, and Mobile-only roles. Granular permission control so your install crews see only what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your technicians get a mobile-optimized dashboard with their jobs for the day. Complete, reschedule, log parts used, and add notes &mdash; all from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Job Board — Install &amp; Repair Dispatch</span>
            <h2 style={{color:'#fff'}}>Every Install, Repair, and Backflow Test on One Board.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The Job Board is the fastest way to run an irrigation crew we&apos;ve ever built. New-system installs, valve and head repairs, backflow tests, and seasonal start-ups all sit on one board &mdash; with crew, truck, date, and job value calculated in real time before you commit a single technician.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>One board for installs, repairs, backflow tests, and seasonal work</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag a job onto a date and assign the crew and truck in one move</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>See open jobs vs. scheduled jobs at a glance</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Color-coded by job type so multi-day installs never collide with repairs</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Route the day&apos;s stops geographically to cut windshield time</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark jobs complete, partial, or reschedule from the field</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Running total of stops, hours, and revenue for the day</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Built for project work &mdash; not adapted from a one-tech service app</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Job Board — Today</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #84cc16', borderRadius:'10px', opacity:.7}}></div>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['s','s','u','s','s','s','u','s','s','u','s','s','s','u','s','s','s','u','s'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'3px', flexShrink:0, background: t==='s' ? '#84cc16' : 'rgba(255,255,255,.2)', boxShadow: t==='s' ? '0 0 0 3px rgba(132,204,22,.3)' : 'none'}}></div>
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
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Multi-Day Installs</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>$18,400</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Booked Today</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Backflow Tests</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Installs · 3 &nbsp;|&nbsp; Repairs · 6 &nbsp;|&nbsp; Start-Ups · 5</div>
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
          <h2 className="section-title">The Most Capable Irrigation Estimating Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. IrrigationBossPro is the exception. Every screen was designed by people who have actually bid sprinkler systems and turned wrenches on valves &mdash; not UX designers who&apos;ve never been in a valve box. Your team will be building bids confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Load your parts catalog, import your clients and properties, set up your automated alerts, and connect Stripe — most owners are bidding live the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimating, the Job Board, dispatch, the parts catalog, and invoicing are all connected. You\'re not jumping between five different modules or browser tabs. Open a client and the bid, the schedule, and the payment history are right there in one view.'},
            {n:'03', title:'Your Techs Learn It in Minutes', body:'The mobile app your technicians use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property and system info, the parts used, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and seasonal winterization reminders once. After that, IrrigationBossPro handles every notification, every follow-up, and every review request automatically — whether you\'re on a job, in the office, or on vacation.'},
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built to Bid a Sprinkler System</h2>
          <p className="section-sub">Irrigation is not a one-tech, two-hour service call. You&apos;re pricing multi-zone installs by the head and valve, scheduling repair tickets, certifying backflow devices, and running an entire season of winterizations and spring start-ups &mdash; and every one of those needs different numbers.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were bidding our own sprinkler installs, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to price an <strong>eight-zone install</strong> with 42 heads, six valves, a controller, a backflow assembly, and 900 feet of pipe &mdash; and still spit out a clean, professional bid the homeowner could accept with one tap.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t do that well. Because they weren&apos;t built by someone who runs an irrigation business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and IrrigationBossPro is the estimating software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in IrrigationBossPro exists because we needed it on a real install, a real repair ticket, or a real winterization route &mdash; not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Irrigation</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in IrrigationBossPro was built with irrigation workflows in mind &mdash; bidding, parts, scheduling, and seasonal service &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📝', title:'Line-Item Estimates', body:'Build a sprinkler bid line by line — zones, heads, valves, controllers, pipe, fittings, and backflow devices. Each line carries its own quantity, part cost, markup, and labor, and the total tallies itself as you go.'},
            {icon:'📦', title:'Materials &amp; Parts Catalog', body:'Store your real prices for spray heads, rotors, valves, controllers, pipe, wire, and backflow assemblies. Drop a part onto any estimate and the cost, markup, and margin come with it — no notepad math in the truck.'},
            {icon:'🗺️', title:'Crew Dispatch &amp; Routing', body:'See every scheduled job on a map. Reorder stops, group repairs and start-ups geographically, and cut drive time before your crews ever leave the yard.'},
            {icon:'🔁', title:'Recurring Seasonal Service', body:'Set winterizations and spring start-ups to recur every season. IrrigationBossPro flags every customer when fall blowouts or spring turn-ons come due so an entire route never falls through the cracks.'},
            {icon:'💬', title:'Automated Service Alerts', body:'Automatically text customers when a job is scheduled, when your tech is on the way, and when the work is done. Set it once — IrrigationBossPro handles the communication for every install, repair, and start-up.'},
            {icon:'✅', title:'Backflow Test Tracking', body:'Track backflow testing and certification by device and due date. Log the test, store the result, and get reminded when annual certifications come around again so you never miss a renewal.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Collect install deposits, charge after a repair, send invoices, and get paid without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Technicians', body:'Your techs get a mobile-optimized view of their jobs for the day. Mark work complete, reschedule, and log the parts used — right from the truck without calling the office.'},
            {icon:'🏠', title:'Property &amp; System Profiles', body:'Every property has its own record — zone count, head and valve inventory, controller model, backflow device, service history, notes, and photos. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside IrrigationBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install or repair, IrrigationBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔔', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a homeowner doesn\'t respond to your install bid. Let IrrigationBossPro chase the deal so you don\'t have to.'},
            {icon:'💵', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you\'re owed on a repair or install without making uncomfortable calls.'},
            {icon:'👥', title:'Client &amp; Lead Management', body:'Manage existing clients and active prospects side by side. Track bids, service history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert an accepted estimate to an invoice instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes &amp; Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax rates by jurisdiction and let IrrigationBossPro calculate and track tax on every parts-and-labor invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Technician, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck Management', body:'Create truck profiles, assign vehicles to jobs, and track which truck handled each install or repair. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track employee hours per job and generate payroll-ready reports. Know exactly what an install cost you in labor before payday — without running a separate system.'},
            {icon:'📊', title:'Dashboard &amp; Reports', body:'Custom stat cards on your dashboard show today\'s revenue, jobs completed, properties served, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Job scheduled, completed, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text, seasonal service due — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every employee, office staff member, and technician at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients &amp; Properties', body:'No caps on clients, properties, or leads. Whether you have 50 accounts or 5,000 — IrrigationBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3 dangerouslySetInnerHTML={{__html: title}} />
              <p dangerouslySetInnerHTML={{__html: body}} />
            </div>
          ))}
        </div>
      </section>

      {/* ESTIMATING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Irrigation Estimating</span>
            <h2>Price a Full Sprinkler System Line by Line &mdash; Parts, Labor, and Margin in One Bid</h2>
            <p>This is what no generic field service app does well. IrrigationBossPro builds a true line-item irrigation estimate &mdash; every head, valve, controller, foot of pipe, and backflow device priced from your own catalog, with markup and labor on each line and a clean total your customer can accept in one tap. For a full walkthrough of how to build, send, and win irrigation bids inside the software, read <a href="/blogs/irrigation-estimating-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Irrigation Estimating Software: The Complete Guide for Sprinkler Contractors</a>.</p>
            <ul className="check-list">
              <li>Line items for heads, valves, controllers, pipe, and backflow</li>
              <li>Pull parts straight from your catalog with real costs</li>
              <li>Per-line quantity, markup, labor, and margin</li>
              <li>Group an install by zone for clean, readable bids</li>
              <li>Email the estimate and let the homeowner accept in one tap</li>
              <li>Auto follow-up texts go out if they don&apos;t respond</li>
              <li>Convert the accepted bid straight to a scheduled job and invoice</li>
              <li>Summary bar: parts total, labor total, tax, and grand total</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Estimate — 8-Zone Install</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Spray Heads &amp; Rotors</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>42 units · parts + install</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,386</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Zone Valves</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>6 valves + boxes</div></div>
              <div style={{marginLeft:'auto', background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$540</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#bef264', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Smart Controller</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>8-zone Wi-Fi unit</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$310</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Backflow + Pipe &amp; Wire</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>900 ft pipe · assembly</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,240</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'16px', fontWeight:700}}>Parts + labor, tallied for you.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Grand total updates as you build the bid.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEASONAL SERVICE */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Seasonal Recurring Work</span>
            <h2>Winterizations and Spring Start-Ups That Schedule Themselves</h2>
            <p>Irrigation is a seasonal business. IrrigationBossPro keeps your fall winterizations and spring start-ups on the calendar automatically &mdash; every customer flagged when their blowout or turn-on is due, so you book an entire season without re-keying a single account.</p>
            <ul className="check-list">
              <li>Set winterizations and start-ups to recur every season</li>
              <li>Whole-route reminders when fall blowouts come due</li>
              <li>Spring start-up list builds itself from last year&apos;s customers</li>
              <li>Batch-schedule a recurring route to a date and crew</li>
              <li>Per-property notes: zone count, shut-off location, quirks</li>
              <li>Automated &quot;your start-up is scheduled&quot; texts to customers</li>
              <li>Track which accounts are done, due, or still open all season</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Seasonal Service — Fall</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>186</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Winterizations Due</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>124</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Scheduled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>62</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Still to Book</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>$27.9k</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Season Revenue</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Blowout · 6 zones</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>R. Daniels · shut-off in garage</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Scheduled</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Blowout · 10 zones</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>K. Patel · backflow at meter</div></div>
              <div style={{background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Due</div>
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
              <li>Line-Item Estimating With Parts &amp; Labor</li>
              <li>Materials &amp; Parts Catalog</li>
              <li>Job Board, Dispatch &amp; Routing</li>
              <li>Invoices &amp; Stripe Card-on-File Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Backflow Test &amp; Certification Tracking</li>
              <li>Recurring Seasonal Winterizations &amp; Start-Ups</li>
              <li>Mobile App for Technicians</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Irrigation Estimating Software &mdash; Common Questions</h2>
          {[
            {q:'Is IrrigationBossPro built for irrigation and sprinkler contractors?', a:'Yes. IrrigationBossPro handles the full irrigation operation: line-item install bidding, a parts catalog for heads and valves, repair scheduling, backflow test tracking, recurring seasonal winterizations and start-ups, automated customer SMS, and card-on-file payments. It\'s designed for sprinkler companies, not general service businesses.'},
            {q:'Can I build a line-item estimate for a full sprinkler install?', a:'Yes. You add each line — spray heads, rotors, valves, controllers, pipe, wire, and backflow assemblies — pulling parts straight from your catalog with real costs. Every line carries its own quantity, markup, and labor, and the parts total, labor total, tax, and grand total tally themselves as you build the bid.'},
            {q:'Does it track materials and parts pricing?', a:'Yes. Your materials and parts catalog stores your real prices for heads, valves, controllers, pipe, fittings, and backflow devices. Drop a part onto any estimate and its cost, markup, and margin come with it — no more guessing numbers on a notepad in the truck.'},
            {q:'How does scheduling work for installs, repairs, and backflow tests?', a:'Everything lives on the Job Board. New-system installs, valve and head repairs, backflow tests, and seasonal start-ups sit on one board. Drag a job onto a date, assign the crew and truck, and route the day\'s stops geographically to cut drive time.'},
            {q:'Does IrrigationBossPro handle seasonal winterizations and spring start-ups?', a:'Yes. Set winterizations and start-ups to recur every season and IrrigationBossPro flags every customer when their fall blowout or spring turn-on is due. The list builds itself from last year\'s accounts so you can batch-schedule an entire route to a date and crew.'},
            {q:'How much does IrrigationBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for SMS or estimating tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>IrrigationBossPro runs your whole sprinkler business &mdash; install bids, repairs, backflow testing, and seasonal service &mdash; all from one platform. <a href="/" style={{color:'var(--orange)', fontWeight:600}}>IrrigationBossPro</a> &mdash; see the full platform overview.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Bidding Sprinkler Systems<br />on Software Built for Plumbers.</h2>
        <p>IrrigationBossPro is the only irrigation estimating software built by someone who has actually bid an install and turned a valve. Try it free for 14 days.</p>
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
