-- Patch existing email_templates rows so the campaign editor's color pickers
-- default to the FLOW brand accent (warm taupe #b8a490) instead of the generic
-- black / red / purple that shipped in email-marketing.sql.
--
-- Why it matters: these color vars drive price text, CTA buttons and discount
-- labels. The old primary_color "#000000" rendered the sale price in black on
-- the dark email background — effectively invisible. Brand components already
-- fall back to the taupe accent, but only when the value is empty; a seeded
-- default is not empty, so campaigns kept the off-brand color.
--
-- Idempotent: re-running only ever sets the same brand value.

update email_templates
set variables_schema = (
  select jsonb_agg(
    case
      when elem->>'type' = 'color'
       and elem->>'key' in ('primary_color', 'accent_color', 'urgency_color')
      then elem || '{"default": "#b8a490"}'::jsonb
      else elem
    end
  )
  from jsonb_array_elements(variables_schema) as elem
)
where variables_schema is not null
  and exists (
    select 1 from jsonb_array_elements(variables_schema) as e
    where e->>'type' = 'color'
      and e->>'key' in ('primary_color', 'accent_color', 'urgency_color')
  );
