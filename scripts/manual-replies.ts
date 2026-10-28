// manual-replies.ts — İnsan onaylı (Claude'un yazdığı) yorum yanıtları.
//   list : yanıtlanmamış yorumları kimlik + metin + gönderi bağlamıyla yazar (kullanıcı adı YOK).
//   post : replies/approved.json içindeki {commentId: metin} yanıtlarını gönderir.
//          Dosyada "approved": true yoksa hiçbir şey göndermez. Zaten yanıtlanmış yoruma yazmaz.
import { readFileSync, existsSync } from "node:fs";

const BASE = "https://graph.facebook.com/v26.0";
const UID = process.env.IG_FB_USER_ID || "17841442281703919";
const TOKEN = process.env.IG_PAGE_TOKEN || "";
if (!TOKEN) { console.log("::error::IG_PAGE_TOKEN yok"); process.exit(1); }

async function get(path: string, params: Record<string, string> = {}): Promise<any> {
  const u = new URL(BASE + path);
  for (const k of Object.keys(params)) u.searchParams.set(k, params[k]);
  u.searchParams.set("access_token", TOKEN);
  const r = await fetch(u);
  const j: any = await r.json();
  if (!r.ok) throw new Error(`GET ${path} → HTTP ${r.status}: ${j?.error?.message}`);
  return j;
}

async function myName(): Promise<string> { return (await get(`/${UID}`, { fields: "username" })).username; }

async function comments(): Promise<any[]> {
  const me = await myName();
  const out: any[] = [];
  let page: any = await get(`/${UID}/media`, { fields: "id,caption,comments_count,timestamp", limit: "25" });
  let scanned = 0;
  while (page && scanned < 60) {
    for (const m of page.data || []) {
      scanned++;
      if (!m.comments_count) continue;
      const c = await get(`/${m.id}/comments`, { fields: "id,text,username,timestamp,replies{username}", limit: "50" });
      for (const x of c.data || []) {
        if (x.username === me) continue;
        const replied = (x.replies?.data || []).some((r: any) => r.username === me);
        out.push({ id: x.id, text: x.text, time: x.timestamp, replied,
                   post: (m.caption || "").split("\n")[0].slice(0, 90), mediaId: m.id });
      }
    }
    if (!page.paging?.next || scanned >= 60) break;
    const nu = new URL(page.paging.next);
    page = await get(`/${UID}/media`, { fields: "id,caption,comments_count,timestamp", limit: "25", after: nu.searchParams.get("after") || "" });
  }
  return out;
}

function notice(title: string, lines: string[]) {
  const body = lines.map((l) => l.replace(/%/g, "%25").replace(/\r?\n/g, " ⏎ ")).join("%0A").slice(0, 60000);
  console.log(`::notice title=${title}::${body || "boş"}`);
}

async function main() {
  const mode = process.argv[2] || "list";
  const all = await comments();
  if (mode === "list") {
    const open = all.filter((c) => !c.replied);
    notice(`Yanıtsız yorumlar (${open.length}/${all.length})`,
      open.map((c) => `${c.id} | ${c.time.slice(0, 10)} | [${c.post}] | "${c.text.replace(/@[A-Za-z0-9_.]+/g, "@***")}"`));
    return;
  }
  if (mode === "post") {
    const f = "replies/approved.json";
    if (!existsSync(f)) { console.log("::error::replies/approved.json yok"); process.exit(1); }
    const doc = JSON.parse(readFileSync(f, "utf8"));
    if (doc.approved !== true) { console.log("::warning::approved: true değil — gönderilmedi"); return; }
    const byId: Record<string, any> = {};
    for (const c of all) byId[c.id] = c;
    const res: string[] = [];
    for (const id of Object.keys(doc.replies || {})) {
      const msg = String(doc.replies[id]).trim();
      const c = byId[id];
      if (!c) { res.push(`${id} | ATLANDI: yorum bulunamadı`); continue; }
      if (c.replied) { res.push(`${id} | ATLANDI: zaten yanıtlı`); continue; }
      if (!msg || /https?:|www\.|@/.test(msg) || msg.length > 300) { res.push(`${id} | ATLANDI: metin kuralı`); continue; }
      const u = new URL(`${BASE}/${id}/replies`);
      u.searchParams.set("access_token", TOKEN);
      const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const j: any = await r.json();
      res.push(r.ok ? `${id} | ✅ gönderildi` : `${id} | HATA HTTP ${r.status}: ${j?.error?.message}`);
      await new Promise((ok) => setTimeout(ok, 4000));
    }
    notice("Gönderim sonucu", res);
  }
}
main().catch((e) => { console.log(`::error::${String(e).replace(/access_token=[^&\s]+/g, "access_token=***")}`); process.exit(1); });
