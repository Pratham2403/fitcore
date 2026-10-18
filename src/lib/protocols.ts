import type { Protocol, StretchExercise, WarmupExercise } from '@/types'

// ─── Warmup Protocols ────────────────────────────────────────────────────────

const PUSH_WARMUP: WarmupExercise[] = [
  {
    name: 'Arm circles — forward then backward',
    duration: '30s',
    durationSecs: 30,
    joints: 'Glenohumeral · Scapulothoracic',
    how: 'Arms straight, rotate forward in large circles 10×, then backward 10×. Feel the shoulder blade moving around the ribcage.',
    tip: 'Start small and increase the circle size each rep. This primes the glenohumeral joint before any pressing.',
    muscleGroups: ['shoulders'],
  },
  {
    name: 'Wrist circles — both directions',
    duration: '30s',
    durationSecs: 30,
    joints: 'Wrist · Radioulnar',
    how: 'Make fists. Circle slowly clockwise 10×, then counter-clockwise 10×. Both wrists together.',
    tip: 'Crucial prep for bench press — prevents wrist strain under load. If you feel grinding, slow down and go through full ROM.',
    muscleGroups: ['forearms'],
  },
  {
    name: 'Shoulder CARs',
    duration: '45s',
    durationSecs: 45,
    joints: 'Glenohumeral · Scapulothoracic',
    how: 'Slow, deliberate full circles. Forward 5×, backward 5×. Feel every degree of range. Move from the shoulder blade, not just the arm.',
    tip: 'Full shoulder ROM before pressing. If anything catches or clicks, move more slowly through that range.',
    muscleGroups: ['shoulders'],
  },
  {
    name: 'Thoracic rotation — hands behind head',
    duration: '45s',
    durationSecs: 45,
    joints: 'T1–T12 · Thoracic spine',
    how: 'Feet shoulder-width. Hands lightly behind head, elbows wide. Rotate upper back as far as you can, keeping hips forward. Pause 1s at end range. Drive from mid-back, not neck.',
    tip: 'Unlocks thoracic spine for pressing. Most people are stuck here from sitting. This is non-negotiable before bench.',
    muscleGroups: ['back'],
  },
  {
    name: 'Cable pull-aparts — functional trainer, 2 × 15 (towel substitute if cable busy)',
    duration: '40s — 2×15',
    durationSecs: 40,
    joints: 'Posterior shoulder · Rear delts · Rhomboids',
    how: 'Attach cable rope at shoulder height on functional trainer. Hold both ends, arms straight. Pull apart horizontally — squeeze shoulder blades. Control return. If cable busy: hold towel at shoulder width and pull apart the same way.',
    tip: 'Primes rear delts before pressing — prevents anterior shoulder impingement. This is the single most important pre-press activation exercise.',
    muscleGroups: ['shoulders', 'back'],
  },
  {
    name: 'Rotator cuff external rotation — light DB',
    duration: '35s — 2×10 each',
    durationSecs: 35,
    joints: 'Rotator cuff · Infraspinatus · Teres minor',
    how: 'Elbow pinned to side at 90°. Rotate forearm outward 10× each arm. 2–3 kg only. Slow and controlled.',
    tip: 'Protects rotator cuff under pressing load. Use 2–3 kg only — this is activation, not strength work.',
    muscleGroups: ['shoulders'],
  },
  {
    name: 'Scapular wall slides',
    duration: '35s — 2×10',
    durationSecs: 35,
    joints: 'Scapulothoracic · Serratus anterior · Lower traps',
    how: 'Back flat against wall, arms at 90°. Slide arms up (overhead) keeping back and wrists against wall. Squeeze shoulder blades down and together at the bottom.',
    tip: 'Sets scapular position before bench. If you can\'t touch the wall with your wrists, your thoracic is stiff — keep working it.',
    muscleGroups: ['shoulders', 'back'],
  },
  {
    name: 'Warm-up set — light DB press × 10 at 50% working weight',
    duration: '30s',
    durationSecs: 30,
    joints: 'Chest · Shoulders · Triceps',
    how: 'A1 (Monday): Flat DB press × 10 at 50% of today\'s working weight — e.g. if working at 12.5 kg/hand, use 6 kg here. A2 (Thursday): Incline DB press at 45° × 10 at 50% of working weight. Prime the exact first movement.',
    tip: 'Always prime the exact movement you are about to perform. Do not use flat press as warmup on Thursday\'s incline day.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
  },
]

