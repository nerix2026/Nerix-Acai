// Cobra cartão (crédito ou débito) no Mercado Pago a partir do token gerado no navegador.
// Os dados do cartão NUNCA passam pelo seu servidor: só o token.
const { creditarSeApoio } = require("../lib/meta");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return resp(405, { erro: "Método não permitido" });
  try {
    const b = JSON.parse(event.body || "{}");
    const amount = Number(b.valor);
    const minimo = 1;
    if (!b.token || !b.payment_method_id) return resp(400, { erro: "Dados do cartão incompletos" });
    if (!amount || amount < minimo || amount > 5000) return resp(400, { erro: "Valor inválido" });

    const payload = {
      transaction_amount: Math.round(amount * 100) / 100,
      token: b.token,
      description: String(b.descricao || "Nérix Açaí").slice(0, 200),
      installments: 1,
      payment_method_id: b.payment_method_id,
      external_reference: String(b.pedido || ""),
      ...(process.env.URL ? { notification_url: process.env.URL + "/api/mp-webhook" } : {}),
      payer: { email: "cliente@nerixacai.com.br", first_name: String(b.nome || "Cliente").split(" ")[0] },
    };
    if (b.issuer_id) payload.issuer_id = Number(b.issuer_id);

    const r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${b.pedido}-${b.token}`,
      },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) return resp(r.status, { erro: d.message || "Pagamento recusado" });
    try { await creditarSeApoio(d); } catch (e) { console.error("credito", e.message); }
    return resp(200, { id: d.id, status: d.status, status_detail: d.status_detail });
  } catch (e) {
    return resp(500, { erro: "Erro interno" });
  }
};
const resp = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
