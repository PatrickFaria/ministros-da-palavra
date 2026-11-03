# Ministros da Palavra

Aplicativo web para ajudar a equipe de liturgia a organizar os ministros da palavra, montar escalas para missas e eventos e acompanhar o rodízio ao longo do tempo.

O projeto foi pensado para funcionar também no celular. Quando publicado em HTTPS, pode ser instalado na tela inicial como um aplicativo (PWA).

## Recursos

- Cadastro de ministros com nome e número de WhatsApp opcional.
- Inativação, reativação e exclusão permanente de ministros inativos.
- Cadastro de missas e outros eventos com nome, data e horário.
- Exclusão de eventos com confirmação e remoção das escalações vinculadas.
- Catálogo configurável de tipos de evento, com opções iniciais para Missa e Evento.
- Escala de ministros por evento, com papel selecionado do catálogo ou informado como texto livre.
- Atalho para abrir uma mensagem pré-preenchida no WhatsApp com os dados do evento e o papel da pessoa.
- Tabela de rodízio mensal, ordenada por prioridade ou em ordem alfabética.
- Detalhes das escalações ao passar o mouse, navegar com o teclado ou tocar nos indicadores mensais. O histórico importado sem detalhes é identificado na tabela.
- Cadastro de novos tipos de papel e consulta de ministros inativos, com opção de reativá-los.
- Importação direta de agenda mensal em PDF: registra apenas eventos cujo nome contém “Missa Matriz”, separa cada horário e ignora duplicados.
- Importação de nomes e histórico mensal a partir de planilha `.xlsx` com participações registradas por cores.
- Tema claro e escuro.
- Modo de demonstração local para conhecer a interface sem configurar o Supabase.

## Tecnologias

- React 19
- Vite 7
- Supabase (Auth e PostgreSQL com políticas RLS)
- PDF.js para leitura de agendas mensais em PDF
- PWA com manifesto e ícones para instalação no dispositivo

## Requisitos

- Node.js 20.19 ou superior (ou 22.12 ou superior) e npm. O projeto inclui `.node-version` com Node 26 para uso com `fnm`.
- Um projeto Supabase para autenticação e armazenamento compartilhado. Em desenvolvimento local, sem as variáveis do Supabase, o app abre em modo de demonstração e salva os dados no navegador atual. Em produção, a falta de configuração bloqueia o acesso aos dados de demonstração.

## Rodar localmente

```bash
git clone https://github.com/PatrickFaria/ministros-da-palavra.git
cd ministros-da-palavra
npm install
npm run dev
```

Abra no navegador o endereço local que o Vite mostrar no terminal (normalmente `http://localhost:5173`).

### Modo de demonstração

Para testar a interface sem criar um projeto Supabase, basta instalar as dependências e iniciar o servidor com `npm run dev`. Em desenvolvimento local, o app apresenta dados de exemplo fictícios e guarda alterações no `localStorage` do navegador. Esses dados não são compartilhados com outros dispositivos.

Em uma compilação de produção sem as credenciais do Supabase, o app mostra uma tela de configuração e bloqueia o modo demonstração. Configure as duas variáveis de ambiente no serviço de hospedagem antes de publicar.

### Importar a planilha da comunidade

1. Conecte o app ao Supabase e aplique as cinco migrações.
2. Entre com uma conta autorizada, abra **Configurações** e selecione **Importar XLSX**.
3. Escolha o arquivo Excel. A prévia identifica os ministros e os meses, mostra as cores reconhecidas e impede a importação se houver cores desconhecidas ou nomes duplicados.
4. Informe o ano correspondente aos cabeçalhos mensais e revise o resumo antes de importar.

A importação registra uma participação por ministro e mês marcado em verde. Os tons de vermelho indicam ausência de participação e células sem preenchimento ficam sem registro. O histórico mensal não informa evento, horário ou papel, então a tela do rodízio o apresenta como histórico sem detalhes. A planilha original não contém WhatsApp; os contatos podem ser adicionados depois no cadastro dos ministros.

### Importar a agenda mensal em PDF

1. Abra **Configurações**, na seção **Eventos cadastrados**, e clique em **Importar PDF**.
2. Selecione a agenda mensal em PDF. A importação começa automaticamente e considera apenas nomes que contenham “Missa Matriz”.
3. Cada horário listado vira um evento separado. Eventos com o mesmo nome, data e horário já cadastrados são ignorados; ao final, o app mostra o resumo da importação.

O importador foi preparado para PDFs de texto no modelo de tabela da paróquia. PDF digitalizado como imagem ou com outra estrutura não é importado nesta versão.

## Configurar o Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No SQL Editor do projeto, execute os arquivos em ordem:
   - `supabase/migrations/202611020001_initial_schema.sql`
   - `supabase/migrations/202611020002_role_catalog.sql`
   - `supabase/migrations/202611020003_monthly_history_import.sql`
   - `supabase/migrations/202611020004_event_type_catalog.sql`
   - `supabase/migrations/202611020005_delete_inactive_ministers.sql`
3. Copie `.env.example` para `.env.local` e preencha as credenciais do projeto:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
   ```

4. No Supabase, convide as pessoas autorizadas a usar o aplicativo e atribua a elas o papel `admin` ou `editor` em `app_metadata.role`. O cadastro público deve permanecer desativado. O primeiro administrador precisa ser configurado por uma pessoa administradora no painel ou via SQL do Supabase.
5. Reinicie o servidor local para carregar as variáveis de ambiente.

As políticas RLS das migrações limitam as operações a usuários autenticados com um dos papéis autorizados. Nunca coloque a chave `service_role` no frontend ou em variáveis `VITE_*`.

## Publicar

Gere a versão otimizada para produção:

```bash
npm run build
```

O conteúdo pronto para publicação fica na pasta `dist/`. Publique essa pasta em um serviço de hospedagem para sites estáticos, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variáveis de ambiente de build e use HTTPS para habilitar a instalação como PWA. Para testar a versão compilada localmente:

```bash
npm run preview
```

## Organização do projeto

```text
public/                 Ícones, manifesto e service worker da PWA
src/                    Interface React e integração com o Supabase
src/lib/backend.js      Autenticação e acesso aos dados
supabase/migrations/    Estrutura do banco e políticas de acesso
.env.example            Modelo das variáveis de ambiente
```

## Próximos passos

- Criar o fluxo de convite e administração de acessos dentro do app.
- Publicar em um domínio HTTPS e validar o uso compartilhado com a equipe.

