# Ministros da Palavra

Aplicativo web responsivo para organizar ministros, eventos, escalas e o histórico mensal do rodízio.

## Situação atual

- Interface inicial funcional em modo de demonstração; os exemplos ficam no armazenamento local deste navegador quando Supabase não está configurado.
- Cadastro de ministros com WhatsApp, cadastro de eventos com data e hora, escala com papel definido, confirmação de leitura, prioridade e link para abrir uma mensagem pré-preenchida no WhatsApp.
- PWA configurada para instalação na tela inicial.
- Login por e-mail/senha e operações de cadastro conectadas ao Supabase quando as variáveis de ambiente estiverem presentes.
- Migração inicial do Supabase em `supabase/migrations` e variáveis de ambiente de exemplo em `.env.example`.
- A escala passa a contar para a prioridade imediatamente; o histórico e os totais representam oportunidades de escala, sem confirmação de leitura.
- Ministros inativos podem ser reativados na própria tela de cadastro. Configurações permite criar eventos e manter o catálogo de papéis.
- Os dados de demonstração são fictícios. Ainda não representam a planilha da comunidade.

## Pré-requisitos

- Node.js 26 e npm (o Vite exige Node 20.19+ na linha 20 ou 22.12+ nas linhas seguintes).
- Projeto Supabase para persistência compartilhada; sem credenciais do Supabase, o aplicativo usa modo de demonstração local.

O projeto inclui `.node-version` com Node 26 para o `fnm` selecioná-lo ao entrar na pasta, quando a integração de shell estiver configurada.

## Executar localmente

1. Atualize o Node.js para uma versão LTS compatível.
2. Abra esta pasta no terminal e rode `npm install`.
3. Rode `npm run dev` e abra o endereço informado pelo Vite.

## Conectar ao Supabase

1. Crie um projeto Supabase e execute as migrações em ordem: `202611020001_initial_schema.sql` e `202611020002_role_catalog.sql`.
2. Copie `.env.example` para `.env.local` e informe a URL e a chave `anon` do projeto.
3. Desative o cadastro público. Convide os membros da equipe e defina `app_metadata.role` como `admin` ou `editor` para cada conta autorizada. O primeiro admin deve ser configurado pelo painel/SQL administrativo do Supabase.
4. Reinicie o servidor local. As políticas RLS da migração permitem acesso somente a contas autenticadas com uma dessas funções.

Não use a chave `service_role` no navegador.

## Próximos passos

- Implementar fluxo de convite de equipe dentro da área administrativa.
- Importar o arquivo XLSX/CSV real e revisar nomes/status antes de gravar.
- Criar, na importação, eventos históricos mensais e associações marcadas como realizadas.
- Configurar domínio HTTPS e publicar a versão de produção.