const PULL_WARMUP: WarmupExercise[] = [
  {
    name: 'March in place + jumping jacks',
    duration: '90s',
    durationSecs: 90,
    joints: 'Full body · Heart rate elevation',
    how: 'March 30s, then jumping jacks for 60s. Increase pace through the 90s.',
    tip: 'Heart rate needs to be elevated before rows and pull-ups. Cold muscles under pulling load = high injury risk.',
    muscleGroups: ['back', 'shoulders'],
  },
  {
    name: 'Neck CARs',
    duration: '40s',
    durationSecs: 40,
    joints: 'Cervical spine · C1–C7',
    how: 'Chin to chest → ear to shoulder → chin up → other side. Slow, deliberate circles. 5 each direction. Keep shoulders down throughout.',
    tip: 'Posture cue: imagine a string pulling the crown of your head upward as you circle.',
    muscleGroups: ['back'],
  },
  {
    name: 'Shoulder dislocates — towel wide grip',
    duration: '40s',
    durationSecs: 40,
    joints: 'Glenohumeral · Anterior shoulder · Thoracic',
    how: 'Hold towel wide (wider than shoulder width). Arms straight, raise over head and rotate behind you in a slow arc. If tight, widen grip. 10 reps.',
    tip: 'Opens anterior shoulder before rows. Do not force — widen grip until comfortable.',
    muscleGroups: ['shoulders', 'chest'],
  },
  {
    name: 'Dead hang — pull-up bar',
    duration: '2 × 20s',
    durationSecs: 40,
    joints: 'Shoulder · Spine decompression · Grip',
    how: 'Hang completely relaxed. Let gravity stretch you. Breathe deep. 20s, drop, shake out hands, repeat.',
    tip: 'Decompresses spine, primes grip, stretches lats. This is the single best pull-day warmup exercise.',
    muscleGroups: ['back', 'shoulders'],
  },
  {
    name: 'Cable face pulls — functional trainer, 2 × 15 (rear delt stretch if cable busy)',
    duration: '40s — 2×15',
    durationSecs: 40,
    joints: 'Rear delts · External rotators · Rhomboids',
    how: 'Rope attachment at eye height on functional trainer. Pull to forehead, elbows high and wide, 2 × 15 light. If cable busy: cross arm across chest, opposite hand pulls at elbow for 30s each side.',
    tip: 'Primes rear delts and external rotators before heavy pulling. Prevents posterior rotator cuff impingement.',
    muscleGroups: ['shoulders', 'back'],
  },
  {
    name: 'Scapular pull-ups',
    duration: '35s — 2×10',
    durationSecs: 35,
    joints: 'Scapulothoracic · Lower traps · Serratus',
    how: 'Hang from bar. Without bending elbows, depress and retract shoulder blades — body rises slightly. Hold 1s. Release. That\'s one rep.',
    tip: 'Activates the exact muscles that stabilize your shoulder blades during rows and pull-ups. Non-negotiable.',
    muscleGroups: ['back'],
  },
]

