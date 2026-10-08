import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCandidates, usePlayer } from '../lib/data'
import type { Candidate } from '../lib/types'
import { fx, headshot, leagueName, signed, slash } from '../lib/format'
import { ErrorBox, Loading, Section, Tabs, TeamChip, DataTable } from '../components/ui'
import PercentileBars, { type PctRow } from '../components/PercentileBars'
import { EvLaScatter, LineChart, MonthBars, MovementPlot, SprayChart, ZoneHeat } from '../components/charts'
import { rankVar } from '../components/chartkit'
import { P, Li, K, Quote, T } from '../components/Term'

const pct3 = (v: number | undefined) => (v === undefined ? '-' : v.toFixed(3).replace(/^0/, ''))

function hitterRows(c: Candidate, d: any): PctRow[] {
  const p = c.hit!.savant.pct
  const r = c.hit!.savant.raw
  const rows: (PctRow | null)[] = [
    p.xwoba !== undefined ? { label: 'xwOBA', value: pct3(r.xwoba), pct: p.xwoba, hint: 'wOBA esperado según la calidad del contacto' } : null,
    p.xba !== undefined ? { label: 'xBA', value: pct3(r.xba), pct: p.xba } : null,
    p.xslg !== undefined ? { label: 'xSLG', value: pct3(r.xslg), pct: p.xslg } : null,
    p.brl_percent !== undefined ? { label: 'Barrel %', value: `${fx(r.barrel_batted_rate)}%`, pct: p.brl_percent } : null,
    p.exit_velocity !== undefined ? { label: 'Vel. de salida', value: `${fx(r.exit_velocity_avg)} mph`, pct: p.exit_velocity } : null,
    p.max_ev !== undefined ? { label: 'Vel. de salida máx.', value: `${fx(d?.ev?.max)} mph`, pct: p.max_ev } : null,
    p.hard_hit_percent !== undefined ? { label: 'Hard-Hit %', value: `${fx(r.hard_hit_percent)}%`, pct: p.hard_hit_percent } : null,
    p.bat_speed !== undefined ? { label: 'Vel. del bate', value: `${fx(d?.batTracking?.batSpeed)} mph`, pct: p.bat_speed } : null,
    p.k_percent !== undefined ? { label: 'K %', value: `${fx(r.k_percent)}%`, pct: p.k_percent } : null,
    p.bb_percent !== undefined ? { label: 'BB %', value: `${fx(r.bb_percent)}%`, pct: p.bb_percent } : null,
    p.whiff_percent !== undefined ? { label: 'Whiff %', value: `${fx(r.whiff_percent)}%`, pct: p.whiff_percent } : null,
    p.chase_percent !== undefined ? { label: 'Chase %', value: `${fx(r.oz_swing_percent)}%`, pct: p.chase_percent } : null,
    p.sprint_speed !== undefined ? { label: 'Vel. de carrera', value: `${fx(r.sprint_speed)} ft/s`, pct: p.sprint_speed } : null,
    p.oaa !== undefined ? { label: 'Outs sobre el prom.', value: '', pct: p.oaa, hint: 'Outs Above Average, defensa Statcast' } : null,
    p.arm_strength !== undefined ? { label: 'Fuerza de brazo', value: '', pct: p.arm_strength } : null,
  ]
  return rows.filter(Boolean) as PctRow[]
}

function pitcherRows(c: Candidate, d: any): PctRow[] {
  const p = c.pit!.savant.pct
  const r = c.pit!.savant.raw
  const ff = d?.arsenal?.find((a: any) => a.code === 'FF')
  const rows: (PctRow | null)[] = [
    p.xera !== undefined ? { label: 'xERA', value: fx(r.xera, 2), pct: p.xera } : null,
    p.xwoba !== undefined ? { label: 'xwOBA en contra', value: pct3(r.xwoba), pct: p.xwoba } : null,
    p.xba !== undefined ? { label: 'xBA en contra', value: pct3(r.xba), pct: p.xba } : null,
    p.brl_percent !== undefined ? { label: 'Barrel % en contra', value: `${fx(r.barrel_batted_rate)}%`, pct: p.brl_percent } : null,
    p.exit_velocity !== undefined ? { label: 'Vel. de salida en contra', value: `${fx(r.exit_velocity_avg)} mph`, pct: p.exit_velocity } : null,
    p.hard_hit_percent !== undefined ? { label: 'Hard-Hit % en contra', value: `${fx(r.hard_hit_percent)}%`, pct: p.hard_hit_percent } : null,
    p.k_percent !== undefined ? { label: 'K %', value: `${fx(r.k_percent)}%`, pct: p.k_percent } : null,
    p.bb_percent !== undefined ? { label: 'BB %', value: `${fx(r.bb_percent)}%`, pct: p.bb_percent } : null,
    p.whiff_percent !== undefined ? { label: 'Whiff %', value: `${fx(r.whiff_percent)}%`, pct: p.whiff_percent } : null,
    p.chase_percent !== undefined ? { label: 'Chase %', value: `${fx(r.oz_swing_percent)}%`, pct: p.chase_percent } : null,
    p.fb_velocity !== undefined ? { label: 'Velocidad de la recta', value: ff ? `${fx(ff.velo)} mph` : '', pct: p.fb_velocity } : null,
    p.fb_spin !== undefined ? { label: 'Giro de la recta', value: ff ? `${ff.spin} rpm` : '', pct: p.fb_spin } : null,
    p.curve_spin !== undefined ? { label: 'Giro de la curva', value: '', pct: p.curve_spin } : null,
  ]
  return rows.filter(Boolean) as PctRow[]
}

