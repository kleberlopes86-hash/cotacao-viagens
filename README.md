# ✈️ Sistema de Cotação de Viagens

Sistema de cotação que busca **dados reais** de voos, hotéis e carros na web,
usando a API do Claude com web search. O front-end é React (Vite) e há um
pequeno backend Node/Express que guarda sua chave da API com segurança.

## Por que existe um backend?

O navegador **não pode** chamar `api.anthropic.com` diretamente: a requisição
seria bloqueada (CORS) e exporia sua chave. O backend recebe o pedido do
front-end, adiciona a chave no servidor e chama a API com web search.

> Dentro do Claude.ai o app detecta o ambiente e chama a API direto, sem backend.

## Pré-requisitos

- **Node.js 20 ou superior** (necessário para `--env-file`). Verifique com `node -v`.
- Uma chave da API Anthropic: https://console.anthropic.com/settings/keys

## Instalação

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo .env a partir do exemplo
cp .env.example .env

# 3. Edite o .env e cole sua chave real
#    ANTHROPIC_API_KEY=sk-ant-...
```

## Como rodar

Em um único comando (sobe backend + front-end juntos):

```bash
npm start
```

Depois abra **http://localhost:5173** no navegador.

Se preferir rodar separados, use dois terminais:

```bash
npm run server   # backend na porta 8787
npm run dev      # front-end na porta 5173
```

## Como usar

1. Preencha **Projeto** e **Cliente** no topo.
2. Clique em **+** para criar uma opção de viagem.
3. Preencha origem, destino, datas e o tipo de bagagem.
4. Clique em **🤖 Pesquisar Voos / Hotéis / Carros** (ou **Pesquisar Tudo**).
   Os resultados vêm de buscas reais na web.
5. Use **📄 Ver Cotação** para o preview e **📋 Copiar HTML** para exportar.

## Solução de problemas

- **"Backend indisponível"** → o backend não está rodando. Use `npm run server`.
- **"ANTHROPIC_API_KEY não configurada"** → falta o `.env` ou a chave está vazia.
- **Erro de rate limit / créditos** → verifique seu saldo no console da Anthropic.
- **`--env-file` não reconhecido** → seu Node é antigo; atualize para a versão 20+.

## Estrutura

```
cotacao-app/
├── server.js          backend Express (chama a API com web search)
├── vite.config.js     proxy /api → backend
├── index.html
├── package.json
├── .env.example       modelo de variáveis (copie para .env)
└── src/
    ├── main.jsx       entry point
    └── App.jsx        o sistema de cotação completo
```
