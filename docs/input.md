nome GIPE (Gestão Inteligente para Estacionamentos)

sistema com autenticação, só usuários logados pode acessar

criar um sistema de gestão para estacionamentos
layout deve ser bonito e atual

deve criar layout responsivo
e criar layout na versão web e mobile
deve ter as seguinte acçoes

# tela de login

campo para digitar CPF
campo para digitar a senha
botão de login
botão de recuperar senha

# tela de solicitação de recuperaração de senha

campo para digitar cpf
botão para recuperar senha
só abilitado o botão depois de digitar um cpf valido
apos o click mostrar um toask de sucesso dizendo que um email foi enviado para recuperação

# tela para alterar senha

tela deve ser acessa via link com um token temporario
campo senha
campor confirmar senha
botão alterar senha
depois de alterar volta para a tela de login

# cadastrar usuários

cpf
nome
sobrenome
funcao enum (
1 = adm
2 = caixa
3 = manobrista
4 = gerente
)
ativo

# listagem de usuários

lista a tabela de usuários e vai ter um botão de editar para cada usuário

# permições

listagem de perfis
ao clicar em um permil abre a tela na qual ele pode dar acessos aos menus

# Menu Preços

local aonde é cadastrado e atualizado os preços

# cadastro empresa convenio

    descricao
    cpnj
    endereco
    telefone

# Cadastrar preço

step
descricao string
empresa_conviniada (deve ser um select na "cadastro empresa convenio")
data inicio vigencia data
data fim vigencia data pode ser null
tolerancia entrada inteiro em minutos
tolerancia alteração faixa inteiro em minutos
periodo diaria inteiro em minutos
valor diaria float
valor adicional diaria float
tipo do preço select
(
enum 1 = padrao
2 = convenio
3 = promocional
4 = evento
)

step 2
tabela na qual pode ir adicionando
minumo 1
categoria enum (
1 = carro
2 = moto
3 = caminhonete
4 = suv
99 = todas
)

step 3
tabela na qual poden ir adicionando
minimo 1
dia semana (enum)
hora inicio
hora fim
data inicio
data fim
ativo

step 4
tabela na qual poden ir adicionando
minimo 1
minutos limite inteiro em minutos (30 minutos exemplo)
valor float
percentual conveniada 0 a 100 não obrigatorio

# listagem preço

vai mostrar uma tabela com os preços
vai poder clicar em editar

# Entrada de Veículos

    placa
    hora entrada
    categoria enum (
        1 = carro
        2 = moto
        3 = caminhonete
        4 = suv
        99 = todas
    )
    operador que a entrada (talvez não seja visual)
    botão dar entrada

# Saída de Veículos

    placa
    hora saida
    valor (vai ser via back)
    tempo de terminancia
    forma pagamento enum ()
    convenio
    botão gerar nota fiscal

# Tela para empresa conviniada dar desconto

    # código da entrada
    # digitar placa
    confirmar

# adsão ao sistema

step 1
cpnj
razao social
nome fantasia
endereço
telefone
tipo empresa (campo select)
( enum
1 = estacionamento
2 = lava rapido
3 = walet
4 = estacionamento + lava rapido
)
botão proximo

step 2
cadastar usuário adm
nome
sobrenome
email
cpf
senha
repetir senha
botão salvar
