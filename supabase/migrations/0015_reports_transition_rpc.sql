-- 0015_reports_transition_rpc.sql
-- Atomic report status transition with note insert in a single transaction.
-- Replaces the two-step UPDATE + INSERT in application code.
-- Apply in Supabase SQL Editor after 0014.

-- ============================================================
-- transition_report_status RPC
-- Called exclusively by service role from server actions.
-- Returns jsonb: { ok: true } or { ok: false, error: "..." }
-- ============================================================
create or replace function transition_report_status(
  p_report_id  uuid,
  p_admin_id   uuid,
  p_to_status  text,
  p_reason     text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_from_status text;
  v_now         timestamptz := now();
  v_key         text;
begin
  -- Lock row to prevent concurrent transitions
  select status into v_from_status
  from reports
  where id = p_report_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Report not found');
  end if;

  -- Validate status values
  if p_to_status not in ('open','investigating','awaiting_information','escalated','resolved','dismissed') then
    return jsonb_build_object('ok', false, 'error', format('Unknown status: ''%s''', p_to_status));
  end if;

  -- State machine: mirror VALID_TRANSITIONS from reports-machine.ts
  if not (
    (v_from_status = 'open'                and p_to_status in ('investigating','dismissed')) or
    (v_from_status = 'investigating'        and p_to_status in ('awaiting_information','escalated','resolved','dismissed')) or
    (v_from_status = 'awaiting_information' and p_to_status in ('investigating','dismissed')) or
    (v_from_status = 'escalated'            and p_to_status in ('investigating','resolved','dismissed'))
  ) then
    return jsonb_build_object('ok', false, 'error',
      format('Cannot move from ''%s'' to ''%s''', v_from_status, p_to_status));
  end if;

  -- Reason required: mirror REASON_REQUIRED from reports-machine.ts
  v_key := v_from_status || '->' || p_to_status;
  if (p_reason is null or trim(p_reason) = '') and v_key = any(array[
    'open->dismissed',
    'investigating->escalated',
    'investigating->resolved',
    'investigating->dismissed',
    'awaiting_information->dismissed',
    'escalated->resolved',
    'escalated->dismissed'
  ]) then
    return jsonb_build_object('ok', false, 'error', 'A reason is required for this status change');
  end if;

  -- Update report (atomically with note insert below)
  update reports set
    status      = p_to_status,
    updated_at  = v_now,
    resolution  = case when p_to_status in ('resolved','dismissed') then trim(p_reason) else resolution end,
    resolved_at = case when p_to_status in ('resolved','dismissed') then v_now           else resolved_at end,
    resolved_by = case when p_to_status in ('resolved','dismissed') then p_admin_id      else resolved_by end
  where id = p_report_id;

  -- Insert note (same transaction — both succeed or both fail)
  insert into report_notes (report_id, admin_id, note, is_status_change, from_status, to_status)
  values (
    p_report_id,
    p_admin_id,
    coalesce(nullif(trim(p_reason), ''), 'Status changed to ' || p_to_status),
    true,
    v_from_status,
    p_to_status
  );

  return jsonb_build_object('ok', true, 'from_status', v_from_status, 'to_status', p_to_status);
end;
$$;

-- Service role only: revoke from every other role.
-- Application code calls this via createServiceClient() which uses SUPABASE_SERVICE_ROLE_KEY.
revoke execute on function transition_report_status(uuid,uuid,text,text) from public;
revoke execute on function transition_report_status(uuid,uuid,text,text) from anon;
revoke execute on function transition_report_status(uuid,uuid,text,text) from authenticated;

-- ============================================================
-- ROLLBACK
-- drop function if exists transition_report_status(uuid,uuid,text,text);
-- ============================================================
