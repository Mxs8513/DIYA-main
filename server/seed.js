'use strict';
require('dotenv').config();

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'diya.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Guard: don't double-seed ──────────────────────────────────────────────────
const existing = db.prepare("SELECT COUNT(*) as c FROM users WHERE email = 'dr.chen@university.edu'").get();
if (existing.c > 0) {
  console.log('✓ Database already seeded. Delete diya.db and re-run to reset.');
  process.exit(0);
}

console.log('🌱 Seeding D.I.Y.A database with CHEM 1301 demo data...\n');

const hash = (p) => bcrypt.hashSync(p, 12);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

// ── Users ─────────────────────────────────────────────────────────────────────
const profId = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, bio)
  VALUES (?, ?, ?, 'professor', ?)
`).run(
  'Dr. Sarah Chen',
  'dr.chen@university.edu',
  hash('demo1234'),
  'Associate Professor of Chemistry. Research focus: computational thermodynamics and reaction kinetics.'
).lastInsertRowid;

const students = [
  { name: 'Alex Rivera',    email: 'alex.r@uni.edu',    bio: 'Junior, Chemistry major. Pre-med track.' },
  { name: 'Priya Patel',    email: 'priya.p@uni.edu',   bio: 'Sophomore, Biochemistry. Loves lab work.' },
  { name: 'Marcus Johnson', email: 'marcus.j@uni.edu',  bio: 'Freshman, undecided. First chemistry course.' },
  { name: 'Zoe Kim',        email: 'zoe.k@uni.edu',     bio: 'Junior, Chemical Engineering.' },
].map(s => ({
  ...s,
  id: db.prepare(`INSERT INTO users (name, email, password_hash, role, bio) VALUES (?, ?, ?, 'student', ?)`
  ).run(s.name, s.email, hash('demo1234'), s.bio).lastInsertRowid,
}));

console.log(`  ✓ Created professor: dr.chen@university.edu`);
console.log(`  ✓ Created ${students.length} students (password: demo1234 for all)\n`);

// ── Group ─────────────────────────────────────────────────────────────────────
const groupId = db.prepare(`
  INSERT INTO groups (name, code, description, professor_id)
  VALUES (?, ?, ?, ?)
`).run(
  'CHEM 1301 — General Chemistry',
  'CHEM01',
  'Fundamentals of chemistry: atomic structure, bonding, stoichiometry, thermodynamics, and reaction kinetics. Fall 2026.',
  profId
).lastInsertRowid;

for (const s of students) {
  db.prepare('INSERT INTO group_members (user_id, group_id) VALUES (?, ?)').run(s.id, groupId);
}

console.log(`  ✓ Created group: "CHEM 1301 — General Chemistry" (code: CHEM01)\n`);

// ── Forum questions ───────────────────────────────────────────────────────────
const questions = [
  {
    user: students[0],
    title: 'What is the difference between ionic and covalent bonds?',
    body: 'I keep confusing myself when trying to figure out which type of bond forms between two elements. Is there a clear rule I can follow?',
    tags: 'bonding,chemistry',
    topic: 'Theory & Concepts',
    ai_answer: `Ionic and covalent bonds differ fundamentally in how electrons are shared between atoms.

**Ionic bonds** form when one atom fully transfers one or more electrons to another atom, creating oppositely charged ions that attract each other. This typically occurs between a metal and a nonmetal — for example, sodium (Na) donates an electron to chlorine (Cl), forming Na⁺ and Cl⁻ ions that make up table salt (NaCl). A useful rule of thumb: if the electronegativity difference between the two atoms is greater than 1.7, the bond is likely ionic.

**Covalent bonds** form when two atoms share electrons rather than transferring them. This occurs primarily between nonmetals. In a covalent bond, both atoms "count" the shared electrons toward their own valence shell. Water (H₂O) and carbon dioxide (CO₂) are classic examples. When atoms share equally, the bond is nonpolar covalent (e.g., H₂); when one atom attracts the electrons more strongly, the bond is polar covalent (e.g., H₂O).

