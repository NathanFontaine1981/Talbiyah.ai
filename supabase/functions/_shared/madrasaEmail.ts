// "Notes are ready" email for parents: a short summary plus a portal link, never the full notes.
// Pure functions (no Deno APIs) so they can be unit-tested. Arabic keeps right-to-left direction and
// tashkeel inside left-to-right English; email clients vary, so every Arabic run is wrapped explicitly.

const A = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const RUN = new RegExp(`[${A}]+(?:[ \\u00A0]+[${A}]+)*`, "g");

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escape text and wrap each Arabic run in an RTL-isolated span. */
export function arabicToHtml(text: string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const i = m.index ?? 0;
    out += escapeHtml(text.slice(last, i));
    out += `<span dir="rtl" lang="ar" style="unicode-bidi:isolate;font-family:'Amiri','Noto Naskh Arabic','Geeza Pro','Traditional Arabic',serif;font-size:1.25em;">${escapeHtml(m[0])}</span>`;
    last = i + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

/** The one-sentence summary: the first line of the notes, markdown emphasis removed. */
export function firstSentence(parentNotes: string): string {
  const line = parentNotes.trim().split("\n")[0] ?? "";
  return line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();
}

export function publishedNotesEmail(args: { summary: string; portalUrl: string; childFirstName?: string; className?: string; updated?: boolean }) {
  const hi = args.updated
    ? (args.childFirstName ? `Notes for ${escapeHtml(args.childFirstName)} have been updated` : "Class notes have been updated")
    : (args.childFirstName ? `Notes for ${escapeHtml(args.childFirstName)} are ready` : "New class notes are ready");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px;">
<tr><td>
<h1 style="font-size:20px;margin:0 0 12px;color:#047857;">${hi}</h1>
${args.className ? `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">${escapeHtml(args.className)}</p>` : ""}
<p style="font-size:16px;line-height:1.6;margin:0 0 24px;">${arabicToHtml(args.summary)}</p>
<p style="margin:0 0 24px;"><a href="${escapeHtml(args.portalUrl)}" style="background:#059669;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">Read the full notes</a></p>
<p style="font-size:12px;color:#9ca3af;margin:0;">The full notes, homework and attendance are in your Talbiyah parent portal.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${hi}\n\n${args.summary}\n\nRead the full notes: ${args.portalUrl}`;
  return { html, text };
}

/** Reserved/test domains: never send real mail there (bounces hurt the sending domain's reputation). */
export function isTestAddress(email: string): boolean {
  return /@(example\.(com|org|net)|[^@]+\.(test|invalid|localhost|example))$/i.test(email.trim());
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function notesEmailSubject(args: { kind: "publish" | "update"; childNames: string[] }): string {
  const who = joinNames(args.childNames);
  const base = who ? `Class notes for ${who}` : "New class notes";
  return args.kind === "update" ? `${base} (updated)` : base;
}
