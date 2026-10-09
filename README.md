# OrçaPrático

App web mobile first para autônomos (eletricistas, pedreiros etc.) criarem **orçamentos** e **recibos** em PDF, sem cadastro nem login.

- Dados do prestador e do cliente, itens, desconto, forma de pagamento, validade e observações.
- Assinatura digital opcional (desenhada na tela).
- Recibo com valor por extenso; orçamento aprovado vira recibo com um toque.
- Histórico separado em abas **Orçamentos** e **Recibos**, com busca, edição, duplicação e exclusão.
- PDF para compartilhar (WhatsApp, e-mail) ou baixar.
- Instalável no celular (PWA).

## Onde ficam os dados

No navegador do aparelho (`localStorage`). Não há servidor. Limpar os dados do navegador ou trocar de celular apaga tudo, então use **Meus dados → Baixar cópia** e **Restaurar**.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

React 19 + TypeScript + Vite + Tailwind 4, `HashRouter` (funciona no GitHub Pages sem configuração extra) e jsPDF.

## Deploy no GitHub Pages

1. Crie um repositório no GitHub e envie o código para a branch `main`.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica a cada push em `main`. O endereço fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
