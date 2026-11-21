// Utilitário compartilhado: soma/ajusta o total arrecadado no Firebase via API REST (sem depender de node_modules).
const META_INICIAL = 5.0;

function baseUrl() {
  return (process.env.FIREBASE_DATABASE_URL || "https://firebaseio.com").trim().replace(/\/+$/, "");
}

function authQuery() {
  const sec = (process.env.FIREBASE_DB_SECRET || "").trim();
  return sec ? `?auth=${encodeURIComponent(sec)}` : "";
}

const arred = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === "number" && isFinite(v) ? v : META_INICIAL);

async function creditarSeApoio(p) {
  const ref = String((p && p.external_reference) || "");
  const desc = String((p && p.description) || "");
  const ehApoio = ref.startsWith("APOIO") || desc.toLowerCase().includes("apoio - meta");
  if (!p || p.status !== "approved" || !ehApoio) return false;

  const valor = Number(p.transaction_amount);
  if (!(valor > 0)) return false;

  const url = `${baseUrl()}/config.json${authQuery()}`;
  const getRes = await fetch(url);
  if (!getRes.ok) return false;
  const cfg = (await getRes.json()) || {};
  const ok = cfg.apoiosOk || {};
  if (ok["p" + p.id]) return false;

  ok["p" + p.id] = valor;
  const novoTotal = arred(num(cfg.metaArrecadado) + valor);

  const patchRes = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apoiosOk: ok, metaArrecadado: novoTotal }),
  });
  return patchRes.ok;
}

async function ajustarTotal(acao, valor) {
  const url = `${baseUrl()}/config/metaArrecadado.json${authQuery()}`;
  const getRes = await fetch(url);
  const atual = getRes.ok ? await getRes.json() : META_INICIAL;
  const novoTotal = acao === "set" ? arred(valor) : arred(num(atual) + valor);

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novoTotal),
  });
  if (!putRes.ok) throw new Error("Falha ao gravar no Firebase");
  return novoTotal;
}

async function buscarPagamento(id) {
  const r = await fetch(`https://mercadopago.com{id}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
  });
  return r.json();
}

module.exports = { creditarSeApoio, ajustarTotal, buscarPagamento };
