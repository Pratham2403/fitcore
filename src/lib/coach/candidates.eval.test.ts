import { describe, expect, it } from 'vitest'
import type { ConstraintWarning, ExperienceLevel, MovementPattern } from '@/types'
import catalogFixture from './__fixtures__/catalog.json'
import { MAX_CANDIDATES, selectCandidates, type CatalogCandidateRow } from './candidates'

// Offline evaluation of the shortlist against realistic profiles; gold lists are what a coach would plausibly program.
const CATALOG: CatalogCandidateRow[] = catalogFixture.map(row => ({ ...row, movementPattern: row.movementPattern as MovementPattern | null }))
const BY_ID = new Map(CATALOG.map(row => [row.id, row]))

const PATELLAR_SUBSTITUTES = [
  'Barbell_Ab_Rollout_-_On_Knees', 'Barbell_Full_Squat', 'Barbell_Walking_Lunge', 'Cable_Crunch', 'Dumbbell_Lunges', 'Freehand_Jump_Squat',
  'Front_Box_Jump', 'Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists', 'Kneeling_Cable_Triceps_Extension', 'Kneeling_High_Pulley_Row',
  'Kneeling_Hip_Flexor', 'Kneeling_Jump_Squat', 'Kneeling_Single-Arm_High_Pulley_Row', 'Kneeling_Squat', 'Narrow_Stance_Leg_Press',
  'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Weighted_Sissy_Squat',
]
const LR_IMBALANCE_SUBSTITUTES = [
  'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Curl', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Bent_Over_Barbell_Row',
  'Smith_Machine_Bench_Press', 'Standing_Military_Press',
]
const FULL_GYM = ['dumbbell', 'barbell', 'e-z curl bar', 'cable', 'machine', 'bands', 'other']
const CORE_PATTERNS: MovementPattern[] = [
  'squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'core',
]
const STRENGTH_CATEGORIES = ['strength', 'powerlifting', 'strongman']
const MIN_COVERAGE = 2
const FLOOR_MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 'lower back',
  'middle back', 'quadriceps', 'shoulders', 'traps', 'triceps',
]

interface Profile {
  name: string
  equipment: string[]
  experience: ExperienceLevel
  substituteIds: string[]
  requiredIds: string[]
  gold: string[]
  minGoldRecall: number
}

