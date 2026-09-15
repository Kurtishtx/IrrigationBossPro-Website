'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import SignupModal from '../components/SignupModal';
import HeroDemo from '../components/HeroDemo';

/* Canada landing page — the Canadian edition of the homepage, not a stub.
   The whole argument: the Canadian irrigation year is two compressed seasonal
   stampedes (May start-ups, Sept–Oct blowouts racing the first hard freeze)
   with repair season in between — and the software is built for exactly that,
   with customer billing in Canadian dollars native, not bolted on. */

const faqs = [
  {
    q: 'Does IrrigationBossPro bill my customers in Canadian dollars?',
    a: 'Yes — natively. Set your country to Canada in Company Info and connect your own Canadian Stripe account, and every invoice, card-on-file charge, and payment link you send bills in CAD. Your customers see CA$ amounts, pay in CA$, and the money settles into your own Stripe account. There is no currency workaround or third-party add-on involved.',
  },
  {
    q: 'Is the subscription itself billed in Canadian dollars?',
    a: 'No — the IrrigationBossPro subscription is $59 USD per month, and your bank converts it at its exchange rate on your card statement. Your customer-facing side is fully CAD; the one thing priced in US dollars is our subscription.',
  },
  {
    q: 'Does automated customer texting work in Canada?',
    a: 'Yes, with one honest caveat: Canadian carriers require your sending number to be registered before automated texts can go out, so we set up a Canadian sending number for you during onboarding — it is not instant on day one. Email alerts and customer-app notifications work from the moment you sign up, so your customers still hear from you automatically while the number registration completes.',
  },
  {
    q: 'Do scheduling, routing, and the crew app work for Canadian addresses?',
    a: 'Yes — everything works in Canada today. Scheduling, the Job Board, the route map, estimates, customer records, invoicing, the crew mobile app, and the customer app all run on Canadian addresses and Canadian properties right now. This is not a “coming soon to Canada” page.',
  },
  {
    q: 'Is winterization and spring start-up scheduling an extra module?',
    a: 'No. IrrigationBossPro is one flat price — from $59/month with every feature included. Recurring seasonal service, the Job Board, the route map, line-item estimates, invoicing and card-on-file, the crew app, the customer app, and backflow test records are all part of the same plan. No tiers, no per-user fees, no locked features.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — 14 days, full access to every feature, no credit card required to start. If you decide it is not for you, your account simply stops. Nothing is charged.',
  },
];

