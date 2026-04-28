import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import './App.css'

const DEFAULT_HOTEL_OPTS = ['The Venetian', 'Bellagio', 'Caesars Palace', 'Resorts World']
const DEFAULT_WEEKEND_OPTS = ['Feb 14-16', 'Feb 21-23', 'Mar 7-9']

const DEFAULT_ACTIVITIES = [
  { emoji: '🥊', title: 'UFC / Boxing', description: 'Check T-Mobile Arena schedule — Vegas fight nights are unmatched', tag: 'sports' },
  { emoji: '🍽️', title: 'Group Dinner', description: "Gordon Ramsay Hell's Kitchen, Nobu, or STK for the big night out", tag: 'food' },
  { emoji: '🎭', title: 'Sphere', description: "If there's a show, you're going. End of discussion.", tag: 'entertainment' },
  { emoji: '🏊', title: 'Pool Day', description: 'Marquee or Wet Republic — day club vibes with the whole crew', tag: 'daytime' },
  { emoji: '🏌️', title: 'Golf', description: 'Wynn Golf Club or Rio Secco for the early risers', tag: 'sports' },
]

const BUDGET_ITEMS_DEFAULT = [
  { label: 'Hotel (per night)', val: 250, isPerNight: true },
  { label: 'Flights (round trip)', val: 350, isPerNight: false },
  { label: 'Food & drinks', val: 300, isPerNight: false },
  { label: 'Entertainment / shows', val: 200, isPerNight: false },
  { label: 'Gambling budget', val: 150, isPerNight: false },
  { label: 'Misc / transport', val: 100, isPerNight: false },
]

