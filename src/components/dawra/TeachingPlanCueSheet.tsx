// Renders a structured teaching plan (course_sessions.teaching_plan_json) as a
// colour-coded cue sheet: blue = open the book, rust = stop reading here,
// gold = put the book down and run the script. See generate-course-insights'
// emit_teaching_plan tool for the schema this expects.

interface AskBeat { kind: 'ask' | 'key' | 'scenario' | 'do' | 'recap'; label: string; text: string; options?: string[] }

interface BookCue { type: 'book'; action: 'open' | 'resume' | 'turn_page'; page: string; reader?: string; from_quote?: string; to_quote?: string }
interface StopCue { type: 'stop'; number?: number; page?: string; line: string }
interface ScriptCue { type: 'script'; lead?: string; beats: AskBeat[] }
type Cue = BookCue | StopCue | ScriptCue;

export interface TeachingPlanData {
  session_title: string;
  book_reference: string;
  page_range: string;
  flight_plan: { time: string; page: string; section: string; lead: string }[];
  opening_hook: { lead: string; duration: string; beats: string[] };
  sections: { title: string; cues: Cue[] }[];
  wrap_up: { lead: string; time: string; beats: string[] };
  isha_break: string;
  after_food_discussion: string[];
  homework: { title: string; text: string }[];
  teacher_notes: { if_long: string; if_quiet: string; sensitivities: string[] };
  closing_dua?: string;
}

