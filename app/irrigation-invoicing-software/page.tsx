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
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Irrigation &amp; Sprinkler" className="sbp-input" />
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

export default function IrrigationInvoicingSoftware() {
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
        <div className="hero-badge">Invoicing Built for Irrigation &amp; Sprinkler Pros</div>
        <h1>Irrigation Invoicing &amp; Billing Software<br /><span>That Bills the Parts and the Labor</span></h1>
        <p>A sprinkler job is never one flat line. It&apos;s heads, valves, a controller, pipe, fittings, a backflow device, and the labor to install it. IrrigationBossPro turns your line-item estimates into clean invoices &mdash; materials, parts, and labor all itemized &mdash; and collects payment with a card on file before your truck leaves the driveway.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Line-Item</div><div className="hero-stat-lbl">Parts &amp; Labor on Every Invoice</div></div>
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
          alt="IrrigationBossPro invoicing software dashboard on laptop showing a line-item sprinkler estimate with heads, valves, and backflow parts, plus card-on-file payment on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Irrigation Billing.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. IrrigationBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature an irrigation contractor actually needs.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📝</div><h4>Line-Item Estimates</h4><p>Build a sprinkler bid with every head, valve, controller, run of pipe, and backflow device priced from your catalog. The estimate the customer approves becomes the invoice they pay &mdash; no re-keying, no math errors.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts</h4><p>Maintain a parts catalog of heads, nozzles, valves, controllers, wire, fittings, and backflow assemblies with your cost and your price. Drop them onto any estimate or invoice in seconds and protect your margin on every install.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Card-on-File Payments</h4><p>Cards on file, invoicing, charge after the job, payment tracking, overdue reports &mdash; the full Stripe integration is wired in. Customers pay the moment the system is running, and you see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Seasonal Recurring Billing</h4><p>Winterizations, blowouts, and spring start-ups bill themselves. Put repeat customers on a seasonal schedule and IrrigationBossPro generates the invoice and the reminder text every fall and every spring.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Customer Texts Built In</h4><p>Two-way SMS inbox, on-the-way alerts, estimate follow-ups, and payment reminders &mdash; all included at the flat price. No Twilio account, no third-party setup, no separate texting app for your office.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🏠</div><h4>Property &amp; Client Profiles</h4><p>Every property keeps its own record &mdash; zones, controller model, backflow device, install history, and past invoices. Walk into any callback knowing exactly what you put in the ground and what it cost.</p></div>
        </div>
      </div>

      {/* INVOICE BUILDER */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Estimate-to-Invoice Engine</span>
            <h2 style={{color:'#fff'}}>The Bid You Sent Becomes the Invoice They Pay.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Most irrigation contractors quote a job in one place, then rebuild the whole thing in another tool when it&apos;s time to bill. IrrigationBossPro kills that double work. Your line-item estimate &mdash; every head, valve, controller, and length of pipe &mdash; converts to an invoice with one click. Add the parts you actually used on site, and the totals, tax, and balance recalculate instantly.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>One-click convert an approved estimate into an invoice</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Itemize materials, parts, and labor as separate lines</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Adjust quantities on site &mdash; totals recalculate automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Apply deposits and progress billing on larger system installs</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Sales tax calculated by jurisdiction on every invoice</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Email the invoice or charge a card on file in seconds</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Filter by unpaid, partial, paid, or overdue at a glance</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No re-keying &mdash; the bid and the bill are the same document</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Invoice #1042 — System Install</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Rotor Heads (Qty 18)</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Materials</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$486</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Zone Valves (Qty 6)</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Materials</div></div>
              <div style={{marginLeft:'auto', background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$312</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Smart Controller &amp; Backflow</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Materials</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$640</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Install Labor (Qty 16 hr)</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Labor</div></div>
              <div style={{marginLeft:'auto', background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,280</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'18px', fontWeight:800}}>$2,932 invoiced</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Straight from the approved estimate.</div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Irrigation Billing Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. IrrigationBossPro is the exception. Every screen was designed by people who have priced sprinkler jobs and chased down past-due invoices &mdash; not UX designers who&apos;ve never set a valve box. Your office and your crew will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Load your parts catalog of heads, valves, and controllers, import your clients and properties, set your tax rates, and connect Stripe. Most owners are billing the same day they sign up. No implementation consultant, no 90-day setup.'},
            {n:'02', title:'Estimate and Invoice Are One Flow', body:'You don\'t quote in one tool and bill in another. The line-item bid you send is the invoice you collect on. Pull up any job and the materials, labor, payments, and balance are all in a single view.'},
            {n:'03', title:'Your Crew Logs Parts From the Truck', body:'The mobile app lets a tech mark a job complete and note the parts actually installed. That flows straight to the invoice, so the office bills the real material used instead of guessing from a paper ticket.'},
            {n:'04', title:'Seasonal Billing Runs Without You', body:'Set up your winterization and spring start-up customers once. After that IrrigationBossPro generates the seasonal invoice and the reminder text every fall and every spring &mdash; whether you\'re on a job, at home, or off the clock.'},
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
          <h2 className="section-title">Generic Invoicing Wasn&apos;t Built for Irrigation</h2>
          <p className="section-sub">Sprinkler work isn&apos;t a flat service fee. A single install carries dozens of parts, a backflow device, controller programming, and hours of labor &mdash; and the same customer comes back every fall for a blowout and every spring for a start-up. Plain invoicing apps can&apos;t hold that.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own irrigation jobs, we tried every billing tool out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to price out <strong>a 6-zone install with 40 line items of parts</strong> and then turn that exact bid into the invoice without rebuilding it from scratch.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They couldn&apos;t do it. Because they weren&apos;t built by someone who quotes valves and chases backflow certifications. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and IrrigationBossPro is the billing system we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature exists because we needed it to get paid on a real sprinkler job &mdash; not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Irrigation Billing</span>
          <h2 className="section-title">Features Designed Around How You Get Paid</h2>
          <p className="section-sub">Every tool in IrrigationBossPro was built with sprinkler invoicing in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📝', title:'Line-Item Estimates', body:'Build a sprinkler bid in minutes with heads, valves, controllers, pipe, and backflow devices priced from your catalog. Email it from the platform and let the customer accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'📦', title:'Materials &amp; Parts Catalog', body:'Keep every head, nozzle, valve, controller, wire, fitting, and backflow assembly in one catalog with your cost and your price. Drop parts onto any estimate or invoice in seconds and protect your margin.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date on the property record.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Charge after the install, send the invoice, and collect without chasing anyone down. Deposits and progress payments on big system jobs handled the same way.'},
            {icon:'🔁', title:'Seasonal Recurring Billing', body:'Put winterization, blowout, and spring start-up customers on a seasonal schedule. IrrigationBossPro generates the invoice and the reminder every fall and spring so no recurring revenue slips through.'},
            {icon:'🗓️', title:'Job &amp; Project Scheduling', body:'Schedule installs, valve repairs, backflow tests, and seasonal service to a date and a crew. See the day\'s board in one view with the parts and property notes attached to each job.'},
            {icon:'📋', title:'The Job Board', body:'Every job waiting to be scheduled sits on one board &mdash; new installs, repairs, backflow certifications, and seasonal service. Assign it to a date and a tech and it drops onto the dispatch view.'},
            {icon:'🚛', title:'Crew Dispatch &amp; Routing', body:'Assign jobs to crews and trucks, order the day\'s stops geographically, and cut windshield time between repair calls and seasonal service across town.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property holds its zones, controller model, backflow device, install history, photos, and past invoices &mdash; everything tied to the address, not just the customer name.'},
            {icon:'👥', title:'Client &amp; Lead Management', body:'Manage existing clients and active prospects side by side. Track estimates, install history, and notes tied to each contact in one searchable database.'},
            {icon:'🛡️', title:'Backflow Test Records', body:'Log each backflow test and certification against the property, with the device, date, and result. Bill the test as a line item and keep the record on file for the next renewal.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive texts with customers directly inside IrrigationBossPro. Full conversation history by contact &mdash; no more billing questions buried in your personal phone.'},
            {icon:'🔔', title:'On-the-Way &amp; Done Alerts', body:'Automatically text customers when a job is scheduled, when your tech is en route, and when the work is complete. Set it once and IrrigationBossPro handles every stop.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'Three automated follow-up texts go out if a client doesn\'t respond to a sprinkler bid. Let IrrigationBossPro chase the install so you don\'t have to.'},
            {icon:'💵', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger three automated reminder texts. Collect on completed installs and repairs without making uncomfortable phone calls.'},
            {icon:'🏷️', title:'Discount Codes &amp; Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax by jurisdiction and let IrrigationBossPro calculate and track tax on every invoice automatically.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed job, IrrigationBossPro automatically sends a Google review request to the customer &mdash; on your schedule, every time, without you lifting a finger.'},
            {icon:'📱', title:'Mobile App for Your Crew', body:'Techs get a mobile view of their jobs for the day. Mark complete, note the parts installed, and add photos &mdash; right from the truck so the office can bill accurately.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track hours per job and generate payroll-ready reports. Know your true labor cost on every install before you set next season\'s install pricing.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Technician, and Mobile roles. Control exactly what each person can see and do &mdash; from full billing access down to field-only.'},
            {icon:'📊', title:'Dashboard &amp; Reports', body:'Stat cards show today\'s revenue, jobs completed, invoices outstanding, money owed, and more &mdash; all at a glance the moment you log in.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every office staffer and technician at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients &amp; Properties', body:'No caps on clients, properties, or leads. Whether you run 50 accounts or 5,000, IrrigationBossPro handles them all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3 dangerouslySetInnerHTML={{__html: title}} />
              <p dangerouslySetInnerHTML={{__html: body}} />
            </div>
          ))}
        </div>
      </section>

      {/* SEASONAL BILLING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Seasonal Recurring Service</span>
            <h2>Bill Every Winterization and Spring Start-Up Without Lifting a Finger</h2>
            <p>Irrigation is a seasonal business, and that&apos;s where the recurring money is. Every fall your customers need a blowout; every spring they need a start-up. IrrigationBossPro puts those repeat customers on a seasonal schedule, generates the invoice and the reminder text on cue, and tracks who has paid &mdash; so an entire route bills itself. For the full breakdown of how this works end to end, read <a href="/blogs/irrigation-invoicing-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Irrigation Invoicing Software: The Complete Guide for Sprinkler Businesses</a>.</p>
            <ul className="check-list">
              <li>Put winterization and start-up customers on a seasonal cycle</li>
              <li>Auto-generate the invoice each fall and each spring</li>
              <li>Reminder texts go out so customers book before the rush</li>
              <li>Charge a card on file the day the service is done</li>
              <li>See exactly who is paid, partial, or overdue at a glance</li>
              <li>Roll repairs and add-on parts onto the seasonal invoice</li>
              <li>Track seasonal revenue against last year on the dashboard</li>
              <li>Never lose a renewal to a forgotten phone call again</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Seasonal Billing — Fall Winterizations</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Winterization / Blowout</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>146 customers due</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$13,140</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Spring Start-Up</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>132 customers scheduled</div></div>
              <div style={{marginLeft:'auto', background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$11,880</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#bef264', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Backflow Certification</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>58 renewals due</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$4,060</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#84cc16', fontSize:'16px', fontWeight:700}}>Invoices generate themselves.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Every season, on schedule, with the reminder text.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTS & MATERIALS */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Parts</span>
            <h2>Bill the Real Parts You Put in the Ground &mdash; and Protect Your Margin</h2>
            <p>An irrigation invoice lives or dies on its parts. IrrigationBossPro keeps a full catalog of heads, valves, controllers, pipe, fittings, and backflow devices with your cost and your price, so every line is billed at the right number and your margin is never left on the truck.</p>
            <ul className="check-list">
              <li>Catalog every head, nozzle, valve, controller, and fitting</li>
              <li>Store your cost and your sell price on each part</li>
              <li>Drop parts onto an estimate or invoice in seconds</li>
              <li>Crews log parts actually installed from the mobile app</li>
              <li>Pipe and wire billed by the foot, devices by the unit</li>
              <li>Tax and totals recalculate as parts are added</li>
              <li>See material vs. labor split on every completed job</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Parts Catalog — On the Invoice</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>240+</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Parts in Catalog</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>1-Click</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Add to Invoice</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>Cost</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>+ Price Stored</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#84cc16', fontSize:'20px', fontWeight:700}}>Auto</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Tax &amp; Totals</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>4&quot; Pop-Up Spray Head</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Cost $4.10 · Price $9.00</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Qty 22</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#84cc16', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>1&quot; PVC Pipe (per ft)</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Cost $0.62 · Price $1.40</div></div>
              <div style={{background:'#84cc16', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>320 ft</div>
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
              <li>Invoicing &amp; Stripe Card-on-File Payments</li>
              <li>Seasonal Recurring Billing &amp; Renewals</li>
              <li>Job Board, Scheduling &amp; Crew Dispatch</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Backflow Test &amp; Certification Records</li>
              <li>Mobile App for Your Crew</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Irrigation Invoicing &amp; Billing — Common Questions</h2>
          {[
            {q:'Is IrrigationBossPro built for irrigation and sprinkler businesses?', a:'Yes. IrrigationBossPro handles the full irrigation operation: line-item estimates for system installs, a parts catalog of heads, valves, and controllers, invoicing with card-on-file payments, seasonal recurring billing for winterizations and start-ups, and backflow test records. It is built for sprinkler contractors, not general service businesses.'},
            {q:'Can I itemize parts and labor on an irrigation invoice?', a:'Yes. Every estimate and invoice is line-item. You add heads, valves, controllers, pipe, fittings, and backflow devices from your catalog, plus labor as its own line. Quantities, tax, and totals recalculate automatically, and the approved estimate converts straight into the invoice with one click.'},
            {q:'How does seasonal billing for winterizations and start-ups work?', a:'You put repeat customers on a seasonal cycle. Each fall IrrigationBossPro generates the winterization invoice and a reminder text, and each spring it does the same for start-ups. You can see who is paid, partial, or overdue at a glance, and charge a card on file the day the service is done.'},
            {q:'Does it track backflow tests and certifications?', a:'Yes. Each backflow test and certification is logged against the property with the device, date, and result, and billed as a line item. The record stays on file so you know exactly when each customer is due for renewal.'},
            {q:'Can my crew log the parts they actually installed?', a:'Yes. From the mobile app a tech marks a job complete and notes the parts used and photos taken. That flows to the invoice so the office bills the real materials installed instead of guessing from a paper ticket.'},
            {q:'How much does IrrigationBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for invoicing, scheduling, or SMS, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>IrrigationBossPro handles invoicing alongside estimates, scheduling, dispatch, and seasonal service &mdash; all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>IrrigationBossPro</a> shows the full platform overview.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Rebuilding Every Sprinkler Bid<br />Just to Send the Invoice.</h2>
        <p>IrrigationBossPro is the only billing software built by someone who has actually priced a sprinkler install and chased down a past-due invoice. Try it free for 14 days.</p>
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