export default function IrrigationSoftwareCanada() {
  const openTrial = (n: number, el: HTMLElement) => { (window as any).__openSignup?.(n, el); };

  /* FAQPage structured data, built from the same FAQ array rendered below so
     the rich-result markup and the visible answers can never drift apart. */
  useEffect(() => {
    const ID = 'canada-faq-ld';
    if (document.getElementById(ID)) return;
    const s = document.createElement('script');
    s.id = ID;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(s);
    return () => { document.getElementById(ID)?.remove(); };
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --purple-dark:#0f1720; --purple-mid:#0d141c; --purple-deep:#1f2937; --orange:#84cc16; --orange-dark:#4d7c0f; --blue:#bef264; --text:#1a1a2e; --muted:#555; --light-bg:#f8f7fc; --border:#e4e0f0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: var(--text); background: #fff; line-height: 1.6; }
        .hero { background: linear-gradient(135deg, #0f1720 0%, #1f2937 60%, #263445 100%); padding: 100px 40px 80px; text-align: center; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(132,204,22,.15) 0%, transparent 70%); pointer-events: none; }
        .hero-badge { display: inline-block; background: rgba(132,204,22,.15); border: 1px solid rgba(132,204,22,.4); color: var(--orange); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 24px; }
        .hero h1 { color: #fff; font-size: clamp(32px, 5vw, 56px); font-weight: 800; line-height: 1.15; max-width: 880px; margin: 0 auto 20px; }
        .hero h1 span { color: var(--orange); }
        .hero p { color: rgba(255,255,255,.75); font-size: clamp(16px, 2vw, 19px); max-width: 700px; margin: 0 auto 40px; }
        .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-demo { display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.32); color: #fff; font-size: 16px; font-weight: 700; padding: 15px 30px; border-radius: 8px; text-decoration: none; transition: background .18s, border-color .18s, transform .18s; }
        .btn-demo:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.6); transform: translateY(-1px); }
        .btn-demo .btn-demo-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.22); }
        .btn-primary { background: var(--orange); color: #fff; padding: 16px 36px; border-radius: 6px; font-size: 16px; font-weight: 700; text-decoration: none; transition: background .2s, transform .1s; display: inline-block; cursor: pointer; border: none; font-family: inherit; }
        .btn-primary:hover { background: var(--orange-dark); transform: translateY(-1px); }
        .hero-trust { flex-basis: 100%; text-align: center; color: rgba(255,255,255,.75); font-size: 14px; font-weight: 600; margin-top: 16px; letter-spacing: .2px; }
        .hero-trust b { color: var(--orange); font-weight: 800; }
        .hero-stats { display: flex; justify-content: center; gap: 50px; margin-top: 64px; flex-wrap: wrap; }
        .hero-stat-val { color: var(--orange); font-size: 36px; font-weight: 800; }
        .hero-stat-lbl { color: rgba(255,255,255,.6); font-size: 13px; margin-top: 2px; }
        section { padding: 90px 40px; }
        .section-label { display: inline-block; color: var(--orange); font-size: 12px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; margin-bottom: 12px; }
        .section-title { font-size: clamp(26px, 4vw, 40px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; color: var(--text); }
        .section-sub { color: var(--muted); font-size: 17px; max-width: 620px; margin-bottom: 56px; }
        .centered { text-align: center; }
        .centered .section-sub { margin-left: auto; margin-right: auto; }
        .dark-section { background: linear-gradient(135deg, var(--purple-dark) 0%, var(--purple-deep) 100%); color: #fff; }
        .dark-section .section-title { color: #fff; }
        .dark-section .section-sub { color: rgba(255,255,255,.65); }
        .highlight-row { display: flex; align-items: center; gap: 60px; max-width: 1100px; margin: 0 auto; flex-wrap: wrap; }
        .highlight-row.reverse { flex-direction: row-reverse; }
        .highlight-text { flex: 1; min-width: 280px; }
        .highlight-text h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
        .highlight-text p { font-size: 16px; color: var(--muted); margin-bottom: 20px; }
        .highlight-visual { flex: 1; min-width: 280px; background: linear-gradient(135deg, var(--purple-deep) 0%, #263445 100%); border-radius: 14px; padding: 36px 32px; border: 2px solid rgba(132,204,22,.3); }
        .check-list { list-style: none; margin-top: 16px; }
        .check-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--muted); margin-bottom: 12px; }
        .check-list li::before { content: '✓'; background: var(--orange); color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
        .mock-item { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; }
        .mock-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .mock-dot.orange { background: var(--orange); }
        .mock-dot.green { background: #22c55e; }
        .mock-dot.blue { background: var(--blue); }
        .mock-label { color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600; }
        .mock-sub { color: rgba(255,255,255,.45); font-size: 11px; margin-top: 1px; }
        .mock-badge { margin-left: auto; background: var(--orange); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 10px; flex-shrink: 0; }
        .mock-badge.green-badge { background: #16a34a; }
        .mock-badge.blue-badge { background: #2272c3; }
        .lasso-map { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 20px; margin-bottom: 14px; position: relative; min-height: 130px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .lasso-ring { position: absolute; top: 14px; left: 18px; right: 18px; bottom: 14px; border: 2.5px dashed var(--orange); border-radius: 50%; opacity: .7; }
        .lasso-pins { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; position: relative; z-index: 1; }
        .lpin { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
        .lpin.s { background: var(--orange); box-shadow: 0 0 0 3px rgba(132,204,22,.3); }
        .lpin.u { background: rgba(255,255,255,.2); }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .stat-cell { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 12px 14px; }
        .stat-val { color: var(--orange); font-size: 18px; font-weight: 800; }
        .stat-lbl { color: rgba(255,255,255,.42); font-size: 11px; margin-top: 1px; }
        .stat-cell.full { grid-column: span 2; }
        .stat-cell.full .stat-val { color: #fff; font-size: 13px; font-weight: 600; }
        .premium-band { background: linear-gradient(135deg, var(--purple-dark) 0%, #1b2531 100%); padding: 90px 40px; text-align: center; position: relative; overflow: hidden; }
        .premium-band::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(132,204,22,.1) 0%, transparent 65%); pointer-events: none; }
        .premium-band h2 { color: #fff; font-size: clamp(26px, 4vw, 44px); font-weight: 800; line-height: 1.2; max-width: 860px; margin: 0 auto 18px; }
        .premium-band h2 span { color: var(--orange); }
        .premium-band > p { color: rgba(255,255,255,.65); font-size: 17px; max-width: 760px; margin: 0 auto 52px; line-height: 1.8; }
        .premium-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; max-width: 1100px; margin: 0 auto; }
        .premium-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 28px 24px; text-align: left; transition: border-color .2s; }
        .premium-card:hover { border-color: var(--orange); }
        .premium-card-icon { font-size: 28px; margin-bottom: 14px; }
        .premium-card h4 { color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .premium-card p { color: rgba(255,255,255,.52); font-size: 13px; line-height: 1.6; }
        .ca-compare-wrap { max-width: 880px; margin: 0 auto; overflow-x: auto; }
        .ca-compare { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,32,.07); }
        .ca-compare th { padding: 16px 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
        .ca-compare th.us { background: var(--purple-dark); color: var(--orange); }
        .ca-compare th.them { background: var(--light-bg); color: var(--muted); border-bottom: 2px solid var(--border); }
        .ca-compare th:first-child { background: var(--light-bg); color: var(--muted); border-bottom: 2px solid var(--border); }
        .ca-compare td { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--text); vertical-align: top; }
        .ca-compare tr:last-child td { border-bottom: none; }
        .ca-compare td:first-child { font-weight: 700; width: 26%; }
        .ca-compare td.us { color: var(--text); font-weight: 600; background: rgba(132,204,22,.05); }
        .ca-compare td.them { color: #999; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .feature-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 30px 28px; transition: box-shadow .2s, border-color .2s, transform .2s; }
        .feature-card:hover { box-shadow: 0 8px 32px rgba(15,23,32,.1); border-color: var(--orange); transform: translateY(-3px); }
        .feature-icon { font-size: 32px; margin-bottom: 14px; display: block; }
        .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .feature-card p { color: var(--muted); font-size: 14px; line-height: 1.6; }
        .price-card { background: #fff; border: 2px solid var(--border); border-radius: 14px; padding: 36px 32px; position: relative; transition: box-shadow .2s, transform .2s; }
        .price-card:hover { box-shadow: 0 12px 40px rgba(15,23,32,.12); transform: translateY(-4px); }
        .price-card.featured { border-color: var(--orange); background: linear-gradient(180deg, #fff 0%, #fff8f2 100%); }
        .featured-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--orange); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
        .price-tier { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .price-amount { font-size: 48px; font-weight: 800; color: var(--text); line-height: 1; }
        .price-amount sup { font-size: 22px; vertical-align: super; }
        .price-period { color: var(--muted); font-size: 13px; margin-bottom: 24px; margin-top: 4px; }
        .price-desc { color: var(--muted); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
        .price-features { list-style: none; margin-bottom: 32px; }
        .price-features li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text); padding: 6px 0; border-bottom: 1px solid var(--border); }
        .price-features li:last-child { border-bottom: none; }
        .price-features li::before { content: '✓'; color: var(--orange); font-weight: 700; flex-shrink: 0; }
        .price-btn { display: block; text-align: center; padding: 13px; border-radius: 6px; font-weight: 700; font-size: 15px; text-decoration: none; transition: background .2s; cursor: pointer; border: none; width: 100%; font-family: inherit; }
        .price-btn-primary { background: var(--orange); color: #fff; }
        .price-btn-primary:hover { background: var(--orange-dark); }
        .faq-list { max-width: 800px; margin: 0 auto; }
        .faq-item { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 26px 28px; margin-bottom: 16px; }
        .faq-item h3 { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .faq-item p { color: var(--muted); font-size: 15px; line-height: 1.7; }
        .cta-band { background: linear-gradient(135deg, var(--purple-dark) 0%, #263445 100%); text-align: center; padding: 100px 40px; position: relative; overflow: hidden; }
        .cta-band::before { content: ''; position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(132,204,22,.12) 0%, transparent 70%); pointer-events: none; }
        .cta-band h2 { color: #fff; font-size: clamp(28px, 4vw, 46px); font-weight: 800; margin-bottom: 16px; }
        .cta-band p { color: rgba(255,255,255,.7); font-size: 18px; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
        @media (max-width: 700px) {
          nav { padding: 0 20px; } .nav-links { display: none; }
          section { padding: 60px 20px; } .hero { padding: 70px 20px 60px; }
          .premium-band { padding: 64px 20px; }
          .hero-stats { gap: 30px; } .highlight-row, .highlight-row.reverse { flex-direction: column; }
          .ca-compare td.them, .ca-compare th.them { display: none; }
        }
      `}</style>

      <Navbar onTrialClick={(el) => openTrial(1, el)} />

      {/* ═══ PRICE + LIVE DEMO ═══ */}
      <div style={{background:'linear-gradient(135deg, #0f1720 0%, #1f2937 60%, #263445 100%)', padding:'clamp(76px,7vw,80px) clamp(14px,4vw,40px) 0', textAlign:'center'}}>
        <div style={{textAlign:'center', marginBottom:'clamp(22px,3vw,32px)'}}>
          <div style={{display:'inline-flex', alignItems:'baseline', gap:'12px', flexWrap:'wrap', justifyContent:'center', color:'#fff'}}>
            <span style={{fontSize:'clamp(30px,4.6vw,46px)', fontWeight:800, lineHeight:1}}>$59<span style={{fontSize:'.46em', fontWeight:700, color:'rgba(255,255,255,.6)'}}>/month</span></span>
            <span style={{fontSize:'clamp(16px,2.2vw,22px)', fontWeight:800, color:'var(--orange)'}}>&middot; 14-Day Free Trial</span>
          </div>
          <div style={{color:'rgba(255,255,255,.6)', fontSize:'13px', fontWeight:600, marginTop:'7px', letterSpacing:'.3px'}}>No credit card required &middot; Cancel anytime &middot; Bill your customers in Canadian dollars</div>
        </div>
        <HeroDemo />
      </div>

      {/* ═══ HERO ═══ */}
      <div className="hero" style={{paddingTop:'60px'}}>
        <div className="hero-badge">🍁 For Canadian Irrigation &amp; Sprinkler Contractors</div>
        <h1>Irrigation Software Built for<br /><span>The Canadian Season</span></h1>
        <p>Two compressed seasonal stampedes a year &mdash; start-ups in May, blowouts racing the first hard freeze in the fall &mdash; with repair calls stacked in between. IrrigationBossPro schedules the whole book both ways, routes your blowout weeks tight, dispatches your crews, and bills every customer in Canadian dollars. All of it works in Canada today.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <a href="https://my.irrigationbosspro.com/demo.html" className="btn-demo"><span className="btn-demo-dot" />Try the Live Demo</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>from $59/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">CA$</div><div className="hero-stat-lbl">Customer Billing, Native</div></div>
          <div><div className="hero-stat-val">2</div><div className="hero-stat-lbl">Seasonal Rushes, Handled</div></div>
          <div><div className="hero-stat-val">100+</div><div className="hero-stat-lbl">Features Built In</div></div>
          <div><div className="hero-stat-val">0</div><div className="hero-stat-lbl">Apps to Install</div></div>
        </div>
      </div>

      {/* ═══ THE CANADIAN YEAR ═══ */}
      <div className="premium-band">
        <h2>The Canadian Irrigation Year Is Short.<br /><span>Your Software Shouldn&apos;t Waste a Day of It.</span></h2>
        <p>In most of Canada the irrigation season opens in a rush and closes with a deadline. May hits and every customer wants their system on <em>this week</em>. Then September turns, and suddenly every system in your book has to be blown out before the first hard freeze &mdash; hundreds of short stops crammed into a handful of weeks, because a missed winterization isn&apos;t a small miss. It&apos;s a cracked backflow preventer, a split line under the frost, and an angry phone call in April when the water comes back on. In between the two rushes, it&apos;s repair calls: stuck valves, sheared heads, controllers fried by a summer storm. IrrigationBossPro was built around exactly that rhythm &mdash; whole-book seasonal scheduling on both ends of the year, tight routes when every stop is fifteen minutes, dispatch for the repair season in the middle, and invoicing in Canadian dollars the moment the job is done.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🌱</div><h4>May: The Start-Up Rush</h4><p>Roll every property tagged for spring start-up onto the Job Board at once and work the list neighbourhood by neighbourhood &mdash; instead of booking one phone call at a time while the backlog grows.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔧</div><h4>Summer: Repair Season</h4><p>Service calls, head and valve replacements, controller swaps. A Job Board of open tickets, a live route map, and crews dispatched from a phone &mdash; not from a group text.</p></div>
          <div className="premium-card"><div className="premium-card-icon">❄️</div><h4>Fall: The Blowout Race</h4><p>The whole book, blown out before freeze-up. See exactly who&apos;s left, batch the remaining stops into dense routes, and track the list down to zero before the frost gets there first.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>All Year: Paid in CAD</h4><p>Every invoice, card charge, and payment link in Canadian dollars through your own Stripe account. Bill each stop the moment it&apos;s marked complete &mdash; not from the office in November.</p></div>
        </div>
      </div>

      {/* ═══ COMPARISON ═══ */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">See It Before You Commit</span>
          <h2 className="section-title">Most &ldquo;Demos&rdquo; Are a Phone Call.<br />Ours Is at the Top of This Page.</h2>
          <p className="section-sub">The big platforms make you book a call with a sales rep before you see a single screen. We put the live product first &mdash; scroll up and click around it right now. Here&apos;s how the rest of the experience compares.</p>
        </div>
        <div className="ca-compare-wrap">
          <table className="ca-compare">
            <thead>
              <tr><th></th><th className="us">IrrigationBossPro</th><th className="them">The Big-Platform Playbook</th></tr>
            </thead>
            <tbody>
              <tr><td>Seeing the software</td><td className="us">Live demo on this page &mdash; no call, no form</td><td className="them">Book a demo call with a sales rep</td></tr>
              <tr><td>Trying it yourself</td><td className="us">14-day free trial, no credit card</td><td className="them">Trial after the call, if at all</td></tr>
              <tr><td>Pricing</td><td className="us">from $59/month flat &mdash; every feature, unlimited users</td><td className="them">Per-user tiers, add-ons, and upgrade calls</td></tr>
              <tr><td>Billing your customers in CAD</td><td className="us">Native &mdash; set Country to Canada once, done</td><td className="them">Depends &mdash; you get to find out on the sales call</td></tr>
              <tr><td>Seasonal scheduling</td><td className="us">Whole-book start-up &amp; winterization rollover, built in</td><td className="them">Generic recurring jobs you bend into shape</td></tr>
              <tr><td>Contracts</td><td className="us">None &mdash; cancel anytime</td><td className="them">Annual agreements are common</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ SPRING START-UPS ═══ */}
      <section id="spring">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Spring Start-Up Season</span>
            <h2>When May Hits, the Whole Book<br />Wants Water at Once.</h2>
            <p>The first warm week after the frost tables lift, your phone doesn&apos;t stop. Every customer wants their system pressurized, their heads checked, and their controller programmed before the lawn browns off. Booking that one call at a time is how spring gets away from you.</p>
            <p>In IrrigationBossPro, every property that got a blowout last fall is already tagged for a spring start-up. When the season opens, roll the entire list onto the Job Board in one move, batch it into neighbourhood routes, and start working it top to bottom. Customers get notified their start-up is booked &mdash; before most of them even think to call.</p>
            <ul className="check-list">
              <li>Every winterized property carries forward to the spring start-up list automatically</li>
              <li>Roll the whole start-up book onto the Job Board in one click</li>
              <li>Zone counts on every property, so you know how many systems a crew clears per day</li>
              <li>Notes carry over the winter &mdash; valve locations, controller model, the zone that always sticks</li>
              <li>Turn &ldquo;while you&apos;re here&rdquo; finds into line-item repair estimates on the spot</li>
              <li>Bill each start-up in CAD the moment it&apos;s marked complete</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Spring Start-Up List &mdash; Week One</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">14 Birchwood Cres.</div><div className="mock-sub">Start-Up · 7 zones · Notes: master valve slow</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">22 Birchwood Cres.</div><div className="mock-sub">Start-Up · 5 zones</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item" style={{borderColor:'rgba(132,204,22,.5)'}}><div className="mock-dot orange"></div><div><div className="mock-label">31 Birchwood Cres.</div><div className="mock-sub">Start-Up · 9 zones · Add: 2 heads snapped by plow</div></div><div className="mock-badge">In Progress</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">6 Fernhill Bay</div><div className="mock-sub">Start-Up · 6 zones</div></div><div className="mock-badge blue-badge">Up Next</div></div>
            <div style={{marginTop:'14px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px 14px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'18px', fontWeight:800}}>212 start-ups on the book</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'3px'}}>Scheduled in one afternoon &mdash; not three weeks of phone tag</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FALL WINTERIZATION / BLOWOUT ═══ */}
      <section id="winterization" className="dark-section">
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Fall Winterization &amp; Blowouts</span>
            <h2 style={{color:'#fff'}}>Every System in the Book,<br />Blown Out Before Freeze-Up.</h2>
            <p style={{color:'rgba(255,255,255,.7)'}}>In Canada, winterization isn&apos;t a service you offer &mdash; it&apos;s a deadline the weather sets for you. Every system you maintain has to be purged before the first hard freeze, and each stop is short: hook the compressor to the blowout port, cycle the zones until the heads spit mist, shut it down, next driveway. Fifteen minutes a stop &mdash; if the route is tight. An hour of windshield time between stops, and the math stops working.</p>
            <p style={{color:'rgba(255,255,255,.7)'}}>That&apos;s why route density is the whole game in October. IrrigationBossPro shows every property still waiting for its blowout on one map, lets you batch a street or a subdivision into a single day, and counts the list down so nothing slips past freeze-up. Because the one you miss is the one that cracks a backflow preventer over the winter &mdash; and that customer isn&apos;t calling you in April to say thanks.</p>
            <ul className="check-list" style={{marginTop:'16px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Every property tagged for winterization rolls onto the Job Board when fall turns</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Live map of every system still holding water &mdash; batch by street, not by phone call</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag-to-reorder routes built for hundreds of short stops in a few compressed weeks</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Zone counts per stop, so crews know the day&apos;s load before they roll</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Customers notified their blowout is booked &mdash; and when the crew is on the way</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark it done from the truck; the CAD invoice can go out the same minute</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Blowout Season &mdash; Racing the Freeze</div>
            <div className="lasso-map">
              <div className="lasso-ring"></div>
              <div className="lasso-pins">
                <div className="lpin s"></div><div className="lpin s"></div><div className="lpin s"></div>
                <div className="lpin u"></div><div className="lpin s"></div><div className="lpin s"></div>
                <div className="lpin s"></div><div className="lpin u"></div><div className="lpin s"></div>
                <div className="lpin s"></div><div className="lpin s"></div><div className="lpin u"></div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-cell"><div className="stat-val">57</div><div className="stat-lbl">Systems Still Holding Water</div></div>
              <div className="stat-cell"><div className="stat-val">318</div><div className="stat-lbl">Zones Left to Purge</div></div>
              <div className="stat-cell"><div className="stat-val">4 days</div><div className="stat-lbl">Est. Crew Time</div></div>
              <div className="stat-cell"><div className="stat-val">~15 min</div><div className="stat-lbl">Per Stop on a Tight Route</div></div>
              <div className="stat-cell full"><div className="stat-val">Maple Grove &middot; 21 &nbsp;|&nbsp; Riverbend &middot; 18 &nbsp;|&nbsp; Acreages &middot; 18</div><div className="stat-lbl">Remaining Stops by Area</div></div>
            </div>
            <button style={{width:'100%', marginTop:'12px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Schedule All 57 Blowouts →</button>
            <div style={{marginTop:'10px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:'11px'}}>Drops to the Job Board with a full route map</div>
          </div>
        </div>
      </section>

      {/* ═══ REPAIR SEASON ═══ */}
      <section id="repairs">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Between the Peaks</span>
            <h2>Repair Season Is Where the<br />Margin Lives. Run It Like It.</h2>
            <p>June through August, the work changes shape: a stuck zone valve here, three heads sheared by a mower there, a controller that quit after a lightning storm. Repair work pays well &mdash; when the calls get logged, dispatched, and billed instead of living in your voicemail.</p>
            <p>Every service call lands on the Job Board as a ticket with the property&apos;s full system history attached &mdash; what&apos;s been replaced, which zones act up, what the tech found last time. Dispatch it to whoever&apos;s closest on the map, and when the tech marks it done, the parts they used are already on the work order and the invoice is one click away.</p>
            <ul className="check-list">
              <li>Every repair call logged as a Job Board ticket &mdash; nothing lives in voicemail</li>
              <li>Property profiles with zone counts, controller model, and full repair history</li>
              <li>Live route map &mdash; slot the emergency call into whoever&apos;s closest</li>
              <li>Techs log heads, valves, and pipe used right on the work order</li>
              <li>Line-item repair estimates for the bigger finds &mdash; priced from your parts catalog</li>
              <li>Completed repair to CAD invoice in one click, card-on-file if you have it</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Tuesday&apos;s Repair Route &mdash; 8 Tickets</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Zone 4 won&apos;t shut off</div><div className="mock-sub">Diaphragm replaced · 40 min</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">3 heads sheared by mower</div><div className="mock-sub">2 rotors, 1 spray · billed from truck</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item" style={{borderColor:'rgba(132,204,22,.5)'}}><div className="mock-dot orange"></div><div><div className="mock-label">Controller dead after storm</div><div className="mock-sub">Swap quoted as line-item estimate</div></div><div className="mock-badge">In Progress</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">Low pressure, zones 1&ndash;3</div><div className="mock-sub">History: lateral repair here in 2024</div></div><div className="mock-badge blue-badge">Up Next</div></div>
          </div>
        </div>
      </section>

      {/* ═══ BACKFLOW RECORDS ═══ */}
      <section id="backflow" style={{background:'var(--light-bg)'}}>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Backflow Test Records</span>
            <h2>Every Device. Every Test.<br />On File and Findable.</h2>
            <p>If your shop tests backflow devices, the testing is the easy part &mdash; it&apos;s the paperwork that eats the winter. Which devices are due, what the readings were, who tested what, and where last year&apos;s results went when somebody asks for them.</p>
            <p>IrrigationBossPro keeps a record for every device on every property: make and serial number, test dates, readings, pass or fail, and which tech was on it. Due dates surface before they lapse, and the whole history filters by client, device, tech, or date range &mdash; then prints clean when you need to hand it over. No binder, no shoebox of carbon copies.</p>
            <ul className="check-list">
              <li>Every backflow device tracked by property and serial number</li>
              <li>Test readings and pass/fail results logged per visit</li>
              <li>Due dates tracked so retests get booked before they lapse</li>
              <li>Filter the full history by client, device, tech, or date range</li>
              <li>Print-ready reports whenever someone asks for the records</li>
              <li>Device history carries forward season after season</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Backflow Records &mdash; This Season</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>96</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Tests Logged</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>61</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Properties</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>91</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Passed</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>5</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Repairs Needed</div></div>
            </div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">40 Lakeshore Rd. &mdash; PVB</div><div className="mock-sub">Tested &amp; logged · readings on file</div></div><div className="mock-badge green-badge">Passed</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">88 Station St. &mdash; RPZ</div><div className="mock-sub">Failed check valve · repair estimate sent</div></div><div className="mock-badge">Repair</div></div>
          </div>
        </div>
      </section>

      {/* ═══ CAD INVOICING ═══ */}
      <section id="cad-billing">
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Canadian-Dollar Billing</span>
          <h2 className="section-title">Your Customers Pay in CAD.<br />Not a Workaround &mdash; a Setting.</h2>
          <p className="section-sub">Set your country to Canada in Company Info and connect your own Canadian Stripe account. From that moment, every invoice, every card-on-file charge, and every payment link you send bills in Canadian dollars &mdash; and the money settles into your Stripe account, not ours.</p>
        </div>
        <div className="highlight-row">
          <div className="highlight-text">
            <ul className="check-list" style={{marginTop:0}}>
              <li>One setting: Country = Canada in Company Info &mdash; the whole billing side follows</li>
              <li>Invoices, card charges, and payment links all denominated in CA$</li>
              <li>Your own Canadian Stripe account &mdash; your money never routes through us</li>
              <li>Card-on-file: charge the blowout the minute it&apos;s marked done, no chasing</li>
              <li>Deposits on installs, balance on completion &mdash; all in CAD</li>
              <li>Line-item invoices your customers actually understand: heads, valves, zones, labour</li>
            </ul>
            <p style={{marginTop:'20px'}}>Fall is the test. When a crew is clearing forty blowouts a day, invoicing &ldquo;when we get to it&rdquo; means November nights at the desk and December money. With card-on-file, the stop is billed the moment it&apos;s marked complete &mdash; the season&apos;s cash lands while the season is still running.</p>
          </div>
          <div className="highlight-visual" style={{padding:'24px'}}>
            {/* Screenshot slot: public/cad-checkout.png — a real Stripe checkout from the
                founder's own company (Hamann Lawn Care — Invoice #459, CA$9.74). The file
                copy into public/ was blocked in this session; drop the image in and swap
                this block for the <img> + caption. */}
            <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Invoice #1088 &mdash; Fall Winterization</div>
            <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', marginBottom:'10px'}}>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}><span>Winterization &amp; blowout &mdash; 8 zones</span><span>CA$140.00</span></div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}><span>Replace cracked poly riser</span><span>CA$38.00</span></div>
              <div style={{display:'flex', justifyContent:'space-between', color:'#fff', fontSize:'14px', fontWeight:700, paddingTop:'8px', marginTop:'4px'}}><span>Total</span><span style={{color:'var(--orange)'}}>CA$178.00</span></div>
            </div>
            <div style={{background:'#16a34a', borderRadius:'6px', padding:'11px', textAlign:'center', color:'#fff', fontSize:'13px', fontWeight:700}}>✓ Card on file charged &mdash; CA$178.00</div>
            <div style={{marginTop:'10px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:'11px'}}>Billed from the truck, the minute the stop was marked done</div>
          </div>
        </div>
      </section>

      {/* ═══ CREW APP ═══ */}
      <section id="crew-app" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Crew App</span>
          <h2 className="section-title">Your Crew&apos;s Whole Day,<br />On the Phone in Their Pocket.</h2>
          <p className="section-sub">No laptops in the truck, no printed route sheets that are wrong by 9 a.m. Techs open their phone and see their stops in order &mdash; whether it&apos;s a forty-blowout October day or three repair calls across town.</p>
        </div>
        <div className="feature-grid" style={{maxWidth:'1100px'}}>
          <div className="feature-card"><span className="feature-icon">🗺️</span><h3>Today&apos;s Route, In Order</h3><p>Each tech sees only their own stops, sequenced. In blowout season that&apos;s the difference between forty stops and thirty &mdash; nobody is doubling back across town because the list was on paper.</p></div>
          <div className="feature-card"><span className="feature-icon">📋</span><h3>The Work Order, Right There</h3><p>Zone count, controller model, valve locations, and last visit&apos;s notes on every stop. The tech knows the system before the tailgate drops &mdash; no radioing the office to ask.</p></div>
          <div className="feature-card"><span className="feature-icon">🔩</span><h3>Parts Logged at the Curb</h3><p>Heads, valves, fittings, and pipe get logged on the work order as they&apos;re used &mdash; so the invoice matches the job and nothing given away free gets forgotten.</p></div>
          <div className="feature-card"><span className="feature-icon">📸</span><h3>Photos &amp; Notes</h3><p>Before-and-after photos and tech notes attach to the visit. When a customer asks in April what happened in October, the answer is on file with pictures.</p></div>
          <div className="feature-card"><span className="feature-icon">✅</span><h3>Done Means Done</h3><p>One tap marks the stop complete &mdash; the office sees it instantly, the customer can be notified, and the invoice is ready to go while the compressor is still winding down.</p></div>
          <div className="feature-card"><span className="feature-icon">🔒</span><h3>Field Techs See Field Things</h3><p>Role-based access means crews see their stops and work orders &mdash; not your pricing, your client list, or your books. Owner, manager, office, and field each get their own view.</p></div>
        </div>
      </section>

      {/* ═══ CUSTOMER APP ═══ */}
      <section id="customer-app" style={{background:'linear-gradient(135deg,#1c0a33,#12061f)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Your Customers Get an App, Too</span>
          <h2 className="section-title" style={{color:'#fff'}}>Every Customer Gets Their Own App &mdash;<br />You Decide What They See.</h2>
          <p className="section-sub" style={{color:'rgba(255,255,255,.7)'}}>Your customers install a branded app straight from a secure text link &mdash; no app store, no password to forget. They see their visits, their history, and their invoices in Canadian dollars, and app notifications work from day one, everywhere in Canada.</p>
        </div>
        <div style={{maxWidth:'1000px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'14px 40px'}}>
          {[
            'See upcoming visits and full history — what was done, tech notes, and photos',
            'View and pay CA$ invoices from their phone — card on file, one-tap Pay Now',
            'Know their winterization and spring start-up are booked without calling to ask',
            'Update their card, reschedule or skip a visit, contact you, or refer a neighbour',
            'Pick how they hear from you — email or app notifications from day one',
            'Leave a review — or a private “Rate Us” that sends your happy customers to Google & Facebook',
          ].map((t, i) => (
            <div key={i} style={{display:'flex', gap:'10px', alignItems:'flex-start', color:'rgba(255,255,255,.82)', fontSize:'15px', lineHeight:1.6}}>
              <span style={{color:'var(--orange)', fontWeight:800, flexShrink:0}}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
        <p style={{maxWidth:'900px', margin:'34px auto 0', textAlign:'center', color:'#fff', fontSize:'19px', fontWeight:700, lineHeight:1.5}}>You choose exactly what each customer can see &mdash; flip any feature on or off with a single switch.</p>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Simple Pricing</span>
          <h2 className="section-title">One Flat Price.<br />Every Feature. No Surprises.</h2>
          <p className="section-sub">No per-user fees, no add-on modules, no &ldquo;call us&rdquo; tier. The whole platform &mdash; seasonal scheduling, routing, dispatch, estimates, CAD invoicing, the crew app, and the customer app &mdash; is one price.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="price-card featured" style={{width:'100%'}}>
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div className="price-amount"><sup>$</sup>129</div>
            <div className="price-period">per month (USD)</div>
            <div className="price-desc">Every feature. Unlimited clients, properties, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Customer invoicing &amp; payments in Canadian dollars</li>
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Recurring Winterization &amp; Spring Start-Up Scheduling</li>
              <li>Job Board, Calendar &amp; Route Map</li>
              <li>Line-Item Estimates &amp; Parts Catalog</li>
              <li>Crew Dispatch &amp; Mobile Field App</li>
              <li>Customer App with CA$ Invoices</li>
              <li>Backflow Device &amp; Test Records</li>
              <li>Stripe Card-on-File Through Your Own Account</li>
              <li>500 texts/month included (sent + received, US &amp; Canada), +$15 per additional 500</li>
            </ul>
            <button onClick={(e) => openTrial(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px', maxWidth:'560px', marginLeft:'auto', marginRight:'auto'}}>The subscription is billed in US dollars; your bank converts it at its rate on your statement. Your customer-facing billing is fully CAD. No contracts &mdash; cancel anytime.</p>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq">
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Canada FAQ</span>
          <h2 className="section-title">Straight Answers for Canadian Shops</h2>
          <p className="section-sub">The questions Canadian contractors actually ask before signing up &mdash; including the two things we&apos;d rather tell you now than surprise you with later.</p>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className="faq-item" key={i}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <div className="cta-band">
        <h2>The Freeze Doesn&apos;t Wait.<br />Neither Should Your Software.</h2>
        <p>Get the whole book scheduled both ways, the blowout weeks routed tight, and every stop billed in Canadian dollars the day it&apos;s done. Try the full platform free for 14 days &mdash; no credit card, no sales call.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>from $59/mo</b> after</div>
        </div>
      </div>

      <SignupModal />
    </>
  );
}