const BookIcon = () => (
  <svg className="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 5c3-1 6-1 9 1v13c-3-2-6-2-9-1V5Z" />
    <path d="M21 5c-3-1-6-1-9 1v13c3-2 6-2 9-1V5Z" />
  </svg>
);
const StopIcon = () => (
  <svg className="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx={12} cy={12} r={9} />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);
const ScriptIcon = () => (
  <svg className="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
  </svg>
);

const BOOK_ACTION_LABEL: Record<BookCue['action'], string> = {
  open: 'Open the book',
  resume: 'Resume reading',
  turn_page: 'Turn the page',
};

function BeatBlock({ beat }: { beat: AskBeat }) {
  if (beat.kind === 'recap') {
    return (
      <div className="cs-beat cs-beat-recap">
        <div className="cs-beat-label">{beat.label}</div>
        <p>{beat.text}</p>
      </div>
    );
  }
  return (
    <div className={`cs-beat${beat.kind === 'key' ? ' cs-beat-key' : ''}`}>
      <div className="cs-beat-label">{beat.label}</div>
      <p className={beat.kind === 'scenario' ? 'cs-say' : undefined}>{beat.text}</p>
      {beat.options && beat.options.length > 0 && (
        <ul>{beat.options.map((o, i) => <li key={i}>{o}</li>)}</ul>
      )}
    </div>
  );
}

function CueBlock({ cue }: { cue: Cue }) {
  if (cue.type === 'book') {
    return (
      <div className="cs-cue cs-cue-book">
        <div className="cs-cue-head">
          <span className="cs-cue-label"><BookIcon />{BOOK_ACTION_LABEL[cue.action]}</span>
          <span className="cs-page-badge">p. {cue.page}</span>
        </div>
        <div className="cs-excerpt">
          {cue.from_quote && (
            <>
              <span className="cs-from-to">{cue.reader ? `${cue.reader} starts —` : 'Starts —'}</span>
              <q>{cue.from_quote}</q>
            </>
          )}
          {cue.to_quote && (
            <>
              <span className="cs-from-to">Reads through to —</span>
              <q>{cue.to_quote}</q>
            </>
          )}
        </div>
      </div>
    );
  }
  if (cue.type === 'stop') {
    return (
      <div className="cs-stop">
        <div className="cs-cue-label"><StopIcon />Stop{cue.number ? ` #${cue.number}` : ''}{cue.page ? ` — p. ${cue.page}` : ''}</div>
        <div className="cs-stop-line">{cue.line}</div>
      </div>
    );
  }
  return (
    <div className="cs-cue cs-cue-script">
      <div className="cs-cue-head">
        <span className="cs-cue-label"><ScriptIcon />Put the book down</span>
        {cue.lead && <span className="cs-who">{cue.lead}</span>}
      </div>
      {cue.beats.map((b, i) => <BeatBlock key={i} beat={b} />)}
    </div>
  );
}

export default function TeachingPlanCueSheet({ plan }: { plan: TeachingPlanData }) {
  return (
    <div className="cue-sheet">
      <style>{CUE_SHEET_CSS}</style>

      <div className="cs-masthead">
        <h3>{plan.session_title}</h3>
        <div className="cs-sub">{plan.book_reference}{plan.page_range ? ` · pp. ${plan.page_range}` : ''}</div>
      </div>

      <div className="cs-legend">
        <div className="cs-legend-item"><span className="cs-swatch cs-swatch-book" />Open the book</div>
        <div className="cs-legend-item"><span className="cs-swatch cs-swatch-stop" />Stop reading here</div>
        <div className="cs-legend-item"><span className="cs-swatch cs-swatch-script" />Put the book down</div>
      </div>

      {plan.flight_plan?.length > 0 && (
        <div className="cs-flightplan">
          <table>
            <thead><tr><th>Time</th><th>Page</th><th>Section</th><th>Lead</th></tr></thead>
            <tbody>
              {plan.flight_plan.map((row, i) => (
                <tr key={i}>
                  <td className="cs-mono">{row.time}</td>
                  <td className="cs-mono cs-fp-page">{row.page}</td>
                  <td>{row.section}</td>
                  <td className="cs-fp-lead">{row.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {plan.opening_hook && (
        <div className="cs-hook">
          <div className="cs-hook-tag">Before the book opens · {plan.opening_hook.lead} · {plan.opening_hook.duration}</div>
          {plan.opening_hook.beats.map((b, i) => <p key={i}>{b}</p>)}
        </div>
      )}

      {plan.sections.map((section, si) => (
        <div key={si}>
          <div className="cs-section-head">
            <div className="cs-mono cs-section-num">Section {si + 1} / {plan.sections.length}</div>
            <h4>{section.title}</h4>
          </div>
          {section.cues.map((cue, ci) => <CueBlock key={ci} cue={cue} />)}
        </div>
      ))}

      {plan.wrap_up && (
        <div className="cs-section-head">
          <div className="cs-mono cs-section-num">Wrap-up · {plan.wrap_up.lead} · {plan.wrap_up.time}</div>
        </div>
      )}
      {plan.wrap_up?.beats.map((b, i) => <p key={i} className="cs-wrapup-line">{b}</p>)}

      {plan.isha_break && <p className="cs-isha">Isha prayer break — {plan.isha_break}</p>}

      {plan.after_food_discussion?.length > 0 && (
        <div className="cs-hook" style={{ marginTop: 24 }}>
          <div className="cs-hook-tag">After food — informal discussion</div>
          <ol>{plan.after_food_discussion.map((q, i) => <li key={i}>{q}</li>)}</ol>
        </div>
      )}

      {plan.homework?.length > 0 && (
        <div className="cs-hook" style={{ marginTop: 16 }}>
          <div className="cs-hook-tag">Homework / this week</div>
          {plan.homework.map((h, i) => (
            <p key={i}><strong>{h.title}</strong> — {h.text}</p>
          ))}
        </div>
      )}

      {plan.teacher_notes && (
        <footer className="cs-footer">
          {plan.teacher_notes.if_long && <p><strong>If a stop runs long:</strong> {plan.teacher_notes.if_long}</p>}
          {plan.teacher_notes.if_quiet && <p><strong>If the room goes quiet:</strong> {plan.teacher_notes.if_quiet}</p>}
          {plan.teacher_notes.sensitivities?.length > 0 && (
            <p><strong>Sensitivities:</strong> {plan.teacher_notes.sensitivities.join(' · ')}</p>
          )}
          {plan.closing_dua && <p className="cs-dua">{plan.closing_dua}</p>}
        </footer>
      )}
    </div>
  );
}

export const CUE_SHEET_CSS = `
.cue-sheet {
  --cs-paper-raised: #F7F5EE;
  --cs-ink: #221F1A;
  --cs-ink-soft: #5B564C;
  --cs-ink-faint: #8B8578;
  --cs-line: rgba(34, 31, 26, 0.14);
  --cs-accent: #96691C;
  --cs-book: #2F4A73;
  --cs-book-bg: rgba(47, 74, 115, 0.07);
  --cs-stop: #9C3B29;
  --cs-stop-bg: rgba(156, 59, 41, 0.08);
  --cs-script: #96691C;
  --cs-script-bg: rgba(150, 105, 28, 0.08);
  --cs-script-bg-strong: rgba(150, 105, 28, 0.14);
  font-family: inherit;
  color: var(--cs-ink);
  max-width: 720px;
}
.dark .cue-sheet {
  --cs-paper-raised: rgba(255,255,255,0.04);
  --cs-ink: #ECE7DC;
  --cs-ink-soft: #B4AC9C;
  --cs-ink-faint: #7D7767;
  --cs-line: rgba(236, 231, 220, 0.16);
  --cs-accent: #D8A94B;
  --cs-book: #8FADDA;
  --cs-book-bg: rgba(143, 173, 218, 0.1);
  --cs-stop: #E08872;
  --cs-stop-bg: rgba(224, 136, 114, 0.1);
  --cs-script: #D8A94B;
  --cs-script-bg: rgba(216, 169, 75, 0.1);
  --cs-script-bg-strong: rgba(216, 169, 75, 0.16);
}
.cue-sheet .cs-mono { font-family: ui-monospace, 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.cue-sheet h3 { font-size: 20px; font-weight: 700; margin: 0 0 2px; }
.cue-sheet h4 { font-size: 17px; font-weight: 600; margin: 4px 0 0; }
.cue-sheet .cs-masthead { border-bottom: 2px solid var(--cs-ink); padding-bottom: 12px; margin-bottom: 16px; }
.cue-sheet .cs-sub { color: var(--cs-ink-soft); font-size: 13px; }
.cue-sheet .cs-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; background: var(--cs-paper-raised); border: 1px solid var(--cs-line); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; font-size: 12.5px; }
.cue-sheet .cs-legend-item { display: flex; align-items: center; gap: 6px; color: var(--cs-ink-soft); }
.cue-sheet .cs-swatch { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.cue-sheet .cs-swatch-book { background: var(--cs-book); }
.cue-sheet .cs-swatch-stop { background: var(--cs-stop); }
.cue-sheet .cs-swatch-script { background: var(--cs-script); }
.cue-sheet .cs-flightplan { margin-bottom: 24px; overflow-x: auto; }
.cue-sheet .cs-flightplan table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cue-sheet .cs-flightplan th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--cs-ink-faint); font-weight: 500; padding-bottom: 6px; border-bottom: 1px solid var(--cs-line); }
.cue-sheet .cs-flightplan td { padding: 8px 8px 8px 0; border-bottom: 1px solid var(--cs-line); vertical-align: top; }
.cue-sheet .cs-fp-page { color: var(--cs-book); }
.cue-sheet .cs-fp-lead { color: var(--cs-ink-soft); font-size: 12px; }
.cue-sheet .cs-hook { background: var(--cs-paper-raised); border: 1px solid var(--cs-line); border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; }
.cue-sheet .cs-hook-tag { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--cs-accent); font-weight: 600; margin-bottom: 8px; }
.cue-sheet .cs-hook p { margin: 0 0 8px; line-height: 1.6; font-size: 14px; }
.cue-sheet .cs-hook p:last-child { margin-bottom: 0; }
.cue-sheet .cs-hook ol { margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.8; }
.cue-sheet .cs-section-head { margin: 28px 0 12px; padding-top: 14px; border-top: 1px solid var(--cs-line); }
.cue-sheet .cs-section-num { font-size: 11px; color: var(--cs-ink-faint); letter-spacing: 0.06em; }
.cue-sheet .cs-cue { border-radius: 4px 10px 10px 4px; padding: 14px 18px; margin-bottom: 10px; }
.cue-sheet .cs-cue-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.cue-sheet .cs-cue-label { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.cue-sheet .cs-icon { width: 14px; height: 14px; flex-shrink: 0; }
.cue-sheet .cs-cue-book { background: var(--cs-book-bg); border-left: 4px solid var(--cs-book); }
.cue-sheet .cs-cue-book .cs-cue-label { color: var(--cs-book); }
.cue-sheet .cs-page-badge { background: var(--cs-book); color: white; font-weight: 700; font-size: 12px; padding: 2px 9px; border-radius: 20px; }
.cue-sheet .cs-excerpt { font-size: 13.5px; line-height: 1.6; }
.cue-sheet .cs-from-to { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--cs-ink-faint); display: block; margin-bottom: 2px; }
.cue-sheet .cs-excerpt q { display: block; font-style: italic; color: var(--cs-ink-soft); quotes: none; margin: 0 0 8px; }
.cue-sheet .cs-excerpt q::before, .cue-sheet .cs-excerpt q::after { content: none; }
.cue-sheet .cs-stop { background: var(--cs-stop-bg); border: 1.5px dashed var(--cs-stop); border-radius: 10px; padding: 12px 16px; margin: 4px 0 10px; text-align: center; }
.cue-sheet .cs-stop .cs-cue-label { color: var(--cs-stop); justify-content: center; }
.cue-sheet .cs-stop-line { font-size: 14px; font-weight: 600; margin-top: 6px; }
.cue-sheet .cs-stop-line::before { content: '\\201C'; color: var(--cs-stop); }
.cue-sheet .cs-stop-line::after { content: '\\201D'; color: var(--cs-stop); }
.cue-sheet .cs-cue-script { background: var(--cs-script-bg); border-left: 4px solid var(--cs-script); }
.cue-sheet .cs-cue-script .cs-cue-label { color: var(--cs-script); }
.cue-sheet .cs-who { font-size: 10.5px; color: var(--cs-ink-faint); text-transform: uppercase; letter-spacing: 0.05em; }
.cue-sheet .cs-beat { margin-top: 12px; }
.cue-sheet .cs-beat:first-of-type { margin-top: 2px; }
.cue-sheet .cs-beat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--cs-ink-faint); margin-bottom: 3px; }
.cue-sheet .cs-beat p { margin: 0; font-size: 14px; line-height: 1.6; }
.cue-sheet .cs-say { font-style: italic; }
.cue-sheet .cs-beat ul { margin: 4px 0 0; padding-left: 16px; font-size: 13px; color: var(--cs-ink-soft); }
.cue-sheet .cs-beat-key p { font-weight: 600; }
.cue-sheet .cs-beat-recap { background: var(--cs-script-bg-strong); border-radius: 8px; padding: 8px 12px; margin-top: 14px; }
.cue-sheet .cs-wrapup-line { font-size: 14px; line-height: 1.6; }
.cue-sheet .cs-isha { text-align: center; font-size: 12.5px; color: var(--cs-ink-faint); margin: 16px 0; }
.cue-sheet .cs-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--cs-line); color: var(--cs-ink-faint); font-size: 12.5px; line-height: 1.7; }
.cue-sheet .cs-dua { color: var(--cs-script); font-style: italic; }
`;
