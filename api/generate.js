export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { format, category, content, cta, question, hasCollaborator, collaborator, context, tone } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Conteúdo é obrigatório.' });
  }

  const prompt = `Você é um assistente de conteúdo do Steal The Look (STL), plataforma brasileira de moda, beleza e lifestyle. Sua função é criar legendas para o Instagram.

REGRAS FUNDAMENTAIS:
- A legenda APOIA o conteúdo, NUNCA resume ou repete o que está no carrossel/vídeo
- Tom: feminino, plural ("a gente", "nós", "por aqui"), conversacional e inteligente
- Usar "pra" no lugar de "para"
- Tudo minúsculo exceto nomes próprios e marcas
- Sem bullet points, sem listas, sem frases de efeito dramáticas
- Evitar: "incrível", "perfeito", "imperdível", "mergulhar", "explorar", "desvendar"
- Evitar termos técnicos em inglês que o público não domina
- Nomes de filmes e séries sempre entre aspas
- Marcas sem aspas

EMOJIS:
- Máximo de UM emoji por legenda, no final
- Muitas legendas não precisam de emoji
- Nunca repetir sempre o mesmo emoji
- Opções: ✨ ⚡ 💗 😂 💅 🤤
- Nunca usar no meio do texto

ESTRUTURA:
- Abertura: observação do cotidiano, pergunta provocadora ou dado concreto
- Desenvolvimento: complementa sem repetir o conteúdo
- CTA natural e direto
- #STEALTHELOOK sempre colado após o ponto final, sem quebra de linha

${hasCollaborator && collaborator ? `COLABORADORA: mencionar "${collaborator}" como "nossa colaboradora ${collaborator} investigou/foi atrás para entender" — nunca em primeira pessoa` : ''}

INFORMAÇÕES DO POST:
- Formato: ${format || 'não especificado'}
- Categoria: ${category || 'não especificada'}
- Conteúdo: ${content}
- CTA: ${cta || 'engajamento nos comentários'}
${question ? `- Pergunta sugerida para engajamento: ${question}` : ''}
${context ? `- Contexto adicional: ${context}` : ''}
- Tom: ${tone || 'padrão STL'}

Gere EXATAMENTE 3 opções de legenda, numeradas como OPÇÃO 1, OPÇÃO 2 e OPÇÃO 3. Cada uma deve ter uma abertura diferente. Não adicione explicações ou justificativas, apenas as legendas.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na API');
    }

    const text = data.content[0].text;
    return res.status(200).json({ result: text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao gerar legendas. Tente novamente.' });
  }
}