function HittingSection({ c, d }: { c: Candidate; d: any }) {
  const h = c.hit!
  const rolling = d.rolling as { g: number; date: string; ops: number; hr: number; sb: number }[]
  return (
    <>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Percentiles de Baseball Savant <T k="percentil">(¿qué es?)</T></h3>
          <P className="small muted">Compara a {c.name.split(' ').slice(-1)[0]} con el resto de la liga: el rojo es élite.</P>
          <PercentileBars rows={hitterRows(c, d)} title={`Percentiles de ${c.name}`} />
        </div>
        <div className="card">
          <h3>Dónde pega la pelota</h3>
          <SprayChart bbe={d.bbe} />
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><EvLaScatter bbe={d.bbe} title="Calidad del contacto" /></div>
        <div className="card">
          <ZoneHeat zones={d.zones} metric="xwoba" title="Mapa de zona: xwOBA por zona" />
          <div className="kv" style={{ marginTop: 14 }}>
            <div><K>Swing</K><div className="v">{d.discipline.swing}%</div></div>
            <div><K>Chase</K><div className="v">{d.discipline.chase}%</div></div>
            <div><K>Whiff</K><div className="v">{d.discipline.whiff}%</div></div>
            <div><K>Contacto en zona</K><div className="v">{d.discipline.zoneContact}%</div></div>
          </div>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <LineChart
            title="Racha de OPS (ventana de 15 juegos)" sub="Cuándo estuvo caliente o frío"
            series={[{ id: 'ops', label: 'OPS móvil', color: rankVar(c.rank), points: rolling.map((r) => ({ x: r.g, y: r.ops })) }]}
            yFmt={(v) => slash(v.toFixed(3))} xFmt={(v) => `J${v}`} refs={[{ y: 0.8, label: 'OPS .800' }]}
            tipExtra={(x) => { const r = rolling.find((q) => q.g === x); return r ? `${r.date} · ${r.hr} HR · ${r.sb} SB acumulados` : null }}
          />
        </div>
        <div className="card">
          <MonthBars title="OPS por mes" rows={d.monthly.map((m: any) => ({ m: m.m, OPS: m.ops, PA: m.pa, HR: m.hr, SB: m.sb }))} valueKey="OPS" fmt={(v) => slash(v.toFixed(3))} color={rankVar(c.rank)} refValue={0.8} refLabel="OPS .800" />
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Contra qué lanzamientos hace daño</h3>
          <DataTable head={['Tipo', 'Lanz.', 'Whiff %', 'wOBA', 'xwOBA', 'Vel. salida']}
            rows={(['FB', 'BR', 'OS'] as const).filter((k) => d.byPitch[k]).map((k) => { const b = d.byPitch[k]; return [{ FB: 'Recta (FB)', BR: 'Quebrada (BR)', OS: 'Cambio (OS)' }[k], b.n, b.whiff, pct3(b.woba), pct3(b.xwoba), b.ev ?? '-'] })} />
          <h3 style={{ marginTop: 16 }}>Contra zurdos y derechos</h3>
          <DataTable head={['Lanzador', 'PA', 'wOBA', 'xwOBA']} rows={(['R', 'L'] as const).map((k) => [k === 'R' ? 'Derecho' : 'Zurdo', d.byHand[k].pa, pct3(d.byHand[k].woba), pct3(d.byHand[k].xwoba)])} />
        </div>
        <div className="card">
          <h3><T k="batspeed">Bat tracking</T></h3>
          <P className="small muted">Cómo se mueve el bate, medido por Statcast ({d.batTracking.n} swings).</P>
          <div className="kv">
            <div><K>Vel. del bate</K><div className="v">{d.batTracking.batSpeed} mph</div></div>
            <div><K>Swings rápidos</K><div className="v">{d.batTracking.fastSwing}%</div></div>
            <div><K>Largo del swing</K><div className="v">{d.batTracking.swingLength} ft</div></div>
            <div><K>Ángulo de ataque</K><div className="v">{d.batTracking.attackAngle}°</div></div>
          </div>
          <h3 style={{ marginTop: 16 }}>Contacto</h3>
          <div className="kv">
            <div><K>Vel. prom.</K><div className="v">{d.ev.avg} mph</div></div>
            <div><K>Vel. máx.</K><div className="v">{d.ev.max} mph</div></div>
            <div><K>Barrel %</K><div className="v">{d.ev.barrel}%</div></div>
            <div><K>Sweet spot %</K><div className="v">{d.ev.sweetSpot}%</div></div>
          </div>
          <P className="small muted" style={{ marginTop: 12 }}>Valor del WAR: bateo {signed(h.bat)}, defensa {signed(h.fld)}, corrido {signed(h.bsr)}, posición {signed(h.posAdj)} carreras.</P>
        </div>
      </div>
    </>
  )
}