const LEGS_WARMUP: WarmupExercise[] = [
  {
    name: 'March in place + arm swings',
    duration: '2 min',
    durationSecs: 120,
    joints: 'Full body · Core temperature',
    how: 'March lifting knees high, arms swinging opposite to legs. Gradually increase pace over 2 minutes.',
    tip: 'Core temperature must be elevated before any joint-specific work — especially important for the knee.',
    muscleGroups: ['glutes', 'quads'],
  },
  {
    name: 'Hip circles — each leg each direction',
    duration: '45s — 10 each',
    durationSecs: 45,
    joints: 'Hip · Acetabulum · Femoral head',
    how: 'Stand on one leg (hold wall if needed). Draw large circles with raised knee — forward, out, back, in. Full ROM. 10 each direction, each leg.',
    tip: 'Primes the hip capsule. Most important leg warmup movement. Cold hips = knee compensation.',
    muscleGroups: ['glutes', 'quads'],
  },
  {
    name: 'Knee circles — feet together, both directions',
    duration: '30s',
    durationSecs: 30,
    joints: 'Knee · Patellofemoral · Synovial fluid',
    how: 'Feet together, hands on knees. Draw circles with both knees — 10 clockwise, 10 counter-clockwise. Slow and deliberate.',
    tip: 'Distributes synovial fluid around the patella before any loading. Critical for your knee health protocol.',
    muscleGroups: ['quads'],
  },
  {
    name: 'Ankle CARs — lift foot, trace full circles',
    duration: '40s — 10 each foot',
    durationSecs: 40,
    joints: 'Ankle · Subtalar · Talocrural',
    how: 'Lift one foot. Trace the largest possible circles with your toes — clockwise 10×, counter-clockwise 10×. Switch feet.',
    tip: 'Critical for flat foot — improves squat depth over time. The range will increase week by week.',
    muscleGroups: ['calves'],
  },
  {
    name: 'Calf raises — bodyweight, full ROM',
    duration: '30s — 15 reps',
    durationSecs: 30,
    joints: 'Ankle · Gastrocnemius · Soleus',
    how: 'Stand on flat ground. Lower heel fully, rise to full tiptoe. Slow, controlled. 15 reps.',
    tip: 'Ankle warm-up and flat foot correction. The heel-drop ROM is the therapeutic movement for your flat foot.',
    muscleGroups: ['calves'],
  },
  {
    name: 'Glute bridges — bodyweight',
    duration: '45s — 2×15, 2s squeeze',
    durationSecs: 45,
    joints: 'Glutes · Posterior chain · Lumbar stabilization',
    how: 'Lie on back, feet flat, knees bent. Drive hips up, squeeze glutes hard at top. Hold 2 seconds. Lower with control. Full hip extension — don\'t just lift hips, extend them.',
    tip: 'Cold glutes = lower back compensation on squats and deadlifts. This is non-negotiable knee protection.',
    muscleGroups: ['glutes', 'hamstrings'],
  },
  {
    name: 'Leg swings front/back',
    duration: '35s — 15 each leg',
    durationSecs: 35,
    joints: 'Hip flexion/extension · Hamstrings',
    how: 'Hold wall. Swing leg forward and back with control, gradually increasing amplitude. Keep swing controlled, not floppy. 15 reps each leg.',
    tip: 'Dynamic, not ballistic. Control through the full arc.',
    muscleGroups: ['hamstrings', 'quads'],
  },
  {
    name: 'Lateral leg swings',
    duration: '35s — 15 each leg',
    durationSecs: 35,
    joints: 'Adductors · Abductors · Hip IR/ER',
    how: 'Hold wall. Swing leg across body and out to the side. Increasing amplitude. 15 reps each leg.',
    tip: 'Opens adductors and abductors before squatting. Addresses the ankle stability and hip mobility combination.',
    muscleGroups: ['glutes', 'quads'],
  },
]

// ─── Stretch Protocols ────────────────────────────────────────────────────────

const PUSH_STRETCH: StretchExercise[] = [
  { name: 'Chest doorway stretch', duration: '30s × 2 sides', durationSecs: 60, muscleGroups: ['chest'] },
  { name: 'Cross-body shoulder stretch', duration: '30s each arm', durationSecs: 60, muscleGroups: ['shoulders'] },
  { name: 'Overhead tricep stretch', duration: '30s each arm', durationSecs: 60, muscleGroups: ['triceps'] },
  {
    name: 'Hip flexor standing stretch — wall support, no kneeling',
    duration: '30s each side',
    durationSecs: 60,
    muscleGroups: ['quads', 'core'],
  },
  { name: "Child's pose (modified — no deep knee bend)", duration: '45s', durationSecs: 45, muscleGroups: ['back', 'shoulders'] },
]

const PULL_STRETCH: StretchExercise[] = [
  { name: 'Lat stretch — arm overhead, lean sideways', duration: '30s each side', durationSecs: 60, muscleGroups: ['back'] },
  { name: 'Bicep wall stretch', duration: '30s each arm', durationSecs: 60, muscleGroups: ['biceps'] },
  {
    name: 'Forearm flexor stretch — prayer position, elbows out, press palms together and slightly down',
    duration: '20s',
    durationSecs: 20,
    muscleGroups: ['forearms'],
  },
  {
    name: 'Forearm extensor stretch — arm extended, use opposite hand to pull fingers down toward you',
    duration: '20s each arm',
    durationSecs: 40,
    muscleGroups: ['forearms'],
  },
  { name: 'Cat-cow — 10 slow reps', duration: '~60s', durationSecs: 60, muscleGroups: ['back', 'core'] },
  { name: 'Thread-the-needle thoracic rotation', duration: '20s each side', durationSecs: 40, muscleGroups: ['back', 'shoulders'] },
]

