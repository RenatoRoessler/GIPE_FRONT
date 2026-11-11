criar fluxo de enbording

deve criar um tur de onbonding ao usuário entrar no ssitema, deve passar por todos os modulos diponiveis e fazer uma explicação completada

endpoint para consultar se já fez o onbordin

/api/v1/Onboarding

{
"onboardingId": null,
"visualizado": false,
"dataVisualizacao": null
}

put
/api/v1/Onboarding
{
"visualizado": true
}
