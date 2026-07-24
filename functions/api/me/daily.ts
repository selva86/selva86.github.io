// GET /api/me/daily - the signed-in learner's daily set (profile v3 pass 2).
//
// Three problems picked deterministically per (user, UTC day) by the shared
// selection core in _lib/daily.ts (the attempt flow's bonus check uses the
// same function, so display and award can never disagree). Pure read here;
// the +15 completion bonus is awarded by the attempt flow (flag:daily-set).

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err500 } from "../../_lib/errors";
import { computeDailySet, DAILY_BONUS_XP } from "../../_lib/daily";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    const set = await computeDailySet(context.env.DB, u.id);
    const bonusRow = await context.env.DB.prepare(
      "SELECT 1 AS x FROM xp_ledger WHERE user_id = ?1 AND action = 'daily.bonus' AND ref = ?2 LIMIT 1"
    ).bind(u.id, set.date).first<{ x: number }>().catch(() => null);
    return json({
      ...set,
      bonus_awarded: !!bonusRow,
      bonus_xp: DAILY_BONUS_XP,
    });
  } catch (e) {
    return err500(`daily set failed: ${String((e as Error)?.message || e)}`);
  }
};
