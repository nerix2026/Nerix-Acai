exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };
  try {
    const { valor, descricao, nome, pedido } = JSON.parse(event.body || "{}");
    const amount = Number(valor);
    if (!amount || amount < 1 || amount > 5000) return resp(400, { erro: "Valor inválido" });

    const ref = String(pedido || `PED-${Date.now()}`);
    const descFinal = ref.startsWith("APOIO")
      ? (descricao || "Apoio - Meta Estados Unidos")
      : (descricao || `Pedido ${ref} - Nérix Açaí`);
    const primeiroNome = String(nome || "Cliente").trim().split(/\s+/)[0] || "Cliente";

    const r = await fetch("https://mercadopago.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${ref}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(amount * 100) / 100,
        description: String(descFinal).slice(0, 200),
        payment_method_id: "pix",
        external_reference: ref,
        ...(process.env.URL ? { notification_url: process.env.URL + "/api/mp-webhook" } : {}),
        payer: { email: "cliente@nerixacai.com.br", first_name: primeiroNome },
      }),
    });
    const d = await r.json();
    if (!r.ok) return resp(r.status, { erro: d.message || JSON.stringify(d) || "Falha ao gerar Pix" });
    const t = d.point_of_interaction.transaction_data;
    return resp(200, { id: d.id, qr_code: t.qr_code, qr_code_base64: t.qr_code_base64 });
  } catch (e) {
    return resp(500, { erro: e.message || "Erro interno" });
  }
};

const resp = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj),
});
