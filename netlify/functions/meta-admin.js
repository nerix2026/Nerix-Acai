// Ajuste manual do total arrecadado, protegido por senha NO SERVIDOR (variável ADMIN_SENHA).
const { ajustarTotal } = require("../lib/meta");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return resp(405, { erro: "Método não permitido" });
  try {
    const { senha, acao, valor } = JSON.parse(event.body || "{}");
    const senhaEnv = (process.env.ADMIN_SENHA || "").trim();
    const senhaReq = String(senha || "").trim();
    if (!senhaEnv || senhaReq !== senhaEnv) {
      return resp(401, { erro: "Senha de administrador incorreta" });
    }
    const v = Number(valor);
    if (!["set", "soma"].includes(acao) || !isFinite(v) || v < 0 || v > 10000000) {
      return resp(400, { erro: "Valor inválido" });
    }
    const total = await ajustarTotal(acao, v);
    return resp(200, { total });
  } catch (e) {
    console.error("meta-admin erro:", e);
    return resp(500, { erro: e.message || "Erro interno no servidor" });
  }
};

const resp = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj),
});

