import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Cross, LayoutDashboard, ListFilter, LogOut, Menu, Moon, Plus,
  Search, Settings2, Sun, Users, UserRoundCheck, X, ArrowUpRight, MessageCircle, ClipboardList, Pencil, Upload, Trash2,
} from 'lucide-react'
import { supabaseConfigured, demoMode, supabase, signIn, signOut, loadData, insertMinister, updateMinister as updateMinisterRecord, insertEvent, deleteEvent as deleteEventRecord, insertAssignment, insertRole, insertEventType, importLegacyRoster, setMinisterActive, deleteMinister as deleteMinisterRecord } from './lib/backend.js'

const STORAGE_KEY = 'ministros-da-palavra-demo-v1'
const DEFAULT_ROLES = ['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']
const DEFAULT_EVENT_TYPES = ['Missa', 'Evento']
function buildMonths() {
  const months = []
  const start = new Date(2026, 4, 1)
  const end = new Date()
  for (let cursor = start; cursor <= new Date(end.getFullYear(), end.getMonth(), 1); cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(cursor).replace('.', '')
    months.push([key, label[0].toLocaleUpperCase('pt-BR') + label.slice(1)])
  }
  return months
}
const MONTHS = buildMonths()
const SAMPLE = {
  roles: DEFAULT_ROLES,
  eventTypes: DEFAULT_EVENT_TYPES,
  ministers: [
    { id: 'p1', name: 'Ana Exemplo', whatsapp: '', active: true },
    { id: 'p2', name: 'Beatriz Exemplo', whatsapp: '', active: true },
    { id: 'p3', name: 'Carlos Exemplo', whatsapp: '', active: true },
    { id: 'p4', name: 'Daniela Exemplo', whatsapp: '', active: true },
    { id: 'p5', name: 'Eduardo Exemplo', whatsapp: '', active: true },
    { id: 'p6', name: 'Fernanda Exemplo', whatsapp: '', active: true },
  ],
  events: [
    { id: 'e1', title: 'Missa dominical', date: '2026-11-08', time: '09:00', kind: 'Missa' },
    { id: 'e2', title: 'Missa de Nossa Senhora', date: '2026-11-15', time: '19:00', kind: 'Missa' },
    { id: 'e3', title: 'Celebração da comunidade', date: '2026-11-22', time: '08:00', kind: 'Evento' },
  ],
  assignments: [
    { id: 'a1', eventId: 'e1', ministerId: 'p1', role: 'Primeira Leitura' },
    { id: 'a2', eventId: 'e1', ministerId: 'p3', role: 'Segunda Leitura' },
    { id: 'a3', eventId: 'e1', ministerId: 'p5', role: 'Comentarista/preces' },
    { id: 'a4', eventId: 'e2', ministerId: 'p2', role: 'Primeira Leitura' },
    { id: 'a5', eventId: 'e2', ministerId: 'p4', role: 'Segunda Leitura' },
    { id: 'a6', eventId: 'e2', ministerId: 'p6', role: 'Comentarista/preces' },
    { id: 'h1', eventId: 'h-may', ministerId: 'p1', role: 'Primeira Leitura', month: '2026-05' },
    { id: 'h2', eventId: 'h-may', ministerId: 'p2', role: 'Segunda Leitura', month: '2026-05' },
    { id: 'h3', eventId: 'h-jun', ministerId: 'p3', role: 'Primeira Leitura', month: '2026-06' },
    { id: 'h4', eventId: 'h-jun', ministerId: 'p4', role: 'Segunda Leitura', month: '2026-06' },
    { id: 'h5', eventId: 'h-jul', ministerId: 'p5', role: 'Primeira Leitura', month: '2026-07' },
    { id: 'h6', eventId: 'h-jul', ministerId: 'p6', role: 'Segunda Leitura', month: '2026-07' },
    { id: 'h7', eventId: 'h-ago', ministerId: 'p2', role: 'Primeira Leitura', month: '2026-08' },
    { id: 'h8', eventId: 'h-ago', ministerId: 'p3', role: 'Segunda Leitura', month: '2026-08' },
    { id: 'h9', eventId: 'h-set', ministerId: 'p4', role: 'Primeira Leitura', month: '2026-09' },
    { id: 'h10', eventId: 'h-set', ministerId: 'p5', role: 'Segunda Leitura', month: '2026-09' },
    { id: 'h11', eventId: 'h-out', ministerId: 'p6', role: 'Primeira Leitura', month: '2026-10' },
  ],
}