**Practical shortcut**: Look at the electronegativity difference (ΔEN). ΔEN < 0.4 → nonpolar covalent; 0.4–1.7 → polar covalent; > 1.7 → ionic. You can find electronegativity values on the Pauling scale in your reference table.`,
    ai_status: 'verified',
    confidence: 0.91,
    routing_decision: 'normal',
    created_at: daysAgo(12),
  },
  {
    user: students[2],
    title: 'How do I balance chemical equations step by step?',
    body: 'I understand the concept of conservation of mass but I always seem to make arithmetic mistakes when balancing. What is a reliable method?',
    tags: 'stoichiometry,equations',
    topic: 'Theory & Concepts',
    ai_answer: `Balancing chemical equations is a systematic process — follow these steps every time and you'll avoid most errors.

**Step 1 — Write the unbalanced equation.** Start with correct chemical formulas for all reactants and products. Never change the subscripts; only add coefficients.

**Step 2 — Count atoms on each side.** Make a tally table for each element. For example, in CH₄ + O₂ → CO₂ + H₂O: Left side has C=1, H=4, O=2. Right side has C=1, H=2, O=3.

**Step 3 — Balance one element at a time.** Start with elements that appear in only one compound on each side (avoid O and H until last). In the example above: Carbon is already balanced (1=1). Add coefficient 2 in front of H₂O to balance hydrogen → H: 4=4. Now recount oxygen: Left O=2, Right O=2+1=4. Add coefficient 2 in front of O₂.

**Step 4 — Final check.** CH₄ + 2O₂ → CO₂ + 2H₂O. C: 1=1 ✓, H: 4=4 ✓, O: 4=4 ✓.

**Tip**: For more complex equations, try the algebraic method — assign variables (a, b, c...) as coefficients and solve the system of equations.`,
    ai_status: 'verified',
    confidence: 0.93,
    routing_decision: 'normal',
    created_at: daysAgo(11),
  },
  {
    user: students[1],
    title: "Can someone explain Le Chatelier's Principle with a real example?",
    body: "I understand that a system shifts to counteract stress but I'm not sure how to apply it when both concentration and temperature change at the same time.",
    tags: 'equilibrium,thermodynamics',
    topic: 'Theory & Concepts',
    ai_answer: `Le Chatelier's Principle states that if a system at equilibrium is disturbed by an external stress, the system will shift to partially counteract that stress and re-establish equilibrium.

**Classic example — the Haber process**: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + heat

1. **Increase [N₂]** → system shifts right (forward reaction) to consume the added N₂ and produce more NH₃.
2. **Decrease [NH₃]** → system shifts right to replace the removed product.
3. **Increase pressure** → system shifts toward the side with fewer moles of gas. Left side has 4 mol gas, right has 2 mol → shifts right.
4. **Increase temperature** → since the reaction is exothermic (releases heat), adding heat is like adding a product. System shifts left to absorb the added energy.

**When both concentration and temperature change**: Handle each stress independently and determine the net effect. If they oppose each other, compare the magnitude of each shift — in practice your professor will usually construct problems where one effect dominates.

**Memory trick**: Think of the equilibrium as a stubborn system that always fights back against whatever you do to it.`,
    ai_status: 'pending',
    confidence: 0.74,
    routing_decision: 'normal',
    created_at: daysAgo(10),
  },
  {
    user: students[3],
    title: 'How do I calculate the molar mass of a compound like H₂SO₄?',
    body: 'I need to find the molar mass for stoichiometry problems but keep making errors when there are subscripts inside parentheses.',
    tags: 'stoichiometry,molar-mass',
    topic: 'Theory & Concepts',
    ai_answer: `Calculating molar mass is straightforward once you have a systematic approach.

**For H₂SO₄ (sulfuric acid)**:
1. Identify each element: H, S, O
2. Count atoms from the formula: H=2, S=1, O=4
3. Look up atomic masses (from the periodic table): H=1.008, S=32.07, O=16.00
4. Multiply and sum: (2 × 1.008) + (1 × 32.07) + (4 × 16.00) = 2.016 + 32.07 + 64.00 = **98.09 g/mol**

**For compounds with parentheses** (e.g., Ca(OH)₂): The subscript outside the parentheses multiplies everything inside. Ca(OH)₂ has Ca=1, O=2, H=2. Mass = 40.08 + (2×16.00) + (2×1.008) = 74.09 g/mol.

**For hydrates** (e.g., CuSO₄·5H₂O): Add the molar mass of 5 water molecules. CuSO₄ = 159.61 + 5(18.02) = 249.71 g/mol.

