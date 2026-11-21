// Webhook do Mercado Pago: credita o apoio mesmo que o apoiador feche a página antes da confirmação.
// Não confiamos no corpo recebido: o pagamento é sempre reconsultado na API do Mercado Pago.
const { creditarSeApoio, buscarPagamento } = require("../lib/meta");
exports.handler = async (event) => {
  try {
    let id = (event.queryStringParameters || {})["data.id"] || (event.queryStringParameters || {}).id;
    if (!id && event.body) { const b = JSON.parse(event.body); id = b.data && b.data.id; }
    if (id && /^\d+$/.test(String(id))) await creditarSeApoio(await buscarPagamento(id));
  } catch (e) { console.error("webhook", e.message); }
  return { statusCode: 200, body: "ok" };
};
