import json

from simulation import main as simulation_main
from wargame import models

_RANKING_MATCH_DURATION_MS = 60000

def run_match(player_a, ai_a, player_b, ai_b, max_duration_ms):
  spec = {
    'maxDurationMs': max_duration_ms,
    'players': [{
      'name': player_a,
      'logic': ai_a.logic
    }, {
      'name': player_b,
      'logic': ai_b.logic
    }]
  }
  return simulation_main.ValidateAndRun(spec)


def run_ranking_match(contest, ai_a, ai_b):
  username_a = ai_a.user.username
  username_b = ai_b.user.username
 
  match_course = run_match(username_a, ai_a, username_b, ai_b,
                           _RANKING_MATCH_DURATION_MS)
 
  match = models.Match()
  match.contest = contest

  match.player_a = ai_a.user
  match.logic_a = ai_a.logic
  match.ai_name_a = ai_a.name

  match.player_b = ai_b.user
  match.logic_b = ai_b.logic
  match.ai_name_b = ai_b.name

  match.course = json.dumps(match_course)
  match.outcome = _get_outcome(match_course, username_a, username_b)
  match.save()

  return match


def _get_outcome(match_course, username_a, username_b):
  outcome_frame = match_course[-1]
  assert outcome_frame['type'] == 'OUTCOME'

  if outcome_frame['outcome'] == 'TIE':
    return models.Match.TIE
  if outcome_frame['outcome'] == 'ERROR':
    return models.Match.ERROR
  elif outcome_frame['outcome'] == 'WINNER':
    return (models.Match.PLAYER_A_WON if outcome_frame['faction'] == username_a
            else Match.PLAYER_B_WON)
  elif outcome_frame['outcome'] == 'ERROR':
    return (models.Match.PLAYER_B_WON if outcome_frame['faction'] == username_a
            else Match.PLAYER_A_WON)
  else:
    assert False, "Unexpected outcome: %s" % outcome_frame

