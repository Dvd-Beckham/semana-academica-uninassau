-- Função chamada pelo site: recebe CPF + e-mail e devolve só nome e nº de presenças.

create or replace function consultar_certificado(p_cpf text, p_email text)
returns table (ok boolean, nome text, presencas integer, motivo text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aluno alunos%rowtype;
  v_presencas integer;
begin
  -- Compara CPF só com dígitos e e-mail em minúsculas (funciona mesmo que o cadastro varie)
  select * into v_aluno
  from alunos
  where regexp_replace(cpf, '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
    and lower(trim(email)) = lower(trim(p_email));

  if not found then
    -- Mesma resposta para qualquer erro de dados: ninguém descobre quais CPFs existem
    return query select false, null::text, 0, 'DADOS_NAO_CONFEREM'::text;
    return;
  end if;

  -- Conta eventos distintos: check-in repetido no mesmo evento conta uma vez
  select count(distinct evento_id)::integer into v_presencas
  from frequencia
  where aluno_id = v_aluno.id;

  if v_presencas < 1 then
    return query select false, null::text, 0, 'SEM_CHECKIN'::text;
    return;
  end if;

  -- Devolve só o necessário: nunca CPF, e-mail ou id
  return query select true, v_aluno.nome, v_presencas, null::text;
end;
$$;

-- Só o papel público do site pode chamar
revoke all on function consultar_certificado(text, text) from public;
grant execute on function consultar_certificado(text, text) to anon;
