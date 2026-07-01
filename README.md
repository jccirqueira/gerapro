# GeraPro - SaaS de Engenharia Elétrica

**GeraPro** é uma aplicação web moderna para gestão de projetos elétricos, focada na criação ágil de propostas, orçamentos e definição de típicos de engenharia.

## 🚀 Funcionalidades

### Gestão
- **Clientes**: Cadastro completo de clientes.
- **Materiais**: Catálogo de peças com custos, markup e dados fiscais.
- **Típicos**: Construtor de blocos de engenharia (ex: Partida Direta 5CV).
- **Orçamentos**: Criação de propostas comerciais profissionais com cálculo automático de impostos.

### Sistema
- **Backup & Restore**: Porteira seus dados salvando/carregando arquivos JSON.
- **Configurações**: Personalize o nome da empresa, logo e dados fiscais.
- **Importação**: Importe listas de preços via CSV/Excel.

### Visual
- **Tema Industrial**: Interface limpa e técnica com Modo Escuro (Dark Mode).
- **Dashboard**: Gráficos de vendas e status de propostas.
- **Impressão Profissional**: Layout limpo para gerar PDFs de propostas.

## 🛠️ Tecnologia

Construído com **Vanilla JavaScript (ES Modules)**, HTML5 e CSS3 moderno.
- Sem dependências de build complexas (npm/webpack não obrigatórios para rodar).
- Persistência local (`LocalStorage`).
- Bibliotecas Externas (via CDN): `Chart.js` (Gráficos), `Phosphor Icons` (Ícones).

## 📦 Como Rodar

Este projeto utiliza Módulos ES6, o que exige um servidor HTTP local para evitar erros de CORS (Cross-Origin Resource Sharing).

### Opção Recomendada (Node.js)

1.  Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2.  Na pasta do projeto, rode:
    ```bash
    npm start
    ```
    Isso iniciará um servidor local e abrirá o navegador automaticamente.

### Alternativa (VS Code)

1.  Instale a extensão **Live Server**.
2.  Clique com o botão direito no arquivo `index.html` e escolha "Open with Live Server".

## 📝 Primeiros Passos

1.  Vá em **Configurações** e defina o nome da sua empresa.
2.  Use a aba **Importação** para carregar seus materiais (ou cadastre manualmente).
3.  Crie seus **Típicos** (padrões de montagem).
4.  Gere sua primeira proposta na aba **Orçamentos** e clique no ícone de Impressora.

## 📄 Licença

Uso Privado.
