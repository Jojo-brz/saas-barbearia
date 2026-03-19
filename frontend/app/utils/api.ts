// utils/api.ts

export async function fetchComSeguranca(
  url: string,
  options: RequestInit = {},
) {
  // 1. Pega o token automaticamente
  const token = localStorage.getItem("saas_token");

  // 2. Monta os cabeçalhos padrão
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 3. Faz a requisição ao Backend
  const res = await fetch(url, { ...options, headers });

  // 4. ==========================================
  // O SEU CÓDIGO DE SEGURANÇA CENTRALIZADO AQUI
  // ==========================================
  if (res.status === 401 || res.status === 404) {
    localStorage.removeItem("saas_token");
    localStorage.removeItem("saas_user");

    // Redireciona para o login (ajuste a rota se a sua for diferente)
    window.location.href = "/login";

    // Lança um erro para parar a execução do código na página que chamou
    throw new Error(
      "Sessão expirada ou barbearia não encontrada. Redirecionando...",
    );
  }

  // 5. Retorna a resposta limpa para a página usar
  return res;
}