Always use the atomic masses printed on your exam's periodic table, as they may be rounded differently than the ones above.`,
    ai_status: 'verified',
    confidence: 0.95,
    routing_decision: 'normal',
    created_at: daysAgo(9),
  },
  {
    user: students[0],
    title: "What's the difference between exothermic and endothermic reactions?",
    body: 'I always mix these up. Also, how does this relate to enthalpy (ΔH)?',
    tags: 'thermodynamics,enthalpy',
    topic: 'Theory & Concepts',
    ai_answer: `The key distinction is the direction of heat flow between the system (the reaction) and the surroundings.

**Exothermic reactions** release energy to the surroundings as heat. The products are at lower energy than the reactants — energy was stored in bonds and released when new bonds formed. ΔH is **negative** (the system loses enthalpy). Examples: combustion of methane (CH₄ + 2O₂ → CO₂ + 2H₂O, ΔH = −890 kJ/mol), hand warmers, respiration.

**Endothermic reactions** absorb energy from the surroundings. The products are at higher energy than the reactants — you must supply energy to break bonds. ΔH is **positive** (the system gains enthalpy). Examples: photosynthesis, dissolving ammonium nitrate in water (cold packs), cooking an egg.

**Enthalpy (ΔH) summary**:
- ΔH < 0 → exothermic → feels hot to the touch
- ΔH > 0 → endothermic → feels cold to the touch

**Bond energy perspective**: Every reaction breaks old bonds (requires energy input) and forms new ones (releases energy). Exothermic means the energy released forming new bonds exceeds the energy needed to break old ones. Endothermic is the reverse.`,
    ai_status: 'verified',
    confidence: 0.90,
    routing_decision: 'normal',
    created_at: daysAgo(9),
  },
  {
    user: students[2],
    title: 'How do I solve limiting reagent problems?',
    body: 'I set up the mole ratios but always end up picking the wrong limiting reagent. What am I doing wrong?',
    tags: 'stoichiometry,limiting-reagent',
    topic: 'Debugging & Testing',
    ai_answer: `Limiting reagent problems have a reliable method — if you're picking the wrong one, it's usually a mole ratio error. Here's the foolproof approach.

**Step 1 — Convert grams to moles** for each reactant using molar mass.

**Step 2 — Divide moles by stoichiometric coefficient** (the number in front of each substance in the balanced equation). This gives you the "mole ratio score" for each reactant.

**Step 3 — The reactant with the smallest score is the limiting reagent.**

**Example**: 2H₂ + O₂ → 2H₂O. You have 4 mol H₂ and 3 mol O₂.
- H₂ score: 4 mol ÷ 2 = 2.0
- O₂ score: 3 mol ÷ 1 = 3.0
- H₂ has the smaller score → H₂ is the limiting reagent.

**Common mistake**: Dividing by molar mass instead of the stoichiometric coefficient in step 2, or forgetting to balance the equation first.

**To find theoretical yield**: Use the moles of limiting reagent × mole ratio to product × molar mass of product.`,
    ai_status: 'verified',
    confidence: 0.87,
    routing_decision: 'normal',
    created_at: daysAgo(8),
  },
  {
    user: students[1],
    title: 'I need help understanding electron configuration and orbital notation',
    body: "I understand 1s² 2s² 2p⁶ for neon but when we get to transition metals with d orbitals I get completely lost. Especially the exceptions like Cr and Cu.",
    tags: 'atomic-structure,electron-config',
    topic: 'Theory & Concepts',
    ai_answer: `Electron configuration follows three rules: Aufbau principle (fill lowest energy orbitals first), Pauli exclusion principle (max 2 electrons per orbital, opposite spins), and Hund's rule (half-fill before pairing within a subshell).

**Order of filling**: 1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p → 5s → 4d... (use the diagonal rule or the periodic table blocks).

**Transition metals**: For chromium (Cr, Z=24), the "expected" config is [Ar] 3d⁴ 4s², but the actual config is [Ar] 3d⁵ 4s¹. This is because a half-filled d subshell (d⁵) has extra stability due to symmetrical electron distribution and exchange energy. Similarly, copper (Cu, Z=29) is [Ar] 3d¹⁰ 4s¹ rather than [Ar] 3d⁹ 4s² — a completely filled d subshell (d¹⁰) is also especially stable.

**The exceptions to memorize**: Cr ([Ar] 3d⁵ 4s¹) and Cu ([Ar] 3d¹⁰ 4s¹) are the most commonly tested. Mo and Ag follow the same pattern in the row below.

**Shortcut**: Write the noble gas core in brackets, then fill remaining electrons following the Aufbau order, watching for d⁵ and d¹⁰ stability exceptions.`,
    ai_status: 'pending',
    confidence: 0.48,
    routing_decision: 'low_confidence',
    escalation_reason: 'AI confidence score 48% is below threshold — complex topic with known exceptions',
    created_at: daysAgo(7),
  },
  {
    user: students[3],
    title: 'How does titration work and how do I calculate the unknown concentration?',
    body: 'We have a lab next week and I want to understand the theory before we start. Specifically for acid-base titration.',
    tags: 'lab,titration,acid-base',
    topic: 'Projects & Assignments',
    ai_answer: `Titration is a technique to determine the unknown concentration of a solution by reacting it with a solution of known concentration (the titrant) until the reaction is complete (the equivalence point).

**Acid-Base titration process**:
1. Place a measured volume of the unknown solution (analyte) in a flask with an indicator (e.g., phenolphthalein for strong acid/base titrations).
2. Fill the burette with the titrant of known concentration.
3. Add titrant slowly, swirling constantly. The indicator changes color at the endpoint (which approximates the equivalence point).
4. Record the volume of titrant used.

**The key calculation** uses the relationship: moles of acid = moles of base at equivalence point.

For a monoprotic acid-base system: M_acid × V_acid = M_base × V_base

**Example**: You titrate 25.0 mL of HCl (unknown) with 0.100 M NaOH. It takes 32.5 mL of NaOH to reach the endpoint.
M_HCl = (0.100 mol/L × 0.0325 L) / 0.0250 L = **0.130 M**

**For polyprotic acids** (H₂SO₄, H₃PO₄), include the number of protons: M_acid × V_acid × n = M_base × V_base, where n = number of acidic protons reacting.`,
    ai_status: 'verified',
    confidence: 0.83,
    routing_decision: 'normal',
    created_at: daysAgo(6),
  },
  {
    user: students[0],
    title: 'What are the rules for significant figures and when do I round?',
    body: 'I keep losing points on sig figs. I thought I understood the rules but my answers keep coming out wrong.',
    tags: 'significant-figures,math',
    topic: 'Theory & Concepts',
    ai_answer: `Significant figures (sig figs) represent the precision of a measurement. Here are the complete rules.

**Identifying sig figs in a number**:
1. All nonzero digits are significant: 3.45 has 3 sig figs.
2. Zeros between nonzero digits are significant: 3.045 has 4 sig figs.
3. Leading zeros are NOT significant: 0.0045 has 2 sig figs.
4. Trailing zeros after a decimal point ARE significant: 3.450 has 4 sig figs.
5. Trailing zeros in a whole number are ambiguous — use scientific notation: 3400 could be 2, 3, or 4 sig figs; write 3.4 × 10³ (2 sig figs) to be clear.

**Rounding rules for calculations**:
- **Multiplication/Division**: The answer has the same number of sig figs as the measurement with the fewest sig figs. (2.5 × 3.42 = 8.6, not 8.55)
- **Addition/Subtraction**: The answer is rounded to the least number of decimal places. (12.52 + 1.7 = 14.2, not 14.22)

**Common mistakes**: Applying the multiplication rule to addition, or counting zeros incorrectly. When in doubt, write in scientific notation — the number of digits shown is always the number of sig figs.`,
    ai_status: 'verified',
    confidence: 0.94,
    routing_decision: 'normal',
    created_at: daysAgo(5),
  },
  {
    user: students[2],
    title: 'Is the midterm going to cover electrochemistry or just through thermodynamics?',
    body: 'The syllabus is a bit vague and I want to know what to prioritize in my studying.',
    tags: 'exam,midterm',
    topic: 'Exam Preparation',
    ai_answer: `I can provide general guidance on exam preparation, but I don't have access to your specific course syllabus, your professor's exam scope, or any announcements made in class. For the exact coverage of your midterm, please check your course management system (Canvas, Blackboard, etc.), your syllabus, or ask Dr. Chen directly.

Generally speaking, in a General Chemistry course, thermodynamics and electrochemistry are often grouped or separated by where the course divides. Topics that commonly appear together in a first midterm include atomic structure, bonding, stoichiometry, and basic thermodynamics. Electrochemistry typically appears later in the semester.

That said, your safest approach is to review everything up to the most recent lecture and prioritize any topics your professor has emphasized or spent extra time on. Review past problem sets — exam questions very often mirror homework problems in structure.`,
    ai_status: 'pending',
    confidence: 0.36,
    routing_decision: 'low_confidence',
    escalation_reason: 'AI confidence score 36% is below threshold — question requires class-specific information the AI does not have',
    created_at: daysAgo(4),
  },
  {
    user: students[1],
    title: 'What topics should I prioritize for the final exam?',
    body: 'With everything we covered this semester I am overwhelmed. What are the most important concepts to review first?',
    tags: 'exam,final,study',
    topic: 'Exam Preparation',
    ai_answer: `While I can suggest general high-yield chemistry topics, I don't have visibility into your specific course outline or what Dr. Chen has indicated will be emphasized. I'd strongly recommend checking any review materials posted on the course page or attending any review sessions offered.

For a typical General Chemistry course, the concepts that appear most heavily on finals include: stoichiometry and limiting reagents (foundational, shows up in calculations everywhere), equilibrium and Le Chatelier's principle, acid-base chemistry and pH calculations, thermodynamics (ΔH, ΔG, ΔS and their relationships), and electrochemistry (cell potentials, Faraday's law).

A practical study strategy: work through every problem set from the semester and categorize your mistakes by topic. The topics where you made the most errors are the ones to prioritize. Understanding why you got something wrong is more valuable than re-reading the textbook.`,
    ai_status: 'pending',
    confidence: 0.39,
    routing_decision: 'low_confidence',
    escalation_reason: 'AI confidence score 39% is below threshold — requires course-specific information',
    created_at: daysAgo(3),
  },
  {
    user: students[3],
    title: 'How do I set up and use the ChemDraw virtual lab simulation?',
    body: 'I downloaded it but I get an error when trying to open the lab module. "Module not found: chem_lab_base"',
    tags: 'software,setup,lab',
    topic: 'Development Environment',
    ai_answer: `I can offer general troubleshooting advice, but I'm not familiar with the specific ChemDraw virtual lab module your course uses, so for the "Module not found: chem_lab_base" error in particular, the course IT support or your lab TA will have the authoritative fix.

**General steps to try**:
1. Fully uninstall and reinstall the software — corrupted installs often produce "module not found" errors.
2. Check that you downloaded the correct version for your operating system (32-bit vs 64-bit, Windows vs Mac).
3. Run the application as administrator (right-click → "Run as administrator" on Windows).
4. Check whether the software requires a VPN connection to the university network to authenticate.
5. Look for a "lab module" or "plugin" installer that may be separate from the main application installer.

If none of these work, contact the course TA or check the software setup guide linked in your course materials — setup issues like this are common at the start of semester and TAs usually have a step-by-step fix ready.`,
    ai_status: 'pending',
    confidence: 0.42,
    routing_decision: 'low_confidence',
    escalation_reason: 'AI confidence score 42% is below threshold — tool-specific error requiring course IT knowledge',
    created_at: daysAgo(2),
  },
  {
    user: students[0],
    title: 'Can you explain the ideal gas law and when PV=nRT breaks down?',
    body: 'I understand PV=nRT for ideal conditions but my professor mentioned real gases deviate. When does this matter and what equation do we use instead?',
    tags: 'gas-laws,thermodynamics',
    topic: 'Theory & Concepts',
    ai_answer: `The ideal gas law PV = nRT assumes two things that are never perfectly true: (1) gas molecules have zero volume, and (2) there are no intermolecular attractions between them. Under most everyday conditions these approximations work well enough, but they break down at extremes.

**When PV = nRT breaks down**:
- **High pressure**: molecules are forced close together, so their actual volume becomes non-negligible compared to the container volume. The gas is more compressed than the ideal law predicts.
- **Low temperature**: molecules slow down and intermolecular attractions become significant. The gas is more compressed than ideal (attractions pull molecules together) at moderately low T, and less compressed at very high pressure (volume exclusion dominates).
- **Polar or large molecules** (e.g., NH₃, CO₂) deviate more than noble gases or H₂ because they have stronger intermolecular forces.

**The van der Waals equation** accounts for both corrections:
(P + a(n/V)²)(V − nb) = nRT

Where *a* corrects for intermolecular attractions (higher a = stronger forces) and *b* corrects for molecular volume (higher b = larger molecules). Values of a and b are tabulated constants specific to each gas.

For your exams, you'll mostly use PV = nRT unless specifically told to use van der Waals or given a and b constants.`,
    ai_status: 'verified',
    confidence: 0.88,
    routing_decision: 'normal',
    created_at: hoursAgo(20),
  },
  {
    user: students[2],
    title: 'How do I calculate molarity from a given mass of solute?',
    body: 'If I dissolve 5.85g of NaCl in 500mL of water, what is the molarity? And what if I need to dilute it?',
    tags: 'solutions,molarity,concentration',
    topic: 'Theory & Concepts',
    ai_answer: `Molarity (M) is defined as moles of solute per liter of solution. Here's the full calculation for your NaCl example.

**Step 1 — Convert grams to moles**: Molar mass of NaCl = 22.99 (Na) + 35.45 (Cl) = 58.44 g/mol. Moles of NaCl = 5.85 g ÷ 58.44 g/mol = 0.1001 mol.

**Step 2 — Convert mL to L**: 500 mL = 0.500 L.

**Step 3 — Calculate molarity**: M = 0.1001 mol ÷ 0.500 L = **0.200 M NaCl**.

**For dilutions**, use the dilution equation: M₁V₁ = M₂V₂

Where M₁ and V₁ are the initial (concentrated) solution values, and M₂ and V₂ are the final (diluted) values. Solve for whatever is unknown.

**Example**: You want 250 mL of 0.100 M NaCl from your 0.200 M stock. V₁ = (0.100 M × 250 mL) / 0.200 M = 125 mL. Take 125 mL of the stock solution and add water until total volume is 250 mL.

**Important**: Always add concentrated solution to water, never the reverse — especially critical for acids.`,
    ai_status: 'verified',
    confidence: 0.92,
    routing_decision: 'normal',
    created_at: hoursAgo(10),
  },
];