function PitchingSection({ c, d }: { c: Candidate; d: any }) {
  const era = d.eraTrend as any[]
  return (
    <>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Percentiles de Baseball Savant <T k="percentil">(¿qué es?)</T></h3>
          <P className="small muted">En lanzadores, el rojo siempre es mejor: menos daño y más ponches.</P>
          <PercentileBars rows={pitcherRows(c, d)} title={`Percentiles de ${c.name}`} />
        </div>
        <div className="card"><MovementPlot movement={d.movement} arsenal={d.arsenal} title="Movimiento de cada lanzamiento" /></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Arsenal</h3>
        <DataTable head={['Lanzamiento', 'Uso %', 'Vel.', 'Giro', 'Mov. H', 'Mov. V', 'Whiff %', 'CSW %', 'Putaway %', 'wOBA', 'xwOBA']}
          rows={d.arsenal.map((a: any) => [a.name, a.usage, a.velo, a.spin, a.hmov, a.vmov, a.whiff, a.csw, a.putaway, pct3(a.woba), pct3(a.xwoba)])} />
        <P className="small muted" style={{ marginTop: 8 }}>Movimientos en pulgadas, vista del catcher. CSW: strikes cantados más swings fallados. Putaway: ponches por lanzamiento con dos strikes.</P>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <LineChart
            title="Efectividad acumulada" sub="Cómo se construyó su ERA salida tras salida"
            series={[{ id: 'era', label: 'ERA acumulada', color: rankVar(c.rank), points: era.map((r) => ({ x: r.g, y: r.era })) }]}
            yFmt={(v) => v.toFixed(2)} xFmt={(v) => `S${v}`}
            tipExtra={(x) => { const r = era.find((q) => q.g === x); return r ? `${r.date} · ${r.ip} IP · ${r.k} K` : null }}
          />
        </div>
        <div className="card">
          <LineChart
            title="Velocidad de la recta por juego" sub="Si baja, es una señal de alarma"
            series={[{ id: 'v', label: 'Velocidad (mph)', color: rankVar(c.rank), points: (d.veloTrend as any[]).map((r, i) => ({ x: i + 1, y: r.velo })) }]}
            yFmt={(v) => v.toFixed(1)} xFmt={(v) => `S${v}`}
            tipExtra={(x) => { const r = (d.veloTrend as any[])[x - 1]; return r ? `${r.date} · ${r.n} rectas` : null }}
          />
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <MonthBars title="ERA por mes" rows={d.monthly.map((m: any) => ({ m: m.m, ERA: m.era, IP: m.ip, K: m.so, BB: m.bb }))} valueKey="ERA" fmt={(v) => v.toFixed(2)} color={rankVar(c.rank)} />
      </div>
    </>
  )
}

