import { useEffect, useMemo, useState } from 'react'
import { latLng } from 'leaflet'
import { Circle, CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from 'react-leaflet'
import fireSnapshot from './data/fire-2024.json'

type FirePoint = {
  id: string
  source_id: string
  lat: number
  lon: number
  observed_at: string
  municipality: string
  biome: string
  satellite: null
}

type View = 'overview' | 'fire'
const points = fireSnapshot.points as FirePoint[]
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const sourceUrl = fireSnapshot.metadata.source_url

function formatDate(value: string) {
  const [date, time] = value.split(' ')
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}${time ? ` · ${time.slice(0, 5)}` : ''}`
}

type MunicipalityGroup = { name: string; count: number }

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function focusHull(items: FirePoint[]): [number, number][] {
  const unique = [...new Map(items.map(point => [`${point.lon},${point.lat}`, point])).values()]
    .sort((a, b) => a.lon - b.lon || a.lat - b.lat)
  const cross = (a: FirePoint, b: FirePoint, c: FirePoint) =>
    (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon)
  const lower: FirePoint[] = []
  for (const point of unique) {
    while (lower.length > 1 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
    lower.push(point)
  }
  const upper: FirePoint[] = []
  for (const point of [...unique].reverse()) {
    while (upper.length > 1 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
    upper.push(point)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(point => [point.lat, point.lon])
}

function ViewportToSelection({ municipality, filtered, point }: { municipality: string; filtered: FirePoint[]; point: FirePoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (municipality === 'all') {
      map.flyTo([-19.52, -40.55], 7, { duration: 0.6 })
    } else if (filtered.length) {
      map.fitBounds(filtered.map(item => [item.lat, item.lon]), { padding: [38, 38], maxZoom: 11, animate: true })
    }
  }, [municipality, filtered, map])
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lon], Math.max(map.getZoom(), 9), { duration: 0.6 })
  }, [point, map])
  return null
}

function FireMap({ filtered, visible, municipality, selected, onSelect }: {
  filtered: FirePoint[]
  visible: FirePoint[]
  municipality: string
  selected: FirePoint | null
  onSelect: (point: FirePoint) => void
}) {
  const [tileFailure, setTileFailure] = useState(false)
  const outline = useMemo(() => municipality === 'all' ? [] : focusHull(filtered), [filtered, municipality])
  const center = useMemo(() => filtered.length && municipality !== 'all'
    ? latLng(median(filtered.map(point => point.lat)), median(filtered.map(point => point.lon)))
    : null, [filtered, municipality])
  const smallGroupRadius = center ? Math.max(1200, ...filtered.map(point => center.distanceTo([point.lat, point.lon]) + 1000)) : 0
  return (
    <div className="map-frame">
      <div className="map-topline"><span>01 / DISTRIBUIÇÃO GEOGRÁFICA</span><span>{municipality === 'all' ? 'ESPÍRITO SANTO' : municipality} · 2024</span></div>
      <MapContainer center={[-19.52, -40.55]} zoom={7} minZoom={6} maxZoom={14} scrollWheelZoom={false} className="fire-map" aria-label="Mapa interativo de focos de calor históricos no Espírito Santo">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => setTileFailure(true), tileload: () => setTileFailure(false) }}
        />
        <ViewportToSelection municipality={municipality} filtered={filtered} point={selected} />
        {municipality !== 'all' && outline.length >= 3 && <Polygon positions={outline} pathOptions={{ color: '#d3d7e4', weight: 2, dashArray: '5 7', fill: false, interactive: false }} />}
        {municipality !== 'all' && outline.length < 3 && center && <Circle center={center} radius={smallGroupRadius} pathOptions={{ color: '#d3d7e4', weight: 2, dashArray: '5 7', fill: false, interactive: false }} />}
        {visible.map(point => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lon]}
            radius={selected?.id === point.id ? 7 : 3}
            pathOptions={{ color: selected?.id === point.id ? '#f7eed3' : '#ff697f', weight: selected?.id === point.id ? 2 : 0, fillColor: '#ff697f', fillOpacity: 0.82 }}
            eventHandlers={{ click: () => onSelect(point) }}
          >
            <Popup><strong>{point.municipality}</strong><br />{formatDate(point.observed_at)}<br />ID {point.source_id}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {tileFailure && <div className="map-alert" role="status">Mapa-base indisponível. Os pontos e a lista continuam acessíveis.</div>}
      <div className="map-foot">{municipality !== 'all' && <><span className="area-legend" aria-hidden="true" /> Área dos focos <span className="map-foot-gap" /></>}<span className="legend-dot" /> Focos de calor <span className="map-foot-right">{visible.length.toLocaleString('pt-BR')} / {filtered.length.toLocaleString('pt-BR')} exibidos</span></div>
      {municipality !== 'all' && <div className="map-position-note">O contorno acompanha a extensão dos focos filtrados; não é o limite oficial do município.</div>}
    </div>
  )
}

const domains = [
  { code: 'AR', title: 'Qualidade do ar', state: 'Fonte localizada', note: 'Página do IEMA acessível. Série atual estruturada ainda não validada.', url: 'https://iema.es.gov.br/qualidadedoar', color: 'peach' },
  { code: 'ÁG', title: 'Rios e água', state: 'Inventário disponível', note: 'Estações ANA identificadas. Telemetria atual ainda não demonstrada.', url: 'https://telemetriaws1.ana.gov.br/ServiceANA.asmx?WSDL', color: 'blue' },
  { code: 'CL', title: 'Chuva e clima', state: 'Uso pendente', note: 'Portal do Incaper acessível. Cópia e exibição dos dados exigem verificação.', url: 'https://meteorologia.incaper.es.gov.br/', color: 'violet' },
  { code: 'MR', title: 'Mar e vento', state: 'Acesso pendente', note: 'O coletor recebeu HTTP 403 no PNBOIA. Nenhuma boia atual do ES foi confirmada.', url: 'https://www.marinha.mil.br/chm/dados-do-goos-brasil/pnboia', color: 'pink' },
] as const

function App() {
  const [view, setView] = useState<View>('overview')
  const [startMonth, setStartMonth] = useState(1)
  const [endMonth, setEndMonth] = useState(12)
  const [municipality, setMunicipality] = useState('all')
  const [selected, setSelected] = useState<FirePoint | null>(null)
  const [visibleCount, setVisibleCount] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const municipalities = useMemo(() => [...new Set(points.map(p => p.municipality))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [])
  const periodPoints = useMemo(() => points.filter(point => {
    const month = Number(point.observed_at.slice(5, 7))
    return month >= startMonth && month <= endMonth
  }), [startMonth, endMonth])
  const filtered = useMemo(() => municipality === 'all'
    ? periodPoints
    : periodPoints.filter(point => point.municipality === municipality), [periodPoints, municipality])
  const affectedMunicipalities = new Set(filtered.map(point => point.municipality)).size
  const groups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const point of periodPoints) counts.set(point.municipality, (counts.get(point.municipality) ?? 0) + 1)
    return [...counts].map(([name, count]) => ({ name, count } satisfies MunicipalityGroup))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
  }, [periodPoints])
  const visible = visibleCount === null ? filtered : filtered.slice(0, visibleCount)
  const timelineDate = visible.at(-1)?.observed_at ?? null
  const latestDate = filtered.at(-1)?.observed_at ?? null
  const activeSelected = selected && visible.some(point => point.id === selected.id) ? selected : null

  useEffect(() => {
    if (!playing || view !== 'fire') return
    const timer = window.setInterval(() => {
      setVisibleCount(current => {
        const next = (current ?? 0) + 1
        if (next >= filtered.length) {
          window.clearInterval(timer)
          setPlaying(false)
          return null
        }
        return next
      })
    }, 55)
    return () => window.clearInterval(timer)
  }, [playing, filtered.length, view])

  function showAll() {
    setPlaying(false)
    setVisibleCount(null)
  }

  function chooseMunicipality(name: string) {
    setMunicipality(name)
    setSelected(null)
    showAll()
  }

  function togglePlayback() {
    if (!filtered.length) return
    if (playing) {
      setPlaying(false)
    } else {
      setSelected(null)
      if (visibleCount === null || visibleCount >= filtered.length) setVisibleCount(0)
      setPlaying(true)
    }
  }

  function chooseView(next: View) {
    setView(next)
    if (next !== 'fire') setPlaying(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function changeStart(value: number) {
    setStartMonth(value)
    if (value > endMonth) setEndMonth(value)
    setSelected(null)
    showAll()
  }
  function changeEnd(value: number) {
    setEndMonth(value)
    if (value < startMonth) setStartMonth(value)
    setSelected(null)
    showAll()
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <div className="brand-text"><span className="eyebrow">PLATAFORMA AMBIENTAL · ES</span><strong>AMBIENTE<span className="brand-accent">/</span>ES</strong></div>
        <div className="masthead-right"><span className="local-badge">PRÉVIA LOCAL</span><span className="masthead-date">DADOS VERIFICADOS · SET 2026</span></div>
      </header>

      <div className="body-grid">
        <aside className="sidebar" aria-label="Navegação principal">
          <div className="rail-cap" aria-hidden="true" />
          <nav className="nav-list">
            <button className={view === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => chooseView('overview')} aria-current={view === 'overview' ? 'page' : undefined}><span className="nav-index">01</span><span>VISÃO GERAL</span></button>
            <button className={view === 'fire' ? 'nav-item active' : 'nav-item'} onClick={() => chooseView('fire')} aria-current={view === 'fire' ? 'page' : undefined}><span className="nav-index">02</span><span>FOGO</span></button>
          </nav>
          <div className="sidebar-line" aria-hidden="true" />
          <div className="sidebar-note"><span>STATUS DO SISTEMA</span><strong>01<span>/</span>05</strong><small>tema com amostra de dados nesta prévia</small></div>
          <div className="rail-bottom" aria-hidden="true" />
        </aside>

        <main id="main-content">
          <div className="section-strip"><span>{view === 'overview' ? '01 / PAINEL AMBIENTAL' : '02 / MONITORAMENTO DE FOGO'}</span><span>ESPÍRITO SANTO <i /> BRASIL</span></div>
          {view === 'overview' ? <>
            <section className="intro" aria-labelledby="overview-title">
              <div className="intro-copy"><p className="mini-label">PAINEL DE INTELIGÊNCIA AMBIENTAL</p><h1 id="overview-title">O ambiente em <em>perspectiva.</em></h1><p className="intro-text">Uma visão pública dos dados ambientais do Espírito Santo. Esta primeira prévia mostra evidências históricas verificadas e deixa visíveis as lacunas de dados atuais.</p><div className="intro-actions"><button className="primary-action" onClick={() => chooseView('fire')}>EXPLORAR FOCOS DE CALOR <span aria-hidden="true">↗</span></button><span className="intro-aside">AMOSTRA HISTÓRICA · 2024</span></div></div>
              <div className="intro-graphic" aria-hidden="true"><div className="graphic-orbit orbit-one" /><div className="graphic-orbit orbit-two" /><div className="graphic-core">ES</div><span className="graphic-label">20° S<br />40° W</span></div>
            </section>

            <section className="status-section" aria-labelledby="status-title"><div className="section-heading"><div><p className="mini-label">LEITURA DO PAINEL</p><h2 id="status-title">O que já sabemos</h2></div><span className="heading-meta">05 DOMÍNIOS / 01 COM AMOSTRA</span></div>
              <div className="spotlight-card"><div className="spotlight-accent" /><div className="spotlight-icon">FO</div><div className="spotlight-copy"><span className="spotlight-kicker">FOGO <b>·</b> OBSERVAÇÃO HISTÓRICA</span><h3>Focos de calor no ES em 2024</h3><p>Arquivo anual oficial do INPE. Pontos, datas e municípios disponíveis para exploração. Não representa a situação atual.</p><button className="text-link" onClick={() => chooseView('fire')}>ABRIR MAPA E FILTROS <span aria-hidden="true">↗</span></button></div><div className="spotlight-number"><strong>662</strong><span>REGISTROS NA AMOSTRA</span></div></div>
              <div className="domain-grid">{domains.map(domain => <article className={`domain-card ${domain.color}`} key={domain.code}><div className="domain-head"><span>{domain.code}</span><span className="domain-pill">DADO ATUAL INDISPONÍVEL</span></div><h3>{domain.title}</h3><p>{domain.note}</p><div className="domain-bottom"><span>{domain.state}</span><a href={domain.url} target="_blank" rel="noreferrer" aria-label={`Abrir fonte de ${domain.title} em nova aba`}>FONTE ↗</a></div></article>)}</div>
            </section>
            <section className="method-band"><div className="method-band-mark">i</div><div><strong>Como ler esta prévia</strong><p>Uma página acessível não comprova dados atuais. Observações, previsões e alertas têm estados próprios. Cada informação exibida deve levar ao conjunto, ao arquivo e à instituição responsável.</p></div><details className="method-details"><summary>LER METODOLOGIA</summary><p>Os 662 pontos vêm do ZIP anual do INPE preservado na auditoria. Datas são mostradas como constam no CSV, sem conversão de fuso. Coordenadas foram convertidas para números; nenhum registro foi removido. A metodologia completa da auditoria está em docs/METODOLOGIA.md neste projeto local.</p></details></section>
          </> : <>
            <section className="fire-header" aria-labelledby="fire-title"><div><p className="mini-label">INPE / PROGRAMA QUEIMADAS</p><h1 id="fire-title">Focos de calor<span className="title-period"> / 2024</span></h1><p>Registros georreferenciados do arquivo anual do Espírito Santo. Um foco detectado por satélite não equivale, por si só, a um incêndio confirmado.</p></div><div className="historical-seal"><span>TIPO DE DADO</span><strong>HISTÓRICO</strong><small>Última observação<br />20 DEZ 2024</small></div></section>
            <div className="notice" role="note"><span className="notice-symbol">!</span><p>Esta amostra é de <strong>2024</strong>. Ela não descreve o que acontece agora. O fluxo de dados atuais e as permissões de redistribuição ainda precisam de validação.</p></div>
            <section className="fire-workspace" aria-label="Exploração dos focos históricos">
              <div className="scope-switch" role="group" aria-label="Escala territorial do mapa">
                <button className={municipality === 'all' ? 'scope-option active' : 'scope-option'} aria-pressed={municipality === 'all'} onClick={() => chooseMunicipality('all')}>ESTADO COMPLETO</button>
                <button className={municipality !== 'all' ? 'scope-option active' : 'scope-option'} aria-pressed={municipality !== 'all'} disabled={!groups.length} onClick={() => chooseMunicipality(municipality === 'all' ? groups[0].name : municipality)}>POR MUNICÍPIO{municipality !== 'all' ? ` · ${municipality}` : ''}</button>
              </div>
              <div className="filters">
                <div className="filters-label"><span>FILTROS</span><button onClick={() => { setStartMonth(1); setEndMonth(12); chooseMunicipality('all') }}>LIMPAR</button></div>
                <div className="filter-controls">
                  <label>DE MÊS <select value={startMonth} onChange={event => changeStart(Number(event.target.value))}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
                  <label>ATÉ MÊS <select value={endMonth} onChange={event => changeEnd(Number(event.target.value))}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
                  <label className="municipality-filter">MUNICÍPIO <select value={municipality} onChange={event => chooseMunicipality(event.target.value)}><option value="all">Todos os municípios (estado)</option>{municipalities.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
                </div>
              </div>
              <div className="metric-row"><div className="metric main-metric"><span>FOCOS NO FILTRO</span><strong>{filtered.length.toLocaleString('pt-BR')}</strong><small>registros do arquivo de 2024</small></div><div className="metric"><span>MUNICÍPIOS COM REGISTRO</span><strong>{affectedMunicipalities}</strong><small>no período selecionado</small></div><div className="metric"><span>ÚLTIMA OBSERVAÇÃO DO FILTRO</span><strong className="date-metric">{latestDate ? formatDate(latestDate).split(' · ')[0] : '—'}</strong><small>{latestDate ? 'horário sem fuso declarado' : 'nenhum registro'}</small></div></div>
              <div className="timeline" aria-label="Reprodução cronológica dos focos">
                <div className="timeline-heading"><div><span>REPRODUÇÃO CRONOLÓGICA · 2024</span><small>{visibleCount === null ? 'Todos os focos visíveis' : timelineDate ? `Até ${formatDate(timelineDate)} · fuso não informado` : 'Início do período'}</small></div><strong>{visible.length} / {filtered.length}</strong></div>
                <div className="timeline-controls"><button className="timeline-play" onClick={togglePlayback} disabled={!filtered.length}>{playing ? 'PAUSAR' : visibleCount !== null && visibleCount < filtered.length ? 'CONTINUAR' : 'REPRODUZIR'} <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span></button><input type="range" min="0" max={filtered.length || 1} value={visibleCount ?? filtered.length} disabled={!filtered.length} aria-label="Posição na sequência cronológica dos focos" onChange={event => { setPlaying(false); setSelected(null); setVisibleCount(Number(event.target.value)) }} /><button className="timeline-all" onClick={showAll} disabled={visibleCount === null}>MOSTRAR TODOS</button></div>
              </div>
              <div className="workspace-grid">
                <FireMap filtered={filtered} visible={visible} municipality={municipality} selected={activeSelected} onSelect={setSelected} />
                <aside className="record-panel" aria-label="Municípios e detalhes dos focos">
                  <div className="panel-topline">02 / MUNICÍPIOS <span>{groups.length} COM FOCOS NO PERÍODO</span></div>
                  {activeSelected ? <div className="selected-card"><span className="mini-label">FOCO SELECIONADO</span><h3>{activeSelected.municipality}</h3><p>{formatDate(activeSelected.observed_at)} <small>fuso não informado</small></p><dl><div><dt>LAT / LON</dt><dd>{activeSelected.lat.toFixed(5)} / {activeSelected.lon.toFixed(5)}</dd></div><div><dt>BIOMA</dt><dd>{activeSelected.biome}</dd></div><div><dt>ID DE ORIGEM</dt><dd>{activeSelected.source_id}</dd></div><div><dt>SATÉLITE</dt><dd>Não informado neste arquivo</dd></div></dl></div> : <div className="selection-empty">{municipality === 'all' ? 'Escolha um município: todos os seus focos aparecerão juntos no mapa.' : `${filtered.length} focos de ${municipality} estão visíveis. Selecione um ponto do mapa para ver seu dado de origem.`}</div>}
                  {municipality !== 'all' && <>
                    <div className="record-list-heading">FOCOS DE {municipality} · {filtered.length}</div>
                    <div className="focus-list">{[...filtered].reverse().map(point => <button key={point.id} className={activeSelected?.id === point.id ? 'focus-row active' : 'focus-row'} onClick={() => setSelected(point)}><span>{formatDate(point.observed_at)}<small>ID {point.source_id}</small></span><span aria-hidden="true">↗</span></button>)}</div>
                  </>}
                  <div className="record-list-heading">ESCOLHA UM MUNICÍPIO · FOCOS NO PERÍODO</div>
                  <div className="record-list">{groups.length ? groups.map(group => <button key={group.name} className={municipality === group.name ? 'record active' : 'record'} onClick={() => chooseMunicipality(group.name)} aria-label={`${group.name}: mostrar todos os ${group.count} ${group.count === 1 ? 'foco' : 'focos'} no mapa`}><span className="city-list-name"><strong>{group.name}</strong><small>{group.count} {group.count === 1 ? 'foco' : 'focos'} no período</small></span><span aria-hidden="true">↗</span></button>) : <p className="empty-list">Nenhum registro para os meses escolhidos.</p>}</div>
                  {municipality !== 'all' && <button className="return-state" onClick={() => chooseMunicipality('all')}>← VOLTAR AO ESTADO COMPLETO</button>}
                </aside>
              </div>
            </section>
            <section className="provenance" aria-labelledby="source-title"><div className="provenance-line" /><div className="provenance-title"><span className="mini-label">03 / PROVENIÊNCIA</span><h2 id="source-title">Do ponto à fonte.</h2></div><div className="provenance-grid"><div><span>INSTITUIÇÃO</span><strong>INPE · Programa Queimadas</strong></div><div><span>PRODUTO</span><strong>Focos de calor, arquivo anual ES 2024</strong></div><div><span>COBERTURA</span><strong>04 jan — 20 dez 2024</strong></div><div><span>LIMITAÇÃO</span><strong>Fuso e satélite não informados no CSV</strong></div></div><p>O arquivo de origem contém 662 registros. Nesta prévia local, espaços foram removidos dos campos de texto e coordenadas foram convertidas para números; nenhum ponto foi descartado. A cópia, exibição pública e redistribuição exigem verificação dos termos do conjunto.</p><details className="method-details provenance-method"><summary>METODOLOGIA E RASTREABILIDADE</summary><p>Origem local: {fireSnapshot.metadata.source_file}. SHA-256 do ZIP: <code>{fireSnapshot.metadata.source_zip_sha256}</code>. Transformação reproduzível: <code>python3 scripts/build_fire_snapshot.py</code>. O horário do CSV não declara fuso e o satélite não é informado neste produto.</p></details><a href={sourceUrl} target="_blank" rel="noreferrer" className="source-button">VER ARQUIVO NA FONTE <span aria-hidden="true">↗</span></a></section>
          </>}
        </main>
      </div>
      <footer className="footer"><span>AMBIENTE/ES <b>·</b> PRÉVIA LOCAL</span><span>DADOS COM ORIGEM. LACUNAS À VISTA.</span></footer>
    </div>
  )
}

export default App