const PROFILES: Profile[] = [
  {
    name: 'beginner with home dumbbells',
    equipment: ['dumbbell'],
    experience: 'beginner',
    substituteIds: [],
    requiredIds: [],
    gold: [
      'Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'One-Arm_Dumbbell_Row', 'Bent_Over_Two-Dumbbell_Row', 'Dumbbell_Shoulder_Press',
      'Side_Lateral_Raise', 'Dumbbell_Bicep_Curl', 'Hammer_Curls', 'Pushups', 'fc_dumbbell_goblet_squat', 'Dumbbell_Squat', 'Dumbbell_Lunges',
      'Dumbbell_Rear_Lunge', 'Stiff-Legged_Dumbbell_Deadlift', 'fc_dumbbell_romanian_deadlift', 'Dumbbell_Flyes', 'Plank', 'Crunches',
      'Standing_Dumbbell_Calf_Raise', 'Single_Leg_Glute_Bridge', 'Bodyweight_Squat', 'Split_Squat_with_Dumbbells',
      'Standing_Dumbbell_Triceps_Extension', 'Dumbbell_Shrug', 'Reverse_Flyes', 'Incline_Push-Up', 'Dumbbell_Step_Ups',
    ],
    minGoldRecall: 1,
  },
  {
    name: 'full-gym intermediate with a patellar tendon constraint',
    equipment: [...FULL_GYM, 'kettlebells'],
    experience: 'intermediate',
    substituteIds: PATELLAR_SUBSTITUTES,
    requiredIds: [],
    gold: [
      'Barbell_Bench_Press_-_Medium_Grip', 'Incline_Dumbbell_Press', 'Barbell_Deadlift', 'Romanian_Deadlift', 'Pullups', 'Wide-Grip_Lat_Pulldown',
      'Seated_Cable_Rows', 'Bent_Over_Barbell_Row', 'Standing_Military_Press', 'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Face_Pull',
      'Leg_Press', 'Box_Squat', 'Barbell_Hip_Thrust', 'Lying_Leg_Curls', 'Seated_Leg_Curl', 'Dumbbell_Rear_Lunge', 'Barbell_Curl',
      'Triceps_Pushdown', 'Cable_Crossover', 'Standing_Calf_Raises', 'Seated_Calf_Raise', 'Farmers_Walk', 'Plank', 'Pallof_Press',
      'Barbell_Squat', 'Dumbbell_Step_Ups', 'Hammer_Curls', 'One-Arm_Dumbbell_Row', 'Chin-Up', 'Parallel_Bar_Dip',
    ],
    minGoldRecall: 1,
  },
  {
    name: 'advanced calisthenics',
    equipment: ['bands', 'other'],
    experience: 'advanced',
    substituteIds: [],
    requiredIds: [],
    gold: [
      'Pullups', 'Chin-Up', 'Muscle_Up', 'Parallel_Bar_Dip', 'Dips_-_Chest_Version', 'Ring_Dips', 'Pushups', 'Handstand_Push-Ups', 'Inverted_Row',
      'Hanging_Leg_Raise', 'Plank', 'Bodyweight_Squat', 'Bodyweight_Walking_Lunge', 'Single_Leg_Glute_Bridge', 'Freehand_Jump_Squat',
      'Decline_Push-Up', 'Plyo_Push-up', 'Band_Assisted_Pull-Up', 'Natural_Glute_Ham_Raise', 'Hanging_Pike', 'Push-Ups_-_Close_Triceps_Position',
      'Split_Squats', 'Ab_Roller', 'Superman', 'Mountain_Climbers', 'Dips_-_Triceps_Version',
    ],
    minGoldRecall: 0.9,
  },
  {
    // The owner's real coach-written program (supabase/seed/exercise_name_map.json) is the gold list.
    name: 'owner: beginner, full gym, knee/flat-foot/imbalance/pelvic-floor constraints',
    equipment: FULL_GYM,
    experience: 'beginner',
    substituteIds: [...PATELLAR_SUBSTITUTES, ...LR_IMBALANCE_SUBSTITUTES],
    requiredIds: ['fc_kegels', 'Seated_Calf_Raise', 'Standing_Dumbbell_Calf_Raise', 'fc_short_foot_exercise'],
    gold: [
      'Ab_Crunch_Machine', 'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Hip_Thrust', 'Bent_Over_Barbell_Row', 'Bicycling_Stationary', 'Butterfly',
      'Cable_Hammer_Curls_-_Rope_Attachment', 'Calf_Press_On_The_Leg_Press_Machine', 'Dumbbell_Bench_Press', 'Dumbbell_Bicep_Curl',
      'Dumbbell_Shoulder_Press', 'Elliptical_Trainer', 'Face_Pull', 'Flat_Bench_Lying_Leg_Raise', 'Hack_Squat', 'Hammer_Curls',
      'Hyperextensions_Back_Extensions', 'Incline_Dumbbell_Press', 'Leg_Extensions', 'Leg_Press', 'Leverage_Chest_Press',
      'Leverage_Incline_Chest_Press', 'Low_Cable_Crossover', 'Lying_Leg_Curls', 'Machine_Bicep_Curl', 'Machine_Shoulder_Military_Press',
      'Machine_Triceps_Extension', 'One-Arm_Dumbbell_Row', 'Plank', 'Reverse_Barbell_Curl', 'Reverse_Cable_Curl', 'Reverse_Machine_Flyes',
      'Romanian_Deadlift', 'Seated_Cable_Rows', 'Seated_Calf_Raise', 'Side_Lateral_Raise', 'Smith_Machine_Bench_Press', 'Smith_Machine_Calf_Raise',
      'Smith_Machine_Squat', 'Standing_Calf_Raises', 'Straight-Arm_Pulldown', 'Thigh_Abductor', 'Thigh_Adductor', 'Triceps_Pushdown_-_Rope_Attachment',
      'Underhand_Cable_Pulldowns', 'Walking_Treadmill', 'Wide-Grip_Lat_Pulldown', 'fc_assisted_chin_up_machine', 'fc_assisted_dip_machine',
      'fc_assisted_pull_up_machine', 'fc_decline_bench_leg_raise', 'fc_dumbbell_goblet_squat', 'fc_dumbbell_lateral_lunge',
      'fc_dumbbell_romanian_deadlift', 'fc_dumbbell_wrist_curl_both_directions', 'fc_kegels', 'fc_leg_press_wide_stance',
      'fc_seated_cable_row_wide_grip', 'fc_short_foot_exercise', 'fc_single_arm_cable_lateral_raise', 'fc_smith_machine_hip_thrust',
      'fc_sumo_goblet_squat', 'fc_terminal_knee_extension_cable',
    ],
    minGoldRecall: 0.9,
  },
]