const LEGS_STRETCH: StretchExercise[] = [
  { name: 'Standing quad stretch — wall support, no kneeling', duration: '30s each leg', durationSecs: 60, muscleGroups: ['quads'] },
  { name: 'Lying hamstring stretch — on back, pull leg up', duration: '30s each leg', durationSecs: 60, muscleGroups: ['hamstrings'] },
  { name: 'Figure-4 glute stretch — lying on back', duration: '40s each side', durationSecs: 80, muscleGroups: ['glutes'] },
  { name: 'Calf wall stretch — straight leg (gastrocnemius)', duration: '30s each', durationSecs: 60, muscleGroups: ['calves'] },
  { name: 'Calf wall stretch — bent knee (soleus)', duration: '30s each', durationSecs: 60, muscleGroups: ['calves'] },
]

// ─── Recovery ──────────────────────────────────────────────────────────────────

const RECOVERY_WARMUP: WarmupExercise[] = [
  {
    name: 'Marching in place + dynamic arm and hip swings',
    duration: '2 min',
    durationSecs: 120,
    joints: 'Full body · Circulation',
    how: 'March at an easy pace, swinging arms naturally. Add a few hip and shoulder circles as you go. This is light activation, not a full joint-prep protocol — the bike ride that follows does the rest of the warming up.',
    tip: 'Today is low-intensity by design. Keep this brief and easy.',
    muscleGroups: ['glutes', 'quads'],
  },
]

const RECOVERY_STRETCH: StretchExercise[] = [
  ...LEGS_STRETCH,
  ...PUSH_STRETCH.filter(s => [
    'Chest doorway stretch',
    'Overhead tricep stretch',
    'Hip flexor standing stretch — wall support, no kneeling',
  ].includes(s.name)),
  ...PULL_STRETCH.filter(s => [
    'Lat stretch — arm overhead, lean sideways',
    'Forearm flexor stretch — prayer position, elbows out, press palms together and slightly down',
    'Forearm extensor stretch — arm extended, use opposite hand to pull fingers down toward you',
    'Cat-cow — 10 slow reps',
    'Thread-the-needle thoracic rotation',
  ].includes(s.name)),
  { name: 'Seated forward fold', duration: '45s', durationSecs: 45, muscleGroups: ['hamstrings', 'back'] },
]

// ─── Universal Full-Body Warmup (10 min Override) ────────────────────────────
// 4 phases: Elevation → Joint circles → Hip mobility flow → Dynamic activation
// Always accessible as an override from any workout's warmup