export default function Player() {
  const { id } = useParams()
  const cands = useCandidates()
  const detail = usePlayer(id || null)
  const [tab, setTab] = useState<'hit' | 'pit'>('hit')
  const cand = useMemo(() => {
    if (!cands.data) return null
    for (const lg of ['AL', 'NL'] as const) {
      const all = [...cands.data.leagues[lg].top5, ...cands.data.leagues[lg].bubble]
      const f = all.find((x) => String(x.id) === id)
      if (f) return f
    }
    return null
  }, [cands.data, id])

  if (cands.error) return <ErrorBox msg={cands.error} />
  if (!cands.data) return <Loading h={400} />
  if (!cand) return <div className="wrap"><h2>Jugador no encontrado</h2><Link to="/carrera">Volver a la carrera</Link></div>
  const c = cand
  const style = { ['--rank-color' as any]: c.top5 ? rankVar(c.rank) : 'var(--muted)' } as CSSProperties
  const b = c.bio
  const twoway = c.role === 'twoway'
  const activeTab = twoway ? tab : c.hit ? 'hit' : 'pit'

  return (
    <div className="wrap" style={style}>
      <P className="small"><Link to="/carrera">← Carrera MVP 2026</Link></P>
      <div className="card">
        <div className="player-head">
          <img className="photo" src={headshot(c.id, 340)} alt={c.name} width={170} />
          <div>
            <div className="eyebrow">{leagueName(c.lg)} · {c.top5 ? `Puesto ${c.rank} del análisis` : 'En la burbuja'}</div>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)' }}>{c.name}</h1>
            <P className="lede" style={{ marginBottom: 10 }}>{c.narrative.tagline}</P>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <TeamChip c={c} />
              <span className="chip">{b.pos === 'TWP' ? 'Dos vías' : b.pos} · {b.bats}/{b.throws}</span>
              <span className="chip">{b.age} años · {b.height} · {b.weight} lb</span>
              <span className="chip">{b.city}, {b.country}</span>
            </div>
            <div className="kv">
              <div><K>fWAR</K><div className="v">{c.war.f}</div></div>
              <div><K>bWAR</K><div className="v">{c.war.b}</div></div>
              {c.hit ? <div><K>wRC+</K><div className="v">{c.hit.wrcPlus}</div></div> : null}
              {c.hit ? <div><K>OPS</K><div className="v">{slash(c.hit.ops)}</div></div> : null}
              {c.pit ? <div><K>ERA</K><div className="v">{c.pit.era}</div></div> : null}
              {c.hit?.wpa !== null && c.hit?.wpa !== undefined ? <div><K>WPA</K><div className="v">{c.hit.wpa}</div></div> : null}
              <div><K>Equipo</K><div className="v">{c.teamRec.w}-{c.teamRec.l}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <a className="btn" href={c.links.mlb} target="_blank" rel="noreferrer">Perfil en MLB.com</a>
              <a className="btn" href={c.links.savant} target="_blank" rel="noreferrer">Baseball Savant</a>
              <a className="btn" href={c.links.bbref} target="_blank" rel="noreferrer">Baseball Reference</a>
              <a className="btn" href={c.links.fangraphs} target="_blank" rel="noreferrer">FanGraphs</a>
            </div>
          </div>
        </div>
      </div>

      {c.top5 ? (
        <Section title="El caso por qué sí y por qué no" eyebrow="Argumentos">
          <div className="grid g2">
            <div className="card"><h3>A favor</h3><ul className="clean pros">{c.narrative.pros.map((t, i) => <Li key={i}>{t}</Li>)}</ul></div>
            <div className="card"><h3>En contra</h3><ul className="clean cons">{c.narrative.cons.map((t, i) => <Li key={i}>{t}</Li>)}</ul></div>
          </div>
          <Quote style={{ marginTop: 16 }}>{c.narrative.verdict} <b>{c.narrative.outlook}</b></Quote>
          {b.awards.length ? <P className="small muted" style={{ marginTop: 12 }}>Reconocimientos previos (MLB.com): {b.awards.join(' · ')}.</P> : null}
        </Section>
      ) : null}

      {c.top5 ? (
        <Section title="Qué dicen los datos" eyebrow="Statcast y Baseball Savant">
          {twoway ? <Tabs value={tab} onChange={setTab} options={[{ id: 'hit', label: 'Como bateador' }, { id: 'pit', label: 'Como lanzador' }]} /> : null}
          {detail.error ? <ErrorBox msg={detail.error} /> : !detail.data ? <Loading h={420} /> : activeTab === 'hit' && detail.data.hitting ? (
            <HittingSection c={c} d={detail.data.hitting} />
          ) : detail.data.pitching ? (
            <PitchingSection c={c} d={detail.data.pitching} />
          ) : null}
        </Section>
      ) : (
        <Section title="Estadísticas" eyebrow="Resumen">
          <div className="card"><P>{c.narrative.tagline} Este jugador se evaluó pero quedó fuera del top 5; por eso no tiene análisis de Statcast en detalle. Consulta su perfil en las fuentes de arriba.</P></div>
        </Section>
      )}
      <P className="small muted" style={{ marginTop: 28 }}>Datos al {cands.data.asOf} (fin de temporada regular). Fuentes: MLB Stats API, Baseball Savant, Baseball Reference, FanGraphs.</P>
    </div>
  )
}
