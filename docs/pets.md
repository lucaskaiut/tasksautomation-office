# Pets fixos

## Visao geral

Os pets `cat` e `dog` foram adicionados como atores autonomos da cena. Eles nao participam do runtime manual/realtime dos workers existentes. Em vez disso, cada pet executa uma maquina de acoes local que escolhe uma nova atividade aleatoria com duracao entre **5 e 20 segundos**.

As definicoes ficam em `src/office/petDefinitions.ts`:

- `PET_DEFINITIONS`: identidade, modelo, posicao inicial e escala do pet
- `PET_STATIONS`: pontos fixos de comida e agua usados pela acao de comer/beber

O comportamento fica em `src/office/PetActor.tsx`.

## Como as acoes funcionam

Cada pet fica sempre em uma das tres acoes abaixo:

1. `eat`
2. `wander`
3. `ask-for-petting`

Ao terminar a duracao da acao atual, o pet escolhe outra acao aleatoria.

### `eat`

Fluxo:

1. Escolhe aleatoriamente um ponto em `PET_STATIONS`
2. Toca `walk`
3. Anda ate a coordenada do pote escolhido
4. Ao chegar, troca para `eat`

Observacao:

- se o modelo nao tiver um clip chamado exatamente `eat`, o resolvedor tenta nomes alternativos como `eating`, `drink` e `drinking`
- se ainda assim nao encontrar, o fallback continua sendo o primeiro clip do GLB, seguindo o comportamento padrao do projeto

### `wander`

Fluxo:

1. Toca `walk`
2. Escolhe um alvo aleatorio dentro de `SCENE_CONFIG.actor.bounds`
3. Ao chegar, escolhe outro alvo aleatorio
4. Repete isso ate o tempo da acao terminar

### `ask-for-petting`

Fluxo:

1. Escolhe aleatoriamente um ator real dentre `OFFICE_ACTOR_DEFINITIONS`
2. Consulta a posicao atual desse ator pela `SceneActorRegistry`
3. Toca `walk` e vai ate perto do ator
4. Ao chegar, troca para `sit`

Essa acao usa a posicao real do worker, nao apenas o spawn, entao o pet acompanha o estado atual da cena.

## Registry de posicoes

Para permitir que os pets encontrem workers reais, foi adicionada `SceneActorRegistry` em `src/office/SceneActorRegistry.tsx`.

- `OfficeActor` registra sua posicao atual no mount
- `PetActor` consulta essa registry quando precisa escolher um alvo para `ask-for-petting`

Isso mantem os pets desacoplados do runtime dos workers.

## Preload e fallback de modelos

O boot em `src/main.tsx` agora tenta fazer preload dos modelos declarados em `PET_DEFINITIONS`.

No runtime do `PetActor`, o carregamento segue esta ordem:

1. tenta `/models/cat/model.glb` ou `/models/dog/model.glb`
2. se o asset nao estiver disponivel, faz fallback para `/models/character/model.glb`

Esse fallback evita quebrar a cena em ambientes onde os modelos finais do pet ainda nao foram publicados.