function loadDemo() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const value = saved ? JSON.parse(saved) : SAMPLE
    return {
      ...value,
      roles: value.roles?.length ? value.roles : DEFAULT_ROLES,
      eventTypes: value.eventTypes?.length ? value.eventTypes : DEFAULT_EVENT_TYPES,
    }
  } catch {
    return SAMPLE
  }
}
function uid() { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random()}` }
function formatDate(value, options = { day: '2-digit', month: 'long', year: 'numeric' }) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}T12:00:00`))
}
function todayInputValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
function currentMonthKey() { return todayInputValue().slice(0, 7) }
function shiftMonth(key, offset) {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function monthHeading(key) {
  const [year, month] = key.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  return label[0].toLocaleUpperCase('pt-BR') + label.slice(1)
}
function todayLabel() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR') }
function formatShortDate(value) { return formatDate(value, { weekday: 'short', day: '2-digit', month: 'short' }) }
function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase() }
function normalizeMinisterName(value = '') { return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR') }
function dateSort(a, b) { return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`) }
function normalizePhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits
}
function makeWhatsAppUrl(person, event, assignment) {
  const eventTime = event.time?.slice(0, 5) || event.time
  const message = `Olá, ${person.name}! Você está escalado(a) para ${event.title}, no dia ${formatDate(event.date)}, às ${eventTime}, como ${assignment.role}. Obrigado!`
  return `https://wa.me/${normalizePhone(person.whatsapp)}?text=${encodeURIComponent(message)}`
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-heading"><div><span className="eyebrow">MINISTROS DA PALAVRA</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button></div>
      {children}
    </section>
  </div>
}

function App() {
  const [data, setData] = useState(loadDemo)
  const [view, setView] = useState('inicio')
  const [sortMode, setSortMode] = useState('priority')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [modal, setModal] = useState('')
  const [editingMinister, setEditingMinister] = useState(null)
  const [search, setSearch] = useState('')
  const [activeMinistersExpanded, setActiveMinistersExpanded] = useState(true)
  const [inactiveMinistersExpanded, setInactiveMinistersExpanded] = useState(true)
  const [toast, setToast] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showDemo, setShowDemo] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(currentMonthKey)
  const [theme, setTheme] = useState(() => localStorage.getItem('ministros-da-palavra-theme') || 'light')
  const [auth, setAuth] = useState({ status: supabaseConfigured ? 'loading' : demoMode ? 'demo' : 'configuration-error', email: '', error: '' })

  useEffect(() => { if (demoMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151a17' : '#f7f6f0')
    localStorage.setItem('ministros-da-palavra-theme', theme)
  }, [theme])
  useEffect(() => {
    if (!supabaseConfigured) return undefined
    let active = true
    const acceptSession = async (session) => {
      if (!active) return
      if (!session) { setAuth({ status: 'signed-out', email: '', error: '' }); return }
      const role = session.user?.app_metadata?.role
      if (!['admin', 'editor'].includes(role)) {
        setAuth({ status: 'denied', email: session.user?.email || '', error: 'Esta conta ainda não tem acesso autorizado. Peça à administradora para liberar o acesso.' })
        return
      }
      setAuth({ status: 'loading', email: session.user?.email || '', error: '' })
      try {
        const loaded = await loadData()
        if (active) { setData(loaded); setAuth({ status: 'ready', email: session.user?.email || '', error: '' }) }
      } catch (error) {
        if (active) setAuth({ status: 'error', email: session.user?.email || '', error: error.message || 'Não foi possível carregar os dados do Supabase.' })
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => acceptSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => acceptSession(session), 0) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const activeMinisters = data.ministers.filter((person) => person.active)
  const allEvents = [...data.events].sort(dateSort)
  const upcomingEvents = allEvents.filter((event) => new Date(`${event.date}T${event.time}`) >= new Date())
  const nextEvent = upcomingEvents[0]
  const eventsThisMonth = allEvents.filter((event) => event.date.startsWith(calendarMonth))
  const currentEvent = selectedEvent ? data.events.find((event) => event.id === selectedEvent) : null

  const ministerStats = useMemo(() => data.ministers.map((person) => {
    const assignments = data.assignments.filter((assignment) => assignment.ministerId === person.id)
    const monthAssignments = Object.fromEntries(MONTHS.map(([month]) => [month, assignments.filter((assignment) => assignment.month === month || (data.events.find((event) => event.id === assignment.eventId)?.date || '').startsWith(month))]))
    const monthCounts = Object.fromEntries(MONTHS.map(([month]) => [month, monthAssignments[month].length]))
    const lastAssignment = assignments.map((assignment) => assignment.month ? `${assignment.month}-01` : data.events.find((event) => event.id === assignment.eventId)?.date || '').filter(Boolean).sort().at(-1) || ''
    return { ...person, total: assignments.length, monthCounts, monthAssignments, lastAssignment }
  }), [data.ministers, data.assignments, data.events])
  const readStats = ministerStats.filter((person) => person.active)
  const inactivePeople = ministerStats.filter((person) => !person.active).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const priorityPeople = [...readStats].sort((a, b) => a.total - b.total || (a.lastAssignment || '0000-00').localeCompare(b.lastAssignment || '0000-00') || a.name.localeCompare(b.name, 'pt-BR'))
  const displayPeople = sortMode === 'priority' ? priorityPeople : [...readStats].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const filteredPeople = displayPeople.filter((person) => person.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))

  async function persist(change, message, remoteAction) {
    try {
      if (supabaseConfigured) {
        await remoteAction()
        setData(await loadData())
      } else if (demoMode) {
        setData((previous) => change(structuredClone(previous)))
      } else {
        throw new Error('O Supabase não está configurado nesta publicação.')
      }
      setToast(message)
      return true
    } catch (error) {
      setToast(`Não foi possível salvar: ${error.message || 'erro de conexão'}`)
      return false
    }
  }
  function addMinister(form) {
    persist((next) => ({ ...next, ministers: [...next.ministers, { id: uid(), name: form.name.trim(), whatsapp: form.whatsapp.trim(), active: true }] }), 'Ministro cadastrado.', () => insertMinister(form)).then((saved) => saved && setModal(''))
  }
  function saveMinisterEdits(form) {
    const person = editingMinister
    if (!person) return
    persist((next) => ({ ...next, ministers: next.ministers.map((p) => p.id === person.id ? { ...p, name: form.name.trim(), whatsapp: form.whatsapp.trim() } : p) }), 'Dados do ministro atualizados.', () => updateMinisterRecord(person.id, form)).then((saved) => {
      if (saved) { setModal(''); setEditingMinister(null) }
    })
  }
  function addEvent(form) {
    const id = uid()
    let remoteId = id
    persist((next) => ({ ...next, events: [...next.events, { id, ...form }] }), 'Evento criado.', async () => { remoteId = await insertEvent(form) }).then((saved) => {
      if (!saved) return
      setSelectedEvent(remoteId)
      setView('eventos')
      setModal('')
    })
  }
  function removeEvent(event) {
    if (!window.confirm(`Excluir permanentemente "${event.title}"? Todas as escalações deste evento também serão apagadas. Essa ação não pode ser desfeita.`)) return
    persist(
      (next) => ({ ...next, events: next.events.filter((item) => item.id !== event.id), assignments: next.assignments.filter((assignment) => assignment.eventId !== event.id) }),
      'Evento e escalações excluídos.',
      () => deleteEventRecord(event.id),
    ).then((saved) => {
      if (saved) { setSelectedEvent(null); setView('eventos') }
    })
  }
  function addAssignment(form) {
    persist((next) => ({ ...next, assignments: [...next.assignments, { id: uid(), eventId: currentEvent.id, ministerId: form.ministerId, role: form.role }] }), 'Pessoa adicionada à escala; a prioridade foi atualizada.', () => insertAssignment({ ...form, eventId: currentEvent.id })).then((saved) => saved && setModal(''))
  }
  function deactivate(person) {
    if (!window.confirm(`Inativar ${person.name}? O histórico será mantido.`)) return
    persist((next) => ({ ...next, ministers: next.ministers.map((p) => p.id === person.id ? { ...p, active: false } : p) }), 'Ministro inativado; histórico preservado.', () => setMinisterActive(person.id, false))
  }
  function activate(person) {
    persist((next) => ({ ...next, ministers: next.ministers.map((p) => p.id === person.id ? { ...p, active: true } : p) }), 'Ministro reativado e incluído novamente no rodízio.', () => setMinisterActive(person.id, true))
  }
  function removeInactiveMinister(person) {
    const confirmed = window.confirm(`Excluir permanentemente ${person.name}? As escalas (inclusive futuras) e o histórico mensal dessa pessoa também serão apagados. Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    persist(
      (next) => ({
        ...next,
        ministers: next.ministers.filter((minister) => minister.id !== person.id),
        assignments: next.assignments.filter((assignment) => assignment.ministerId !== person.id),
      }),
      'Ministro e histórico associado excluídos.',
      () => deleteMinisterRecord(person.id),
    )
  }
  function addRole(name) {
    const roleName = name.trim()
    if (!roleName || data.roles.some((role) => role.toLocaleLowerCase('pt-BR') === roleName.toLocaleLowerCase('pt-BR'))) {
      setToast(roleName ? 'Esse papel já está cadastrado.' : 'Informe o nome do papel.')
      return false
    }
    return persist((next) => ({ ...next, roles: [...next.roles, roleName] }), 'Novo papel cadastrado.', () => insertRole(roleName))
  }
  function addEventType(name) {
    const typeName = name.trim()
    if (!typeName || data.eventTypes.some((type) => type.toLocaleLowerCase('pt-BR') === typeName.toLocaleLowerCase('pt-BR'))) {
      setToast(typeName ? 'Esse tipo de evento já está cadastrado.' : 'Informe o nome do tipo de evento.')
      return false
    }
    return persist((next) => ({ ...next, eventTypes: [...next.eventTypes, typeName] }), 'Novo tipo de evento cadastrado.', () => insertEventType(typeName))
  }
  async function importRoster(ministers) {
    const result = await importLegacyRoster(ministers)
    setData(await loadData())
    setModal('')
    setToast(`${result.ministers} ministros e ${result.history} participações históricas importados.`)
    return result
  }
  function navigate(nextView) { setView(nextView); setMobileMenu(false); setSelectedEvent(null); setSearch('') }

  const navItems = [
    { id: 'inicio', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'eventos', label: 'Eventos e escalas', icon: CalendarDays },
    { id: 'ministros', label: 'Ministros', icon: Users },
    { id: 'rodizio', label: 'Rodízio mensal', icon: ClipboardList },
    { id: 'configuracoes', label: 'Configurações', icon: Settings2 },
  ]

  if (!supabaseConfigured && !demoMode) return <ConfigurationGate />
  if (supabaseConfigured && auth.status !== 'ready') return <AuthGate status={auth.status} email={auth.email} error={auth.error} onSignIn={async (email, password) => {
    try { await signIn(email, password); setAuth({ status: 'loading', email, error: '' }) }
    catch (error) { setAuth({ status: 'signed-out', email, error: error.message || 'Confira o e-mail e a senha.' }) }
  }} onSignOut={signOut} />

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Cross size={24} strokeWidth={2.5} /></div><div><strong>Ministros<br />da Palavra</strong><span>Organização da liturgia</span></div><button className="mobile-close icon-button" onClick={() => setMobileMenu(false)}><X size={18} /></button></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav>{navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={19} /><span>{item.label}</span>{item.id === 'eventos' && upcomingEvents.length > 0 && <small>{upcomingEvents.length}</small>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="side-note"><div className="side-note-icon"><CircleHelp size={17} /></div><strong>Um rodízio mais justo</strong><p>Quem foi escalado menos vezes e está há mais tempo sem oportunidade tem prioridade.</p></div>
      <div className="user-card"><div className="avatar avatar-admin">{supabaseConfigured ? initials(auth.email) : 'LP'}</div><div><strong>{supabaseConfigured ? auth.email : 'Equipe de Liturgia'}</strong><span>{supabaseConfigured ? 'Sessão autorizada' : 'Modo demonstração'}</span></div><button className="icon-button tiny" title={supabaseConfigured ? 'Sair da conta' : 'Configurações'} onClick={() => supabaseConfigured ? signOut() : setToast('Configurações serão adicionadas em uma próxima etapa.')}>{supabaseConfigured ? <LogOut size={16} /> : <Settings2 size={16} />}</button></div>
    </aside>
    {mobileMenu && <button className="sidebar-scrim" onClick={() => setMobileMenu(false)} aria-label="Fechar menu" />}

    <main className="main-area">
      <header className="topbar"><button className="menu-button icon-button" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="breadcrumb"><span>Liturgia</span><ChevronRight size={15} /><strong>{navItems.find((item) => item.id === view)?.label || 'Eventos e escalas'}</strong></div><div className="topbar-actions"><div className="today-label"><CalendarDays size={16} />{formatDate(todayInputValue(), { day: '2-digit', month: 'long', year: 'numeric' })}</div><button className="icon-button theme-toggle" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')} title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-button notification" title="Notificações"><Bell size={18} /><i /></button><div className="avatar avatar-top">{supabaseConfigured ? initials(auth.email) : 'LP'}</div></div></header>
      <div className="page-content">
        {demoMode && showDemo && <div className="demo-banner"><span><strong>Modo demonstração</strong> — os dados exibidos são exemplos salvos somente neste navegador.</span><button onClick={() => setShowDemo(false)} aria-label="Fechar aviso"><X size={15} /></button></div>}
        {view === 'inicio' && <>
          <div className="page-heading"><div><span className="eyebrow">{todayLabel()}</span><h1>Bom dia, equipe <span>☀️</span></h1><p>Veja o que vem pela frente e organize a próxima escala.</p></div><button className="button button-primary" onClick={() => setModal('event')}><Plus size={17} /> Novo evento</button></div>
          <section className="stats-grid">
            <StatCard label="Ministros ativos" value={activeMinisters.length} icon={<Users size={18} />} detail="pessoas no rodízio" tone="green" />
            <StatCard label={`Eventos em ${monthHeading(calendarMonth).toLocaleLowerCase('pt-BR')}`} value={eventsThisMonth.length} icon={<CalendarDays size={18} />} detail="na agenda do mês" tone="blue" />
            <StatCard label="Total de escalações" value={data.assignments.length} icon={<Check size={18} />} detail="no histórico e na agenda" tone="gold" />
            <StatCard label="Próxima celebração" value={nextEvent ? formatDate(nextEvent.date, { day: '2-digit', month: 'short' }) : '—'} icon={<Clock3 size={18} />} detail={nextEvent ? `às ${nextEvent.time}` : 'sem evento agendado'} tone="rose" />
          </section>
          <div className="dashboard-grid">
            <section className="panel next-panel"><PanelHeading title="Próximo evento" subtitle="Prepare a escala da próxima celebração." action={<button className="text-link" onClick={() => navigate('eventos')}>Ver agenda <ArrowUpRight size={15} /></button>} />
              {nextEvent ? <div className="next-event-card"><div className="event-date-tile"><span>{formatDate(nextEvent.date, { month: 'short' }).toUpperCase().replace('.', '')}</span><strong>{new Date(`${nextEvent.date}T12:00:00`).getDate()}</strong></div><div className="next-event-main"><span className="pill pill-green">{nextEvent.kind}</span><h3>{nextEvent.title}</h3><div className="event-meta"><span><CalendarDays size={14} />{formatDate(nextEvent.date, { weekday: 'long', day: '2-digit', month: 'long' })}</span><span><Clock3 size={14} />{nextEvent.time}</span></div><div className="assignment-peek">{data.assignments.filter((a) => a.eventId === nextEvent.id).length ? data.assignments.filter((a) => a.eventId === nextEvent.id).slice(0, 3).map((assignment) => { const person = data.ministers.find((p) => p.id === assignment.ministerId); return <div className="peek-person" key={assignment.id}><span className="mini-avatar">{initials(person?.name)}</span><span>{person?.name}</span><small>{assignment.role}</small></div> }) : <div className="empty-inline">Nenhum ministro escalado ainda.</div>}</div></div><button className="button button-outline" onClick={() => { setSelectedEvent(nextEvent.id); setView('eventos') }}>Abrir escala <ChevronRight size={16} /></button></div> : <EmptyState text="Cadastre o primeiro evento da comunidade." action="Novo evento" onClick={() => setModal('event')} />}
            </section>
            <section className="panel priority-panel"><PanelHeading title="Prioridade do rodízio" subtitle="Quem deve ter preferência na próxima escala." action={<button className="text-link" onClick={() => navigate('rodizio')}>Ver todos <ArrowUpRight size={15} /></button>} />
              <div className="priority-list">{priorityPeople.slice(0, 5).map((person, index) => <div className="priority-row" key={person.id}><span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="avatar person-avatar">{initials(person.name)}</span><div className="priority-person"><strong>{person.name}</strong><span>{person.lastAssignment ? `Última escala: ${formatMonth(person.lastAssignment)}` : 'Ainda sem escala'}</span></div><span className="read-count"><strong>{person.total}</strong><small>escalas</small></span></div>)}</div>
            </section>
          </div>
          <section className="panel agenda-panel"><PanelHeading title="Agenda da comunidade" subtitle="Próximas celebrações e eventos." action={<button className="text-link" onClick={() => navigate('eventos')}>Agenda completa <ArrowUpRight size={15} /></button>} />
            <div className="agenda-list">{upcomingEvents.slice(0, 3).map((event) => <EventListRow key={event.id} event={event} people={data.ministers} assignments={data.assignments.filter((a) => a.eventId === event.id)} onOpen={() => { setSelectedEvent(event.id); setView('eventos') }} />)}</div>
          </section>
        </>}

        {view === 'eventos' && <>
          <div className="page-heading"><div><span className="eyebrow">CALENDÁRIO DA COMUNIDADE</span><h1>{currentEvent ? currentEvent.title : 'Eventos e escalas'}</h1><p>{currentEvent ? `${formatDate(currentEvent.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} · ${currentEvent.time}` : 'Cadastre celebrações e organize quem serve em cada uma.'}</p></div><div className="heading-actions">{currentEvent && <><button className="button button-outline" onClick={() => setSelectedEvent(null)}><ChevronLeft size={17} /> Voltar à agenda</button><button className="button button-danger" onClick={() => removeEvent(currentEvent)}><Trash2 size={15} /> Excluir evento</button></>}<button className="button button-primary" onClick={() => setModal(currentEvent ? 'assignment' : 'event')}><Plus size={17} /> {currentEvent ? 'Adicionar ministro' : 'Novo evento'}</button></div></div>
          {currentEvent ? <EventDetail event={currentEvent} data={data} onAdd={() => setModal('assignment')} /> : <section className="panel calendar-panel"><div className="calendar-toolbar"><div className="month-picker"><button className="icon-button" aria-label="Mês anterior" onClick={() => setCalendarMonth((month) => shiftMonth(month, -1))}><ChevronLeft size={18} /></button><strong>{monthHeading(calendarMonth)}</strong><button className="icon-button" aria-label="Próximo mês" onClick={() => setCalendarMonth((month) => shiftMonth(month, 1))}><ChevronRight size={18} /></button></div><div className="legend"><span><i className="legend-dot planned" /> Pessoas escaladas</span></div></div><div className="event-card-grid">{eventsThisMonth.map((event) => <EventCard key={event.id} event={event} data={data} onOpen={() => setSelectedEvent(event.id)} />)}<button className="add-event-card" onClick={() => setModal('event')}><span><Plus size={20} /></span><strong>Adicionar evento</strong><small>Cadastre uma missa ou atividade</small></button></div></section>}
        </>}

        {view === 'ministros' && <>
          <div className="page-heading"><div><span className="eyebrow">CADASTRO DA EQUIPE</span><h1>Ministros da palavra</h1><p>Gerencie os ministros ativos e os contatos para envio das escalas.</p></div><button className="button button-primary" onClick={() => setModal('minister')}><Plus size={17} /> Novo ministro</button></div>
          <section className="panel roster-panel">
            <div className="table-toolbar">
              <div><strong>{activeMinisters.length} ministros ativos</strong><span>Os dados de demonstração não são contatos reais.</span></div>
              <div className="table-toolbar-actions">
                {activeMinistersExpanded && <label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ministro" /></label>}
                <button className="button button-outline button-small table-collapse-toggle" aria-controls="active-ministers-table" aria-expanded={activeMinistersExpanded} aria-label={activeMinistersExpanded ? 'Minimizar tabela de ministros ativos' : 'Mostrar tabela de ministros ativos'} onClick={() => setActiveMinistersExpanded((expanded) => !expanded)}><ChevronDown className={activeMinistersExpanded ? 'collapse-chevron expanded' : 'collapse-chevron'} size={15} />{activeMinistersExpanded ? 'Minimizar' : 'Mostrar tabela'}</button>
              </div>
            </div>
            <div className="table-wrap" id="active-ministers-table" hidden={!activeMinistersExpanded}><table className="people-table"><thead><tr><th>MINISTRO</th><th>WHATSAPP</th><th>ESCALAÇÕES</th><th>ÚLTIMA ESCALA</th><th>PRIORIDADE</th><th></th></tr></thead><tbody>{filteredPeople.map((person, index) => <tr key={person.id}><td><div className="table-person"><span className="avatar person-avatar">{initials(person.name)}</span><strong>{person.name}</strong></div></td><td>{person.whatsapp ? <a className="phone-link" href={`https://wa.me/${normalizePhone(person.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle size={15} />{person.whatsapp}</a> : <span className="muted">Não informado</span>}</td><td><span className="count-chip">{person.total}</span></td><td>{person.lastAssignment ? formatMonth(person.lastAssignment) : <span className="muted">Sem escala</span>}</td><td><span className={`priority-tag ${index < 3 ? 'high' : ''}`}>{index < 3 ? `#${index + 1} · Prioridade` : `#${index + 1}`}</span></td><td><div className="row-actions"><button className="row-menu" title="Editar ministro" onClick={() => { setEditingMinister(person); setModal('edit-minister') }}><Pencil size={15} /></button><button className="row-menu" title="Inativar ministro" onClick={() => deactivate(person)}><ChevronDown size={17} /></button></div></td></tr>)}</tbody></table>{filteredPeople.length === 0 && <EmptyState text="Nenhum ministro encontrado." />}</div>
          </section>
          <section className="panel roster-panel inactive-roster">
            <PanelHeading title="Ministros inativados" subtitle={`${inactivePeople.length} pessoa(s) fora do rodízio; o histórico foi preservado.`} action={<button className="button button-outline button-small table-collapse-toggle" aria-controls="inactive-ministers-table" aria-expanded={inactiveMinistersExpanded} aria-label={inactiveMinistersExpanded ? 'Minimizar tabela de ministros inativos' : 'Mostrar tabela de ministros inativos'} onClick={() => setInactiveMinistersExpanded((expanded) => !expanded)}><ChevronDown className={inactiveMinistersExpanded ? 'collapse-chevron expanded' : 'collapse-chevron'} size={15} />{inactiveMinistersExpanded ? 'Minimizar' : 'Mostrar tabela'}</button>} />
            <div className="table-wrap" id="inactive-ministers-table" hidden={!inactiveMinistersExpanded}>{inactivePeople.length ? <table className="people-table"><thead><tr><th>MINISTRO</th><th>WHATSAPP</th><th>ESCALAÇÕES HISTÓRICAS</th><th>ÚLTIMA ESCALA</th><th></th></tr></thead><tbody>{inactivePeople.map((person) => <tr key={person.id}><td><div className="table-person"><span className="avatar person-avatar">{initials(person.name)}</span><strong>{person.name}</strong></div></td><td>{person.whatsapp || <span className="muted">Não informado</span>}</td><td><span className="count-chip">{person.total}</span></td><td>{person.lastAssignment ? formatMonth(person.lastAssignment) : <span className="muted">Sem escala</span>}</td><td><div className="row-actions"><button className="button button-outline button-small" onClick={() => activate(person)}><UserRoundCheck size={15} /> Reativar</button><button className="button button-danger button-small" title="Excluir ministro permanentemente" onClick={() => removeInactiveMinister(person)}><Trash2 size={14} /> Excluir</button></div></td></tr>)}</tbody></table> : <EmptyState text="Nenhum ministro inativado." />}</div>
          </section>
        </>}

        {view === 'rodizio' && <>
          <div className="page-heading"><div><span className="eyebrow">HISTÓRICO DE ESCALAÇÕES</span><h1>Rodízio mensal</h1><p>Veja em quais meses cada pessoa foi escalada e quem recebeu menos oportunidades.</p></div></div>
          <section className="panel rotation-panel"><div className="rotation-toolbar"><div className="sort-explainer"><div className="sort-icon"><ListFilter size={18} /></div><div><strong>Como ordenar a lista</strong><span>Veja em ordem alfabética ou por prioridade do rodízio.</span></div></div><div className="segmented"><button className={sortMode === 'priority' ? 'selected' : ''} onClick={() => setSortMode('priority')}>Prioridade</button><button className={sortMode === 'alphabetical' ? 'selected' : ''} onClick={() => setSortMode('alphabetical')}>A–Z</button></div></div><div className="legend rotation-legend"><span><i className="legend-dot complete" /> Escalado no mês</span><span><i className="legend-dot not-read" /> Sem escala no mês</span></div><div className="table-wrap rotation-table-wrap"><table className="rotation-table"><thead><tr><th className="sticky-col">MINISTRO</th>{MONTHS.map(([month, short]) => <th key={month}>{short}<small>{month.slice(0, 4)}</small></th>)}<th>TOTAL DE ESCALAÇÕES</th><th>ÚLTIMA ESCALA</th></tr></thead><tbody>{filteredPeople.map((person, index) => <tr key={person.id}><td className="sticky-col"><div className="rotation-person"><span className="avatar person-avatar">{initials(person.name)}</span><span><strong>{person.name}</strong><small>{sortMode === 'priority' ? `Prioridade ${index + 1}` : 'Ministro ativo'}</small></span></div></td>{MONTHS.map(([month]) => <td key={month}><MonthlyAssignmentsCell month={month} assignments={person.monthAssignments[month] || []} events={data.events} /></td>)}<td><strong className="total-cell">{person.total}</strong></td><td>{person.lastAssignment ? formatMonth(person.lastAssignment) : <span className="muted">Sem escala</span>}</td></tr>)}</tbody></table></div><div className="table-footnote"><CircleHelp size={15} /> A prioridade diminui assim que a pessoa é adicionada a uma escala, mesmo que o evento ainda vá acontecer.</div></section>
        </>}

        {view === 'configuracoes' && <>
          <div className="page-heading"><div><span className="eyebrow">PREFERÊNCIAS DA EQUIPE</span><h1>Configurações</h1><p>Cadastre eventos e mantenha os papéis disponíveis na escala.</p></div></div>
          <div className="settings-grid">
            <section className="panel settings-events"><PanelHeading title="Eventos cadastrados" subtitle="Inclua missas e outros eventos da comunidade." action={<button className="button button-primary button-small" onClick={() => setModal('event')}><Plus size={15} /> Novo evento</button>} />{allEvents.length ? <div className="agenda-list settings-event-list">{allEvents.map((event) => <EventListRow key={event.id} event={event} people={data.ministers} assignments={data.assignments.filter((assignment) => assignment.eventId === event.id)} onOpen={() => { setSelectedEvent(event.id); setView('eventos') }} />)}</div> : <EmptyState text="Ainda não há eventos cadastrados." action="Cadastrar evento" onClick={() => setModal('event')} />}</section>
            <RoleSettings roles={data.roles} onAdd={addRole} />
            <EventTypeSettings eventTypes={data.eventTypes} onAdd={addEventType} />
          </div>
          <section className="panel import-panel"><PanelHeading title="Importar histórico da planilha" subtitle="Importe os ministros e as participações mensais de um arquivo Excel." action={<button className="button button-outline button-small" disabled={!supabaseConfigured} onClick={() => setModal('import-roster')}><Upload size={15} /> Importar XLSX</button>} /><p className="settings-hint">A planilha atual não contém WhatsApp. Os ministros serão importados sem telefone e você poderá preencher os contatos no cadastro. A importação fica disponível depois de configurar o Supabase e aplicar as migrações.</p></section>
        </>}
        <footer className="page-footer"><span>Ministros da Palavra</span><span>Organização com cuidado e comunidade.</span></footer>
      </div>
    </main>

    {modal === 'minister' && <MinisterModal onClose={() => setModal('')} onSave={addMinister} />}
    {modal === 'edit-minister' && editingMinister && <MinisterModal person={editingMinister} onClose={() => { setModal(''); setEditingMinister(null) }} onSave={saveMinisterEdits} />}
    {modal === 'import-roster' && supabaseConfigured && <LegacyImportModal ministers={data.ministers} onClose={() => setModal('')} onImport={importRoster} />}
    {modal === 'event' && <EventModal eventTypes={data.eventTypes} onClose={() => setModal('')} onSave={addEvent} />}
    {modal === 'assignment' && currentEvent && <AssignmentModal event={currentEvent} ministers={activeMinisters} assignments={data.assignments.filter((a) => a.eventId === currentEvent.id)} roles={data.roles} onClose={() => setModal('')} onSave={addAssignment} />}
    {toast && <div className="toast"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
  </div>
}

function formatMonth(month) {
  const [year, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, m - 1, 1))
}
function StatCard({ label, value, icon, detail, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div> }
function PanelHeading({ title, subtitle, action }) { return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div> }
function EmptyState({ text, action, onClick }) { return <div className="empty-state"><div className="empty-icon"><CalendarDays size={22} /></div><p>{text}</p>{action && <button className="button button-outline" onClick={onClick}>{action}</button>}</div> }
function MonthlyAssignmentsCell({ month, assignments, events }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const closeTimer = useRef(null)
  const popoverId = `month-details-${useId().replace(/:/g, '')}`

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(288, window.innerWidth - 16)
    const estimatedHeight = Math.min(260, 88 + assignments.length * 74)
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8))
    const below = rect.bottom + 5
    const top = below + estimatedHeight <= window.innerHeight - 8 ? below : Math.max(8, rect.top - estimatedHeight - 8)
    setPosition({ left, top, width })
  }
  function openDetails() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  function scheduleClose() {
    if (pinned) return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 400)
  }
  function togglePinned() {
    if (pinned) {
      setPinned(false)
      setOpen(false)
    } else {
      setPinned(true)
      setOpen(true)
    }
  }

  useEffect(() => {
    if (!open) { setPosition(null); return undefined }
    updatePosition()
    const handleOutsidePointer = (event) => {
      if (triggerRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return
      setOpen(false)
      setPinned(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') { setOpen(false); setPinned(false); triggerRef.current?.focus() }
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, assignments.length])

  if (!assignments.length) return <span className="month-cell unread" aria-label={`Sem escala em ${monthHeading(month)}`}>—</span>

  const details = assignments.map((assignment) => {
    const event = events.find((item) => item.id === assignment.eventId)
    const isHistorical = Boolean(assignment.month) || event?.kind?.toLocaleLowerCase('pt-BR') === 'histórico' || event?.title?.toLocaleLowerCase('pt-BR').startsWith('histórico')
    const hasDetails = !isHistorical && Boolean(event?.title && event?.date && event?.time && assignment.role)
    return { assignment, event, hasDetails }
  })

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="month-cell read month-cell-trigger"
      aria-label={`${assignments.length} escalação(ões) em ${monthHeading(month)}. Passe o mouse, foque ou toque para ver os detalhes.`}
      aria-expanded={open}
      aria-controls={popoverId}
      aria-describedby={open ? popoverId : undefined}
      onMouseEnter={openDetails}
      onMouseLeave={scheduleClose}
      onFocus={openDetails}
      onBlur={(event) => { if (!popoverRef.current?.contains(event.relatedTarget)) scheduleClose() }}
      onClick={togglePinned}
    >
      <Check size={15} />
      {assignments.length > 1 && <span className="month-cell-count" aria-hidden="true">{assignments.length}</span>}
    </button>
    {open && position && createPortal(
      <div
        ref={popoverRef}
        id={popoverId}
        className="month-details-popover"
        role="tooltip"
        aria-label={`Escalações de ${monthHeading(month)}`}
        style={position}
        onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current) }}
        onMouseLeave={scheduleClose}
      >
        <div className="month-details-heading"><strong>Escalações de {monthHeading(month)}</strong><span>{assignments.length}</span></div>
        <div className="month-details-list">{details.map(({ assignment, event, hasDetails }, index) => <article className="month-detail-item" key={assignment.id || `${month}-${index}`}>
          {hasDetails ? <><strong>{event.title}</strong><span>{formatDate(event.date, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })} · {event.time}</span><small>{assignment.role}</small></> : <p>Histórico importado; evento e papel não informados</p>}
        </article>)}</div>
      </div>,
      document.body,
    )}
  </>
}
function EventListRow({ event, people, assignments, onOpen }) { return <button className="agenda-row" onClick={onOpen}><div className="agenda-date"><strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong><span>{formatDate(event.date, { month: 'short' }).replace('.', '')}</span></div><div className="agenda-details"><strong>{event.title}</strong><span><Clock3 size={14} />{event.time} <i /> {event.kind}</span></div><div className="agenda-avatars">{assignments.slice(0, 3).map((a) => <span className="mini-avatar" key={a.id} title={people.find((p) => p.id === a.ministerId)?.name}>{initials(people.find((p) => p.id === a.ministerId)?.name)}</span>)}{assignments.length === 0 && <span className="muted">Sem escala</span>}</div><span className="agenda-arrow"><ChevronRight size={18} /></span></button> }
function EventCard({ event, data, onOpen }) { const assignments = data.assignments.filter((a) => a.eventId === event.id); return <button className="event-card" onClick={onOpen}><div className="event-card-top"><span className="pill pill-green">{event.kind}</span><span className="event-card-date">{formatShortDate(event.date)}</span></div><h3>{event.title}</h3><span className="event-card-time"><Clock3 size={14} />{event.time}</span><div className="event-card-bottom"><span className="stacked-avatars">{assignments.slice(0, 3).map((a) => <i key={a.id}>{initials(data.ministers.find((p) => p.id === a.ministerId)?.name)}</i>)}{assignments.length === 0 && <span>Escala pendente</span>}</span><span className="event-count">{assignments.length}/3 escalados</span></div></button> }
function EventDetail({ event, data, onAdd }) {
  const assignments = data.assignments.filter((a) => a.eventId === event.id)
  const people = assignments.map((a) => ({ assignment: a, person: data.ministers.find((p) => p.id === a.ministerId) })).filter((x) => x.person)
  return <div className="event-detail-grid"><section className="panel detail-main"><PanelHeading title="Ministros escalados" subtitle={`${assignments.length} pessoa(s) na escala deste evento. A prioridade é atualizada ao escalar.`} action={<button className="button button-outline button-small" onClick={onAdd}><Plus size={15} /> Adicionar pessoa</button>} />{people.length ? <div className="assignment-list">{people.map(({ assignment, person }) => <div className="assignment-row" key={assignment.id}><span className="avatar person-avatar">{initials(person.name)}</span><div className="assignment-person"><strong>{person.name}</strong><span>{assignment.role}</span></div><div className="assignment-actions">{person.whatsapp && <a className="whatsapp-button" href={makeWhatsAppUrl(person, event, assignment)} target="_blank" rel="noreferrer" title="Abrir mensagem no WhatsApp"><MessageCircle size={17} /></a>}</div></div>)}</div> : <EmptyState text="A escala deste evento ainda está vazia." action="Adicionar ministro" onClick={onAdd} />}</section><aside className="panel event-info"><span className="eyebrow">DETALHES DO EVENTO</span><h2>{event.title}</h2><span className="pill pill-green">{event.kind}</span><div className="info-divider"/><div className="info-item"><CalendarDays size={17} /><div><small>Data</small><strong>{formatDate(event.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong></div></div><div className="info-item"><Clock3 size={17} /><div><small>Horário</small><strong>{event.time}</strong></div></div><div className="event-progress"><div className="progress-copy"><span>Escala preenchida</span><strong>{assignments.length}/3</strong></div><div className="progress-track"><i style={{ width: `${Math.min(assignments.length / 3 * 100, 100)}%` }} /></div><small>Normalmente são três ministros por evento.</small></div></aside></div>
}

function RoleSettings({ roles, onAdd }) {
  const [name, setName] = useState('')
  return <section className="panel settings-roles"><PanelHeading title="Papéis do ministro" subtitle="Opções que aparecem ao montar uma escala." /><form className="role-form" onSubmit={(event) => { event.preventDefault(); Promise.resolve(onAdd(name)).then((saved) => saved && setName('')) }}><label className="field-label">Novo tipo de papel<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Salmo responsorial" /></label><button className="button button-primary"><Plus size={15} /> Adicionar papel</button></form><div className="role-chip-list">{roles.map((role) => <span className="role-chip" key={role}>{role}</span>)}</div><p className="settings-hint">Na escala, ainda será possível informar um papel diferente em campo livre.</p></section>
}

function EventTypeSettings({ eventTypes, onAdd }) {
  const [name, setName] = useState('')
  return <section className="panel settings-event-types"><PanelHeading title="Tipos de evento" subtitle="Opções que aparecem ao cadastrar um evento." /><form className="role-form" onSubmit={(event) => { event.preventDefault(); Promise.resolve(onAdd(name)).then((saved) => saved && setName('')) }}><label className="field-label">Novo tipo de evento<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Celebração" /></label><button className="button button-primary"><Plus size={15} /> Adicionar tipo</button></form><div className="role-chip-list">{eventTypes.map((type) => <span className="role-chip" key={type}>{type}</span>)}</div></section>
}

function LegacyImportModal({ ministers, onClose, onImport }) {
  const [preview, setPreview] = useState(null)
  const [year, setYear] = useState('2026')
  const [confirmAllActive, setConfirmAllActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const existingNames = new Set(ministers.map((person) => normalizeMinisterName(person.name)))
  const duplicateNames = preview?.people.filter((person) => existingNames.has(normalizeMinisterName(person.name))) || []
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const participationCount = preview?.people.reduce((total, person) => total + person.participatedMonths.length, 0) || 0
  const canImport = Boolean(preview && confirmAllActive && !preview.unknownColors.length && !preview.duplicateNames.length && !duplicateNames.length && Number(year) >= 2000 && Number(year) <= 2100 && !busy)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    setPreview(null)
    setError('')
    setFileName(file?.name || '')
    if (!file) return
    try {
      const { parseLegacySpreadsheet } = await import('./lib/legacySpreadsheet.js')
      setPreview(await parseLegacySpreadsheet(file))
    } catch (parseError) {
      setError(parseError.message || 'Não consegui ler esta planilha.')
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!canImport) return
    setBusy(true)
    setError('')
    try {
      const people = preview.people.map((person) => ({
        name: person.name,
        whatsapp: '',
        participatedMonths: person.participatedMonths.map((month) => `${year}-${String(month).padStart(2, '0')}`),
      }))
      await onImport(people)
    } catch (importError) {
      setError(importError.message || 'Não foi possível importar a planilha.')
    } finally {
      setBusy(false)
    }
  }

  return <Modal title="Importar histórico da planilha" onClose={onClose} wide><form className="legacy-import-form" onSubmit={submit}>
    <label className="field-label">Arquivo Excel (.xlsx)<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} /></label>
    {fileName && <p className="settings-hint">Arquivo: {fileName}</p>}
    <div className="field-grid"><label className="field-label">Ano das colunas mensais<input type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(event.target.value)} /></label><div className="legacy-import-months"><span className="field-label">Meses encontrados</span><strong>{preview ? preview.monthColumns.map((month) => monthNames[month - 1]).join(', ') : 'Aguardando arquivo'}</strong></div></div>
    {preview && <>
      <div className="legacy-import-summary"><div><strong>{preview.people.length}</strong><span>ministros</span></div><div><strong>{participationCount}</strong><span>participações verdes</span></div><div><strong>{preview.nonParticipationCells}</strong><span>células vermelhas ignoradas</span></div><div><strong>{preview.emptyCells}</strong><span>células sem registro</span></div></div>
      <div className="legacy-import-notes"><p>As células verdes serão importadas como uma participação por ministro e mês. Todos os tons de vermelho serão tratados como “não participou”. As células sem cor não criarão histórico.</p><p>O arquivo não informa WhatsApp nem situação ativo/inativo. Os ministros entrarão como ativos e sem telefone; adicione os contatos depois no cadastro.</p><p>O histórico importado não tem evento, horário ou papel. A tela de rodízio o identificará como histórico sem detalhes.</p></div>
      <label className="legacy-import-confirm"><input type="checkbox" checked={confirmAllActive} onChange={(event) => setConfirmAllActive(event.target.checked)} /><span>Confirmo importar todos os {preview.people.length} ministros como ativos.</span></label>
      {preview.colors.length > 0 && <div className="legacy-color-list"><strong>Cores identificadas</strong>{preview.colors.map(({ color, count }) => <span key={color}><i style={{ background: color.startsWith('FF') ? `#${color.slice(2)}` : '#a4ada5' }} /> {count} célula(s)</span>)}</div>}
      {preview.unknownColors.length > 0 && <div className="form-error">Há cores sem mapeamento ({preview.unknownColors.join(', ')}). Ajuste a planilha ou peça uma revisão antes de importar.</div>}
      {preview.duplicateNames.length > 0 && <div className="form-error">A planilha contém nomes repetidos: {preview.duplicateNames.join(', ')}.</div>}
      {duplicateNames.length > 0 && <div className="form-error">Já existem ministros com estes nomes: {duplicateNames.map((person) => person.name).join(', ')}. Resolva os duplicados antes de importar.</div>}
      <div className="legacy-import-sample"><strong>Prévia dos primeiros ministros</strong><span>{preview.people.slice(0, 8).map((person) => `${person.name} (${person.participatedMonths.length})`).join(' · ')}{preview.people.length > 8 ? ' · …' : ''}</span></div>
    </>}
    {error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={!canImport}><Upload size={15} /> {busy ? 'Importando…' : 'Importar ministros e histórico'}</button></div>
  </form></Modal>
}

function ConfigurationGate() {
  return <div className="auth-screen"><section className="auth-card"><div className="brand-mark auth-mark"><Cross size={24} strokeWidth={2.5} /></div><span className="eyebrow">CONFIGURAÇÃO NECESSÁRIA</span><h1>Ministros da Palavra</h1><p className="auth-copy">Esta publicação ainda não está conectada ao Supabase. Por segurança, o modo demonstração está desativado nesta versão.</p><div className="auth-error">Configure <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no ambiente de produção e publique novamente.</div></section></div>
}

function AuthGate({ status, email, error, onSignIn, onSignOut }) {
  const [address, setAddress] = useState(email || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-mark"><Cross size={24} strokeWidth={2.5} /></div><span className="eyebrow">ACESSO DA EQUIPE</span><h1>Ministros da Palavra</h1>{status === 'loading' ? <p className="auth-copy">Conectando ao espaço da comunidade…</p> : status === 'denied' ? <><p className="auth-copy">{error}</p><button className="button button-outline auth-submit" onClick={onSignOut}>Sair desta conta</button></> : status === 'error' ? <><p className="auth-error">{error}</p><button className="button button-outline auth-submit" onClick={() => window.location.reload()}>Tentar novamente</button></> : <><p className="auth-copy">Entre com o e-mail e a senha fornecidos pela administradora.</p><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSignIn(address, password); setBusy(false) }}><label className="field-label">E-mail<input autoComplete="username" type="email" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="voce@email.com" /></label><label className="field-label">Senha<input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Sua senha" /></label>{error && <div className="auth-error">{error}</div>}<button disabled={busy} className="button button-primary auth-submit">{busy ? 'Entrando…' : 'Entrar'}</button></form></>}<span className="auth-foot">Acesso restrito à equipe de liturgia.</span></div></div>
}

function MinisterModal({ onClose, onSave, person = null }) {
  const [name, setName] = useState(person?.name || '')
  const [whatsapp, setWhatsapp] = useState(person?.whatsapp || '')
  const [error, setError] = useState('')
  const editing = Boolean(person)
  return <Modal title={editing ? 'Editar ministro' : 'Cadastrar ministro'} onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return setError('Informe o nome do ministro.'); if (normalizePhone(whatsapp).length < 12) return setError('Informe um WhatsApp válido com DDD.'); onSave({ name, whatsapp }) }}><label className="field-label">Nome completo<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria da Silva" /></label><label className="field-label">WhatsApp<input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" /></label><small className="field-hint">Informe DDD e número; no Brasil, o código +55 será acrescentado ao abrir o WhatsApp. Para outros países, informe também o DDI.</small>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button className="button button-primary"><Pencil size={16} /> {editing ? 'Salvar alterações' : 'Cadastrar'}</button></div></form></Modal>
}
function EventModal({ eventTypes, onClose, onSave }) { const [title, setTitle] = useState(''); const [kind, setKind] = useState(eventTypes[0] || 'Missa'); const [date, setDate] = useState(todayInputValue()); const [time, setTime] = useState('09:00'); const [error, setError] = useState(''); return <Modal title="Novo evento" onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); if (!title.trim() || !date) return setError('Preencha o nome e a data do evento.'); onSave({ title: title.trim(), kind, date, time }) }}><label className="field-label">Nome do evento<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Missa dominical" /></label><div className="field-grid"><label className="field-label">Tipo<select value={kind} onChange={(e) => setKind(e.target.value)}>{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label className="field-label">Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div><label className="field-label">Horário<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button className="button button-primary"><Plus size={16} /> Criar evento</button></div></form></Modal> }
function MinisterPicker({ ministers, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const selected = ministers.find((person) => person.id === value)
  const filtered = ministers.filter((person) => person.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')))

  function selectMinister(person) {
    onChange(person.id)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      if (filtered.length) setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && filtered[activeIndex]) {
      event.preventDefault()
      selectMinister(filtered[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return <div className="minister-picker">
    <input
      autoFocus
      type="search"
      autoComplete="off"
      role="combobox"
      aria-label="Buscar ministro pelo nome"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
      value={open ? query : selected?.name || ''}
      placeholder="Buscar pelo nome do ministro"
      onFocus={() => { setQuery(''); setActiveIndex(0); setOpen(true) }}
      onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true) }}
      onKeyDown={handleKeyDown}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
    />
    {open && <div className="minister-picker-results" id={listId} role="listbox" aria-label="Ministros disponíveis">
      {filtered.length ? filtered.map((person, index) => <button
        id={`${listId}-${index}`}
        key={person.id}
        type="button"
        role="option"
        aria-selected={person.id === value}
        className={`minister-picker-option ${index === activeIndex ? 'active' : ''}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => selectMinister(person)}
      >{person.name}</button>) : <span className="minister-picker-empty">Nenhum ministro encontrado.</span>}
    </div>}
  </div>
}

function AssignmentModal({ event, ministers, assignments, roles, onClose, onSave }) {
  const [ministerId, setMinisterId] = useState('')
  const [role, setRole] = useState(roles[0] || DEFAULT_ROLES[0])
  const [customRole, setCustomRole] = useState('')
  const [error, setError] = useState('')
  const available = ministers.filter((person) => !assignments.some((assignment) => assignment.ministerId === person.id))

  return <Modal title="Adicionar à escala" onClose={onClose}><form onSubmit={(event) => {
    event.preventDefault()
    const finalRole = role === '__other__' ? customRole.trim() : role
    if (!ministerId) return setError('Selecione uma pessoa para escalar.')
    if (!finalRole) return setError('Informe o papel desta pessoa no evento.')
    onSave({ ministerId, role: finalRole })
  }}>
    <div className="selected-event-summary"><span className="selected-event-icon"><CalendarDays size={18} /></span><div><strong>{event.title}</strong><span>{formatDate(event.date, { day: '2-digit', month: 'long' })} · {event.time}</span></div></div>
    <label className="field-label">Ministro<MinisterPicker ministers={available} value={ministerId} onChange={setMinisterId} /></label>
    <label className="field-label">Papel no evento<select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((option) => <option key={option}>{option}</option>)}<option value="__other__">Outro papel (digitar)</option></select></label>
    {role === '__other__' && <label className="field-label">Descreva o papel<input value={customRole} onChange={(event) => setCustomRole(event.target.value)} placeholder="Ex.: Acolhida" /></label>}
    {available.length === 0 && <div className="form-error">Todos os ministros ativos já estão nesta escala.</div>}
    {error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button disabled={!available.length} className="button button-primary"><Plus size={16} /> Escalar ministro</button></div>
  </form></Modal>
}

export default App