const TAG_COLORS = { sports: '#4ecdc4', food: '#ffd93d', entertainment: '#b48eff', daytime: '#6bffb8' }
const TAG_EMOJIS = { sports: '🏆', food: '🍽️', entertainment: '🎭', daytime: '☀️' }

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown() {
  const [time, setTime] = useState({})
  useEffect(() => {
    const target = new Date('2026-02-14T00:00:00')
    const calc = () => {
      const diff = target - Date.now()
      if (diff <= 0) return setTime({ days: 0, hours: 0, mins: 0, secs: 0 })
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="countdown">
      {[['days', 'Days'], ['hours', 'Hrs'], ['mins', 'Mins'], ['secs', 'Secs']].map(([k, label]) => (
        <div key={k} className="countdown-unit">
          <span className="countdown-num">{String(time[k] ?? 0).padStart(2, '0')}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ onNav }) {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-glow g1" /><div className="hero-glow g2" /><div className="hero-glow g3" />
        <div className="hero-grid" /><div className="hero-scanline" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">✈️ THE CREW IS GOING TO</div>
        <h1 className="hero-title">
          <span className="ht-las">LAS</span>
          <span className="ht-vegas">VEGAS</span>
        </h1>
        <div className="hero-subtitle">BABY 🎰</div>
        <p className="hero-tagline">Fresno Family. One Weekend. No Missing Out.</p>
        <Countdown />
        <div className="hero-cta">
          <button className="btn btn-neon" onClick={() => onNav('rsvp')}>Are you in? 🙋</button>
          <button className="btn btn-ghost" onClick={() => onNav('polls')}>Vote on dates & hotel 📊</button>
        </div>
        <div className="nav-pills">
          {[['rsvp', "Who's In"], ['polls', 'Polls'], ['itinerary', 'Activities'], ['budget', 'Budget'], ['chat', 'Chat']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="nav-pill" onClick={e => { e.preventDefault(); onNav(id) }}>{label}</a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────
function RSVP() {
  const [attendees, setAttendees] = useState([])
  const [name, setName] = useState('')
  const [plusOne, setPlusOne] = useState('')
  const [status, setStatus] = useState('in')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    const { data } = await supabase.from('attendees').select('*').order('created_at', { ascending: true })
    if (data) setAttendees(data)
  }

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('attendees-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const submit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    await supabase.from('attendees').insert([{ name: name.trim(), plus_one: plusOne.trim(), status }])
    setName(''); setPlusOne(''); setStatus('in'); setDone(true); setSubmitting(false)
    setTimeout(() => setDone(false), 3000)
  }

  const ins = attendees.filter(a => a.status === 'in')
  const maybes = attendees.filter(a => a.status === 'maybe')
  const outs = attendees.filter(a => a.status === 'out')
  const total = attendees.reduce((acc, a) => acc + 1 + (a.plus_one ? 1 : 0), 0)

  const PersonRow = ({ person }) => (
    <div className="person-row">
      <div className="person-avatar">{person.name[0].toUpperCase()}</div>
      <div>
        <div className="person-name">{person.name}</div>
        {person.plus_one && <div className="person-plus">+ {person.plus_one}</div>}
      </div>
    </div>
  )

  return (
    <section className="section" id="rsvp">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">headcount</div>
          <h2 className="section-title">Who's Coming? 🙋</h2>
          <p className="section-sub">Lock in your spot. Don't be the one who waits too long.</p>
        </div>
        <div className="rsvp-stats">
          <div className="stat-card sc-in"><div className="stat-num">{ins.length}</div><div className="stat-lbl">✅ In</div></div>
          <div className="stat-card sc-maybe"><div className="stat-num">{maybes.length}</div><div className="stat-lbl">🤔 Maybe</div></div>
          <div className="stat-card sc-out"><div className="stat-num">{outs.length}</div><div className="stat-lbl">❌ Out</div></div>
          <div className="stat-card sc-total"><div className="stat-num">{total}</div><div className="stat-lbl">👥 Total</div></div>
        </div>
        <div className="rsvp-grid">
          <div className="rsvp-left">
            {attendees.length === 0 && <div className="rsvp-empty">No RSVPs yet — be the first to lock in 🎰</div>}
            {ins.length > 0 && <div className="rsvp-group rg-in"><div className="rsvp-group-title">✅ In for sure</div>{ins.map(p => <PersonRow key={p.id} person={p} />)}</div>}
            {maybes.length > 0 && <div className="rsvp-group rg-maybe"><div className="rsvp-group-title">🤔 On the fence</div>{maybes.map(p => <PersonRow key={p.id} person={p} />)}</div>}
            {outs.length > 0 && <div className="rsvp-group rg-out"><div className="rsvp-group-title">❌ Can't make it</div>{outs.map(p => <PersonRow key={p.id} person={p} />)}</div>}
          </div>
          <div>
            <div className="card">
              <div className="card-title">Add your RSVP</div>
              <div className="field"><label>Your name</label><input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chris" /></div>
              <div className="field"><label>Bringing a +1? (optional)</label><input className="inp" value={plusOne} onChange={e => setPlusOne(e.target.value)} placeholder="Partner's name" /></div>
              <div className="field">
                <label>Status</label>
                <div className="status-row">
                  {[['in', '✅', "I'm IN", 'sb-in'], ['maybe', '🤔', 'Maybe...', 'sb-maybe'], ['out', '❌', "Can't make it", 'sb-out']].map(([s, icon, label, cls]) => (
                    <button key={s} className={`status-btn ${cls} ${status === s ? 'sb-active' : ''}`} onClick={() => setStatus(s)}>{icon} {label}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-neon btn-full" onClick={submit} disabled={submitting || !name.trim()}>
                {submitting ? 'Submitting...' : '🎰 Lock it in'}
              </button>
              {done && <div className="success-msg">You're on the list! 🎉</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── POLLS ────────────────────────────────────────────────────────────────────
function Polls() {
  const [hotelOpts, setHotelOpts] = useState(DEFAULT_HOTEL_OPTS)
  const [weekendOpts, setWeekendOpts] = useState(DEFAULT_WEEKEND_OPTS)
  const [hotelVotes, setHotelVotes] = useState({})
  const [weekendVotes, setWeekendVotes] = useState({})
  const [selHotel, setSelHotel] = useState(null)
  const [selWeekend, setSelWeekend] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [editingHotel, setEditingHotel] = useState(false)
  const [editingWeekend, setEditingWeekend] = useState(false)
  const [editHotelOpts, setEditHotelOpts] = useState([])
  const [editWeekendOpts, setEditWeekendOpts] = useState([])

  const fetchAll = async () => {
    // Votes
    const { data: hv } = await supabase.from('hotel_votes').select('option')
    const { data: wv } = await supabase.from('weekend_votes').select('option')
    if (hv) { const c = {}; hv.forEach(r => { c[r.option] = (c[r.option] || 0) + 1 }); setHotelVotes(c) }
    if (wv) { const c = {}; wv.forEach(r => { c[r.option] = (c[r.option] || 0) + 1 }); setWeekendVotes(c) }
    // Poll options
    const { data: ho } = await supabase.from('poll_options').select('*').eq('poll_type', 'hotel').order('sort_order')
    const { data: wo } = await supabase.from('poll_options').select('*').eq('poll_type', 'weekend').order('sort_order')
    if (ho && ho.length > 0) setHotelOpts(ho.map(o => o.label))
    if (wo && wo.length > 0) setWeekendOpts(wo.map(o => o.label))
  }

  useEffect(() => {
    // Seed poll options if they don't exist yet
    const seed = async () => {
      const { data: existing } = await supabase.from('poll_options').select('id').limit(1)
      if (!existing || existing.length === 0) {
        await supabase.from('poll_options').insert([
          ...DEFAULT_HOTEL_OPTS.map((label, i) => ({ poll_type: 'hotel', label, sort_order: i })),
          ...DEFAULT_WEEKEND_OPTS.map((label, i) => ({ poll_type: 'weekend', label, sort_order: i })),
        ])
      }
      fetchAll()
    }
    seed()
    const ch = supabase.channel('polls-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_votes' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekend_votes' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const submitVotes = async () => {
    if (!selHotel && !selWeekend) return
    if (selHotel) await supabase.from('hotel_votes').insert([{ option: selHotel }])
    if (selWeekend) await supabase.from('weekend_votes').insert([{ option: selWeekend }])
    setSubmitted(true)
  }

  const saveHotelOpts = async (newOpts) => {
    await supabase.from('poll_options').delete().eq('poll_type', 'hotel')
    await supabase.from('poll_options').insert(newOpts.map((label, i) => ({ poll_type: 'hotel', label, sort_order: i })))
    setEditingHotel(false)
  }

  const saveWeekendOpts = async (newOpts) => {
    await supabase.from('poll_options').delete().eq('poll_type', 'weekend')
    await supabase.from('poll_options').insert(newOpts.map((label, i) => ({ poll_type: 'weekend', label, sort_order: i })))
    setEditingWeekend(false)
  }

  const PollCard = ({ title, sub, opts, votes, selected, onSelect, editing, setEditing, editOpts, setEditOpts, onSave }) => {
    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1
    const maxV = Math.max(...Object.values(votes), 1)
    return (
      <div className="card">
        <div className="poll-heading">{title}</div>
        <div className="poll-sub">{sub}</div>
        <span className="edit-toggle" onClick={() => {
          if (editing) { const valid = editOpts.map(o => o.trim()).filter(Boolean); if (valid.length) onSave(valid) }
          else { setEditOpts([...opts]); setEditing(true) }
        }}>
          {editing ? '✅ Save options' : '✏️ Edit options'}
        </span>
        {editing ? (
          <div>
            {editOpts.map((opt, i) => (
              <div key={i} className="edit-opt-row">
                <input className="edit-opt-inp" value={opt} placeholder="Option name"
                  onChange={e => setEditOpts(prev => prev.map((o, idx) => idx === i ? e.target.value : o))} />
                <button className="del-btn" onClick={() => setEditOpts(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            ))}
            <button className="add-opt-btn" onClick={() => setEditOpts(prev => [...prev, ''])}>+ Add option</button>
          </div>
        ) : (
          <div className="poll-options">
            {opts.map(opt => {
              const v = votes[opt] || 0
              const pct = Math.round((v / total) * 100)
              const isTop = v === maxV && v > 0
              return (
                <div key={opt} className={`poll-opt ${selected === opt ? 'po-sel' : ''} ${isTop ? 'po-lead' : ''}`} onClick={() => onSelect(opt)}>
                  <div className="po-hdr">
                    <span className="po-lbl">{isTop && '👑 '}{opt}</span>
                    <span className="po-cnt">{v} vote{v !== 1 ? 's' : ''} · {pct}%</span>
                  </div>
                  <div className="po-bar-bg"><div className="po-bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="section sec-alt" id="polls">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">have your say</div>
          <h2 className="section-title">Cast Your Vote 📊</h2>
          <p className="section-sub">Where are we staying? When are we going? Democracy decides.</p>
        </div>
        <div className="polls-grid">
          <PollCard title="🏨 Hotel Pick" sub="Where are we posting up?"
            opts={hotelOpts} votes={hotelVotes} selected={selHotel} onSelect={setSelHotel}
            editing={editingHotel} setEditing={setEditingHotel}
            editOpts={editHotelOpts} setEditOpts={setEditHotelOpts} onSave={saveHotelOpts} />
          <PollCard title="📅 Weekend Pick" sub="When works best for the crew?"
            opts={weekendOpts} votes={weekendVotes} selected={selWeekend} onSelect={setSelWeekend}
            editing={editingWeekend} setEditing={setEditingWeekend}
            editOpts={editWeekendOpts} setEditOpts={setEditWeekendOpts} onSave={saveWeekendOpts} />
        </div>
        <div className="polls-submit">
          <button className="btn btn-neon" onClick={submitVotes} disabled={submitted || (!selHotel && !selWeekend)}>
            {submitted ? '✅ Votes submitted!' : '🗳️ Submit my votes'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
function Activities() {
  const [acts, setActs] = useState([])
  const [activeTag, setActiveTag] = useState('all')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTag, setNewTag] = useState('sports')

  const fetchActs = async () => {
    const { data } = await supabase.from('activities').select('*').order('created_at', { ascending: true })
    if (data) setActs(data)
  }

  useEffect(() => {
    fetchActs()
    const ch = supabase.channel('activities-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => fetchActs())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const filtered = activeTag === 'all' ? acts : acts.filter(a => a.tag === activeTag)
  const tags = ['all', ...Object.keys(TAG_COLORS)]

  const addIdea = async () => {
    if (!newTitle.trim()) return
    const { error } = await supabase.from('activities').insert([{
      emoji: TAG_EMOJIS[newTag] || '✨',
      title: newTitle.trim(),
      description: newDesc.trim(),
      tag: newTag
    }])
    if (!error) {
      setNewTitle(''); setNewDesc(''); setActiveTag('all')
      await fetchActs()
    }
  }

  const remove = async (act) => {
    await supabase.from('activities').delete().eq('id', act.id)
    await fetchActs()
  }

  return (
    <section className="section" id="itinerary">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">ideas & plans</div>
          <h2 className="section-title">What Are We Doing? 🎭</h2>
          <p className="section-sub">A running list of things to hit. Add your own ideas below.</p>
        </div>
        <div className="tag-row">
          {tags.map(t => (
            <button key={t} className={`tag-pill ${activeTag === t ? 'tp-active' : ''}`}
              style={activeTag === t && t !== 'all' ? { background: TAG_COLORS[t] + '33', borderColor: TAG_COLORS[t], color: TAG_COLORS[t] } : {}}
              onClick={() => setActiveTag(t)}>
              {t === 'all' ? '🎲 All' : t}
            </button>
          ))}
        </div>
        <div className="activity-grid">
          {filtered.map((a) => (
            <div key={a.id} className="activity-card">
              <button className="ac-remove" onClick={() => remove(a)}>✕</button>
              <span className="ac-emoji">{a.emoji}</span>
              <span className="ac-tag" style={{ background: TAG_COLORS[a.tag] + '22', color: TAG_COLORS[a.tag] }}>{a.tag}</span>
              <div className="ac-title">{a.title}</div>
              <div className="ac-desc">{a.description}</div>
            </div>
          ))}
        </div>
        <div className="add-idea-wrap">
          <span className="add-idea-label">💡 Add an idea to the list</span>
          <div className="add-idea-fields">
            <input className="inp" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What's the activity?" />
            <select className="idea-tag-sel" value={newTag} onChange={e => setNewTag(e.target.value)}>
              <option value="sports">🏆 sports</option>
              <option value="food">🍽️ food</option>
              <option value="entertainment">🎭 entertainment</option>
              <option value="daytime">☀️ daytime</option>
            </select>
          </div>
          <input className="inp" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description (optional)" style={{ marginBottom: '12px' }} />
          <button className="btn btn-neon btn-sm" onClick={addIdea}>+ Add to the list</button>
        </div>
      </div>
    </section>
  )
}

// ─── BUDGET ───────────────────────────────────────────────────────────────────
function Budget() {
  const [nights, setNights] = useState(2)
  const [items, setItems] = useState(BUDGET_ITEMS_DEFAULT.map(i => ({ ...i })))

  const update = (idx, val) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, val: Number(val) || 0 } : item))
  const total = items.reduce((acc, item) => acc + (item.isPerNight ? item.val * nights : item.val), 0)

  return (
    <section className="section sec-alt" id="budget">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">money talk</div>
          <h2 className="section-title">Budget Estimator 💸</h2>
          <p className="section-sub">Map out what the weekend might run you. Totally personal — tweak as needed.</p>
        </div>
        <div className="budget-layout">
          <div className="card">
            <div className="budget-controls" style={{ gridTemplateColumns: '1fr' }}>
              <div className="bc-item">
                <span className="bc-label">🌙 Nights</span>
                <div className="stepper">
                  <button onClick={() => setNights(v => Math.max(1, v - 1))}>−</button>
                  <span className="stepper-val">{nights}</span>
                  <button onClick={() => setNights(v => v + 1)}>+</button>
                </div>
              </div>
            </div>
            <div className="budget-rows">
              {items.map((item, i) => (
                <div key={i} className="b-row">
                  <label>{item.label}{item.isPerNight && <span className="b-note"> /night</span>}</label>
                  <div className="b-inp-wrap">
                    <span className="b-dollar">$</span>
                    <input type="number" className="inp b-inp" value={item.val} onChange={e => update(i, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card budget-result-card">
              <div className="br-label">Your Est. Total</div>
              <div className="br-num">${total.toLocaleString()}</div>
              <div className="br-sub">for {nights} night{nights !== 1 ? 's' : ''}</div>
            </div>
            <div className="budget-note">These are estimates. Vegas has a way of adjusting budgets upward. Plan accordingly. 😅</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function Chat() {
  const [comments, setComments] = useState([])
  const [author, setAuthor] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef(null)

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  useEffect(() => {
    fetchComments()
    const ch = supabase.channel('comments-ch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        setComments(prev => [...prev, payload.new])
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const send = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    await supabase.from('comments').insert([{ author: author.trim() || 'Anonymous', message: message.trim() }])
    setMessage(''); setSubmitting(false)
  }

  return (
    <section className="section" id="chat">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">the group chat</div>
          <h2 className="section-title">The Thread 💬</h2>
          <p className="section-sub">Drop ideas, hype it up, make plans. You know the vibe.</p>
        </div>
        <div className="chat-wrap">
          <div className="chat-messages">
            {comments.length === 0 && <div className="chat-empty">No messages yet — say something! 👋</div>}
            {comments.map(c => (
              <div key={c.id} className="chat-msg">
                <div className="chat-av">{(c.author || '?')[0].toUpperCase()}</div>
                <div className="chat-bubble">
                  <div className="chat-meta">
                    <span className="chat-author">{c.author}</span>
                    <span className="chat-time">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="chat-text">{c.message}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input className="inp chat-name" placeholder="Name" value={author} onChange={e => setAuthor(e.target.value)} />
            <input className="inp chat-msg-inp" placeholder="Say something..." value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
            <button className="btn btn-neon" style={{ flexShrink: 0, padding: '10px 20px' }} onClick={send} disabled={submitting || !message.trim()}>Send</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function StickyNav({ active, onNav }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  return (
    <nav className={`sticky-nav ${scrolled ? 'sn-visible' : ''}`}>
      <div className="sn-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>🎰 VegasCrew</div>
      <div className="sn-links">
        {[['rsvp', "Who's In"], ['polls', 'Polls'], ['itinerary', 'Activities'], ['budget', 'Budget'], ['chat', 'Chat']].map(([id, label]) => (
          <a key={id} href={`#${id}`} className={`sn-link ${active === id ? 'sn-active' : ''}`}
            onClick={e => { e.preventDefault(); onNav(id) }}>{label}</a>
        ))}
      </div>
    </nav>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState('hero')

  const navTo = (id) => {
    setActiveSection(id)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 10)
  }

  useEffect(() => {
    const sections = ['rsvp', 'polls', 'itinerary', 'budget', 'chat']
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { threshold: 0.25 })
    sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app">
      <StickyNav active={activeSection} onNav={navTo} />
      <Hero onNav={navTo} />
      <RSVP />
      <Polls />
      <Activities />
      <Budget />
      <Chat />
      <footer className="footer">
        <div className="footer-inner">
          <span>🎰 VegasCrew 2026</span>
          <span>What happens in Vegas... gets talked about forever</span>
        </div>
      </footer>
    </div>
  )
}
