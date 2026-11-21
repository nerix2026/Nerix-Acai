// Consulta o status de um pagamento. Se for um APOIO aprovado, soma na meta (no servidor) antes de responder.
const { creditarSeApoio, buscarPagamento } = require("../lib/meta");
exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).id;
  if (!id || !/^\d+$/.test(id)) return { statusCode: 400, body: JSON.stringify({ erro: "ID inválido" }) };
  try {
    const d = await buscarPagamento(id);
    try { await creditarSeApoio(d); } catch (e) { console.error("credito", e.message); }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: d.status }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ erro: "Erro interno" }) };
  }
};