export const FULL_BODY_WARMUP: WarmupExercise[] = [
  // Phase 1 — Elevation (2 min)
  {
    name: 'Marching in place with arm swings',
    duration: '2 min',
    durationSecs: 120,
    joints: 'Phase 1: Elevation · Full body · Heart + circulation',
    how: 'March lifting knees to hip height. Swing arms forward and back, gradually increasing pace. Breathe through your nose.',
    tip: 'Primes joint fluid before any rotational work — never skip this.',
  },
  // Phase 2 — Joint circles (3 min)
  {
    name: 'Neck CARs',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 2: Joint circles · Cervical spine · C1–C7',
    how: 'Chin to chest → ear to shoulder → chin up → other side. Slow, deliberate circles. 5 each direction. Keep shoulders down.',
    tip: 'Imagine a string pulling the crown of your head upward as you circle.',
  },
  {
    name: 'Shoulder circles + arm swings',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 2: Joint circles · Glenohumeral · Scapulothoracic',
    how: 'Small circles → large circles → full windmill swings. Cross both arms across chest 10×. Feel the scapula winging open.',
    tip: 'Include scapular circles: squeeze blades together, then pull them apart and around.',
  },
  {
    name: 'Wrist + elbow circles',
    duration: '25s',
    durationSecs: 25,
    joints: 'Phase 2: Joint circles · Wrist · Radioulnar · Elbow',
    how: 'Wrists: make fists, circle slowly both ways 10×. Elbow: flex/extend fully then pronate/supinate forearm 10× each arm.',
    tip: 'Crucial if you bench, overhead press, or do pull-ups.',
  },
  {
    name: 'Thoracic spine rotation (hands behind head)',
    duration: '45s',
    durationSecs: 45,
    joints: 'Phase 2: Joint circles · T1–T12 · Thoracic spine',
    how: 'Feet shoulder-width. Hands lightly behind head, elbows wide. Rotate upper back as far as possible, keeping hips forward. Pause 1s at end range. Drive from mid-back, not neck.',
    tip: 'Most people have stuck T-spine from desk work. This unlocks overhead pressing and posture.',
  },
  {
    name: 'Hip circles',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 2: Joint circles · Hip · Acetabulum · Femoral head',
    how: 'Stand on one leg (hold wall if needed). Draw large circles with raised knee — forward, out, back, in. 10 each direction, each leg.',
    tip: 'Primes the hip capsule before the deeper mobility work in the next phase.',
  },
  {
    name: 'Knee circles + ankle rolls',
    duration: '30s',
    durationSecs: 30,
    joints: 'Phase 2: Joint circles · Knee · Patellofemoral · Ankle · Subtalar',
    how: 'Knees: feet together, hands on knees, draw circles both ways 10×. Ankles: lift one foot, trace full circles with toes 10×. Switch.',
    tip: 'Ankle mobility directly determines squat depth and knee safety.',
  },
  // Phase 3 — Hip mobility flow (3 min)
  {
    name: '90/90 hip flow (IR + ER)',
    duration: '70s',
    durationSecs: 70,
    joints: 'Phase 3: Hip mobility flow · Hip IR/ER · Piriformis · Psoas · Adductors',
    how: 'Sit on floor: front leg externally rotated, back leg internally rotated — both at 90°. Lean forward over front shin. Hold 5s at end range. Windshield-wiper to switch sides.',
    tip: 'The single most important hip mobility drill — targets IR and ER simultaneously, both halves most people never train.',
  },
  {
    name: "World's greatest stretch",
    duration: '60s',
    durationSecs: 60,
    joints: 'Phase 3: Hip mobility flow · Hip flexor · T-spine · Hamstring · Shoulder · Ankle',
    how: 'Step into deep lunge (right foot forward). Left hand on floor inside right foot. Rotate right arm up to ceiling, hold 3s. Drop elbow inside foot. Push back to hamstring stretch. Return to lunge. Switch sides.',
    tip: 'This single movement hits 6+ joints — used by elite athletes worldwide as a standalone drill.',
  },
  {
    name: 'Cat-cow + spinal segmentation',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 3: Hip mobility flow · Lumbar spine · Thoracic spine · Cervical',
    how: 'On all fours, exhale → round spine fully (cat). Inhale → arch spine, chest forward, tail up (cow). Move segment by segment from tailbone up through lumbar, thoracic, then neck. 10 slow reps.',
    tip: 'Posture reset: this reverses hours of forward-flexion sitting.',
  },
  // Phase 4 — Dynamic activation (2 min)
  {
    name: 'Leg swings — front/back + lateral',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 4: Dynamic activation · Hip flexion/extension · Adductors · Abductors',
    how: 'Hold a wall. Swing leg forward and back with control, gradually increasing amplitude. Then swing sideways. 15 reps each direction, each leg.',
    tip: 'Dynamic, not ballistic. Control through the full arc.',
  },
  {
    name: 'Glute bridge + hip thrust',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 4: Dynamic activation · Glutes · Posterior chain · Lumbar stabilization',
    how: 'Lie on back, feet flat, knees bent. Drive hips up, squeeze glutes hard at top. Hold 2 seconds. Lower with control. Full hip extension — do not just lift hips, extend them.',
    tip: 'Activates glutes before squats/deadlifts. Cold glutes = lower back compensation.',
  },
  {
    name: 'Inchworm walkout',
    duration: '40s',
    durationSecs: 40,
    joints: 'Phase 4: Dynamic activation · Hamstrings · Shoulders · Wrists · Core',
    how: 'Stand, hinge forward, hands to floor. Walk hands out to plank. Do 1 shoulder tap each side. Walk hands back to feet. Stand up. 5 full walkouts, controlled.',
    tip: 'Ties everything together — full body integration before your lifts.',
  },
]

export const WARMUP_PROTOCOLS: Record<Protocol, WarmupExercise[]> = {
  push: PUSH_WARMUP,
  pull: PULL_WARMUP,
  legs: LEGS_WARMUP,
  recovery: RECOVERY_WARMUP,
  full_body: FULL_BODY_WARMUP,
}

export const STRETCH_PROTOCOLS: Record<Protocol, StretchExercise[]> = {
  push: PUSH_STRETCH,
  pull: PULL_STRETCH,
  legs: LEGS_STRETCH,
  recovery: RECOVERY_STRETCH,
  full_body: RECOVERY_STRETCH,
}