const substitute = (id: string): ConstraintWarning => ({
  constraintType: 'patellar_tendon', action: 'substitute', warning: 'Swap', rationale: 'Load', safeAlternative: { id, name: id },
})

function evaluate(profile: Profile) {
  const warningsById = new Map(profile.substituteIds.map(id => [id, [substitute('safe')]]))
  const pool = selectCandidates(CATALOG, {
    equipment: profile.equipment, experience: profile.experience, preferredIds: [], requiredIds: profile.requiredIds,
  }, warningsById)
  const isEquipmentValid = (row: CatalogCandidateRow) =>
    row.equipment === null || row.equipment === 'body only' || profile.equipment.includes(row.equipment)
  const poolIds = new Set(pool.map(row => row.id))
  const feasibleGold = profile.gold.filter(id => {
    const row = BY_ID.get(id)
    return row !== undefined && isEquipmentValid(row) && (profile.requiredIds.includes(id) || !profile.substituteIds.includes(id))
  })
  const count = (predicate: (row: CatalogCandidateRow) => boolean) => pool.filter(predicate).length
  return { pool, poolIds, feasibleGold, isEquipmentValid, count }
}

describe.each(PROFILES)('candidate shortlist for $name', profile => {
  const { pool, poolIds, feasibleGold, isEquipmentValid, count } = evaluate(profile)

  it('respects the cap and has no duplicates', () => {
    expect(pool.length).toBeLessThanOrEqual(MAX_CANDIDATES)
    expect(poolIds.size).toBe(pool.length)
  })

  it('only uses available equipment and never includes an exercise a constraint rules out', () => {
    expect(pool.filter(row => !isEquipmentValid(row)).map(row => row.id)).toEqual([])
    expect(pool.filter(row => profile.substituteIds.includes(row.id)).map(row => row.id)).toEqual([])
  })

  it('includes the exercises a coach would program', () => {
    const recall = feasibleGold.filter(id => poolIds.has(id)).length / feasibleGold.length
    expect(recall).toBeGreaterThanOrEqual(profile.minGoldRecall)
  })

  it('covers every core movement pattern and every muscle the catalog can train with this equipment', () => {
    const feasible = (predicate: (row: CatalogCandidateRow) => boolean) => CATALOG.filter(row =>
      predicate(row) && isEquipmentValid(row) && STRENGTH_CATEGORIES.includes(row.category) && row.popularity > 0).length
    const expectCovered = (label: string, predicate: (row: CatalogCandidateRow) => boolean) =>
      expect(count(predicate), label).toBeGreaterThanOrEqual(Math.min(MIN_COVERAGE, feasible(predicate)))
    for (const pattern of CORE_PATTERNS) expectCovered(pattern, row => row.movementPattern === pattern)
    for (const muscle of FLOOR_MUSCLES) expectCovered(muscle, row => row.primaryMuscles[0] === muscle)
  })

  it('keeps unusual variants rare', () => {
    expect(count(row => row.popularity === 0) / pool.length).toBeLessThan(0.05)
  })
})