// Insert all questions
const insertedQIds = [];
for (const q of questions) {
  const res = db.prepare(`
    INSERT INTO forum_questions
    (group_id, user_id, title, body, tags, topic, ai_answer, ai_status, confidence_score, routing_decision, escalation_reason, rag_sources, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(
    groupId, q.user.id, q.title, q.body, q.tags, q.topic,
    q.ai_answer, q.ai_status, q.confidence, q.routing_decision,
    q.escalation_reason || null, q.created_at
  );
  insertedQIds.push(res.lastInsertRowid);
}

console.log(`  ✓ Inserted ${questions.length} forum questions with AI answers\n`);

// ── Replies ────────────────────────────────────────────────────────────────────
db.prepare(`INSERT INTO forum_replies (question_id, user_id, body, created_at)
  VALUES (?, ?, ?, ?)`).run(
  insertedQIds[0], profId,
  "Great question. Just to add to the AI's explanation: a quick test is to ask whether the compound is formed from a metal + nonmetal combination. If yes, start with ionic as your hypothesis, then check ΔEN to confirm.",
  daysAgo(11)
);
db.prepare(`INSERT INTO forum_replies (question_id, user_id, body, created_at)
  VALUES (?, ?, ?, ?)`).run(
  insertedQIds[0], students[1].id,
  "The electronegativity difference shortcut really helped me — I had been trying to memorize which pairs make ionic bonds instead of just looking at ΔEN.",
  daysAgo(10)
);
db.prepare(`INSERT INTO forum_replies (question_id, user_id, body, created_at)
  VALUES (?, ?, ?, ?)`).run(
  insertedQIds[5], students[3].id,
  "I was making this exact mistake! I was dividing by molar mass in step 2 instead of the coefficient. Makes so much more sense now.",
  daysAgo(7)
);

// ── Workflow items ─────────────────────────────────────────────────────────────
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const qId = insertedQIds[i];
  const isEscalated = q.routing_decision === 'low_confidence' || q.routing_decision === 'escalated';
  const isResolved = q.ai_status === 'verified';

  db.prepare(`
    INSERT INTO workflow_items
    (question_id, group_id, status, routing_decision, confidence_score, topic, escalation_reason, resolved_by, resolved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    qId, groupId,
    isResolved ? 'resolved' : isEscalated ? 'escalated' : 'processed',
    q.routing_decision,
    q.confidence,
    q.topic,
    q.escalation_reason || null,
    isResolved ? profId : null,
    isResolved ? q.created_at : null,
    q.created_at
  );
}

console.log(`  ✓ Created workflow items for all questions\n`);

// ── Approved answers ──────────────────────────────────────────────────────────
// Verified questions get added to approved answers
const verifiedIdxs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.ai_status === 'verified');
for (const { q, i } of verifiedIdxs) {
  db.prepare(`
    INSERT INTO approved_answers (group_id, source_question_id, topic, question_pattern, answer, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(groupId, insertedQIds[i], q.topic, q.title, q.ai_answer, profId, q.created_at);
}

console.log(`  ✓ Created ${verifiedIdxs.length} approved answers from verified questions\n`);

// ── Confusion clusters ────────────────────────────────────────────────────────
db.prepare(`
  INSERT INTO confusion_clusters (group_id, topic, question_count, severity, status, first_seen, last_seen)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(groupId, 'Theory & Concepts', 9, 'critical', 'open', daysAgo(12), hoursAgo(10));

db.prepare(`
  INSERT INTO confusion_clusters (group_id, topic, question_count, severity, status, first_seen, last_seen)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(groupId, 'Exam Preparation', 3, 'medium', 'intervention_sent', daysAgo(4), daysAgo(3));

db.prepare(`
  INSERT INTO confusion_clusters (group_id, topic, question_count, severity, status, first_seen, last_seen)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(groupId, 'Development Environment', 1, 'low', 'open', daysAgo(2), daysAgo(2));

console.log(`  ✓ Created 3 confusion clusters\n`);

// ── Interventions ─────────────────────────────────────────────────────────────
const clusterIdExam = db.prepare("SELECT id FROM confusion_clusters WHERE group_id = ? AND topic = 'Exam Preparation'").get(groupId)?.id;

db.prepare(`
  INSERT INTO interventions (group_id, cluster_id, type, title, content, created_by, status, outcome_before, outcome_after, effectiveness, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  groupId, clusterIdExam,
  'announcement',
  'Midterm Coverage Clarification',
  `Dear class,

I've noticed several questions about what the midterm will cover, so I want to clarify directly. The midterm will cover all material from Weeks 1–7: atomic structure, chemical bonding, stoichiometry, and thermodynamics through Hess's Law. Electrochemistry will NOT be on the midterm — that begins in Unit 3.

I will post a topic outline on Canvas by end of day Thursday. Office hours this week are extended to Tuesday and Thursday 3–5pm.

— Dr. Chen`,
  profId,
  'sent',
  3, 1, 66.7,
  daysAgo(3)
);

console.log(`  ✓ Created 1 intervention with 66.7% effectiveness\n`);

// ── Office hour requests ──────────────────────────────────────────────────────
db.prepare(`
  INSERT INTO office_hour_requests (group_id, student_id, subject, description, status, preferred_time, scheduled_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  groupId, students[2].id,
  'Help with stoichiometry limiting reagent problems',
  "I've been practicing but still make errors on multi-step limiting reagent problems. Could we work through a few examples together?",
  'approved',
  'Thursday afternoon',
  new Date(Date.now() + 2 * 86400000).toISOString(),
  daysAgo(5)
);

db.prepare(`
  INSERT INTO office_hour_requests (group_id, student_id, subject, description, status, preferred_time, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  groupId, students[1].id,
  'Electron configuration exceptions for transition metals',
  "I understand the basic rules but the Cr and Cu exceptions don't make intuitive sense to me. I'd like to understand the quantum mechanical reason.",
  'pending',
  'Monday or Wednesday morning',
  daysAgo(1)
);

db.prepare(`
  INSERT INTO office_hour_requests (group_id, student_id, subject, description, status, preferred_time, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  groupId, students[0].id,
  'Review session before midterm',
  "Would it be possible to schedule a group review session in the week before the midterm? I think a lot of students would benefit.",
  'completed',
  'Flexible',
  daysAgo(8)
);

console.log(`  ✓ Created 3 office hour requests\n`);

// ── Self-check reports ─────────────────────────────────────────────────────────
const improvements = [
  { section: 'Limiting Reagent Calculation', suggestion: 'You correctly identified the limiting reagent but made an arithmetic error in the final yield calculation. Double-check your molar mass for Fe₂O₃ (159.7 g/mol, not 160).' },
  { section: 'Significant Figures', suggestion: 'Your final answer has 4 significant figures but your least precise measurement had 3. Round to 3 sig figs.' },
  { section: 'Units', suggestion: 'Remember to include units throughout your calculation chain, not just in the final answer. This helps catch errors early.' },
];

db.prepare(`
  INSERT INTO self_check_reports (user_id, assignment_name, rubric_name, letter_grade, score_text, improvements_json, raw_analysis, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  students[0].id,
  'Problem Set 3 — Stoichiometry',
  'CHEM 1301 PS3 Rubric',
  'B+',
  '88/100',
  JSON.stringify(improvements),
  JSON.stringify({ letter_grade: 'B+', score: '88/100', summary: 'Strong conceptual understanding of stoichiometry with minor arithmetic and sig fig errors. The approach and setup were consistently correct.', strengths: ['Correctly balanced all 3 equations', 'Properly identified limiting reagent in all problems', 'Clear and organized work shown'], improvements }),
  daysAgo(6)
);

console.log(`  ✓ Created 1 self-check report\n`);

// ── AI metrics (some simulated history) ──────────────────────────────────────
const metricTypes = [
  { type: 'classifyTopic', lat: 320, tokens: 110 },
  { type: 'generateAnswerDraft', lat: 1840, tokens: 780 },
  { type: 'scoreAIConfidence', lat: 410, tokens: 230 },
  { type: 'generateAnswerDraft', lat: 1650, tokens: 720 },
  { type: 'classifyTopic', lat: 290, tokens: 105 },
  { type: 'recommendIntervention', lat: 980, tokens: 350 },
  { type: 'generateAnswerDraft', lat: 2100, tokens: 810 },
  { type: 'scoreAIConfidence', lat: 380, tokens: 215 },
  { type: 'generateAnnouncement', lat: 760, tokens: 410 },
  { type: 'classifyTopic', lat: 305, tokens: 108 },
  { type: 'generateAnswerDraft', lat: 1720, tokens: 755 },
  { type: 'scoreAIConfidence', lat: 395, tokens: 225 },
  { type: 'classifyTopic', lat: 0, tokens: 0, fail: true, err: 'Request timeout after 5000ms' },
  { type: 'generateAnswerDraft', lat: 1590, tokens: 690 },
  { type: 'selfCheck', lat: 2340, tokens: 1120 },
];

for (let i = 0; i < metricTypes.length; i++) {
  const m = metricTypes[i];
  db.prepare(`
    INSERT INTO ai_metrics (request_type, model, latency_ms, success, error_message, tokens_used, group_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    m.type, 'claude-haiku-4-5-20251001',
    m.fail ? 0 : m.lat,
    m.fail ? 0 : 1,
    m.err || null,
    m.tokens,
    groupId,
    new Date(Date.now() - (metricTypes.length - i) * 1800000).toISOString()
  );
}

console.log(`  ✓ Created ${metricTypes.length} AI metric records\n`);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('─'.repeat(55));
console.log('✅ Seed complete!\n');
console.log('  Login credentials:');
console.log('  ┌─────────────────────────────────────────────┐');
console.log('  │  Professor  dr.chen@university.edu          │');
console.log('  │  Student 1  alex.r@uni.edu                  │');
console.log('  │  Student 2  priya.p@uni.edu                 │');
console.log('  │  Student 3  marcus.j@uni.edu                │');
console.log('  │  Student 4  zoe.k@uni.edu                   │');
console.log('  │  Password   demo1234  (all accounts)        │');
console.log('  │  Group code CHEM01                          │');
console.log('  └─────────────────────────────────────────────┘\n');
console.log('  What\'s in the database:');
console.log(`  • ${questions.length} questions with AI answers (mix of verified, pending, escalated)`);
console.log(`  • ${verifiedIdxs.length} approved answers in the reuse library`);
console.log('  • 3 confusion clusters (1 critical, 1 medium, 1 low)');
console.log('  • 1 intervention with tracked 66.7% effectiveness');
console.log('  • 3 office hour requests');
console.log('  • 1 self-check report');
console.log(`  • ${metricTypes.length} AI observability metrics`);
console.log('\n  Run: cd server && node seed.js');
