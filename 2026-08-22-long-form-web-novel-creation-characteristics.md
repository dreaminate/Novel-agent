# Agent Note: Long-form Chinese web-novel creation characteristics and agent capability benchmark

Status: proposed

English | [中文](2026-08-22-long-form-web-novel-creation-characteristics.zh.md)

## Problem

A general-purpose novel-authoring agent cannot be evaluated by asking whether it can produce a fluent chapter. Long-form Chinese web fiction is created under serialization pressure, may span millions of words and thousands of chapters, and must preserve reader expectations, causal continuity, character change, emotional consequences, relationship development, mystery debt, and an eventual ending while the author continues to make creative decisions.

This note defines a reusable creation benchmark rather than a brief for a particular novel. It does not choose a protagonist, plot, genre, pairing, or prose style. It describes what an author-led co-creation system must represent, support, expose, and verify, with bounded full automation as a secondary mode.

The benchmark uses 《斗破苍穹》, 《武动乾坤》, 《开局签到荒古圣体》, and the 《遮天》—《完美世界》—《圣墟》 sequence as stress cases for different long-form problems. They are references for mechanisms such as explicit progression, repeated promise and payoff, world expansion, extreme serialization length, long-range mysteries, and cross-era continuity. They are not style templates, quality ceilings, or permission to imitate protected expression.

## Proposal

Evaluate every novel capability through the same executable chain:

> intended reader effect → narrative mechanism → structured state → authoring process → observable check signals → failure modes → required agent capability

The chain prevents two common design errors. A prose-only system cannot preserve long-range obligations, while a database-only system can preserve facts without producing meaningful scenes. The target needs both an author-controlled creative process and state that makes promises, changes, uncertainty, and consequences inspectable.

Author-led co-creation is the default. The agent may retrieve, compare, plan, propose alternatives, draft, review, simulate, and prepare changes, but accepted manuscript and canon remain explicit author decisions. Full automation is a predeclared policy over bounded stages, budgets, stop conditions, and approval rights; it is not unrestricted permission to keep writing or silently change canon.

## Evidence scope and interpretation

The benchmark combines product requirements with public discussion of the web-fiction medium. China Writers Association material describes the established million-word and daily-update form, the use of scenes to arrange tension and release, and the way daily serialization interacts with reader response. Research published through [China Writers Network](https://www.chinawriter.com.cn/n1/2024/0806/c404027-40293487.html), [China Social Sciences Network](https://www.cssn.cn/dkzgxp/zgxp_zgshkx/shkx202410/202412/t20241218_5824988.shtml), and a [study of web-novel length](https://www.chinawriter.com.cn/n1/2022/0921/c404027-32531050.html) supports treating serialization, scene-level payoff, participatory reading, and extreme length as system requirements rather than incidental genre habits.

The named works provide contrasting stress cases. The official Qidian pages for [《斗破苍穹》](https://book.qidian.com/info/1209977/), [《武动乾坤》](https://book.qidian.com/info/2048120/), and [《开局签到荒古圣体》](https://book.qidian.com/info/1021378513/) expose explicit genre promises, chapter scale, and continuing or completed publication state. Qidian's pages for [《遮天》](https://book.qidian.com/info/1735921/), [《完美世界》](https://book.qidian.com/info/2952453/), and [《圣墟》](https://book.qidian.com/info/1004608738/), its [Chen Dong author feature](https://acts.qidian.com/2017/5806373/index.html), and its platform [answer about the reading sequence](https://www.qidian.com/ask/qhviqbpenvx) support treating the three works as a cross-era continuity stress case. “遮天三部曲” is a common platform and reader label; this review did not find a primary statement in which Chen Dong formally defines that series name. The benchmark derives general engineering pressures from the observable forms; it does not claim that one mechanism caused their popularity.

Character and emotional requirements are not inferred from progression fiction alone. Discussions of [character setting](https://www.chinawriter.com.cn/n1/2021/0716/c404024-32159694.html), [character construction under daily updates](https://www.chinawriter.com.cn/n1/2025/0321/c404027-40443676.html), and [heroic growth and emotional ethics](https://www.chinawriter.com.cn/n1/2022/0519/c404027-32425232.html) support tracking a character's life trajectory, choices, and affective obligations rather than treating a cast as a list of traits.

These sources describe tendencies, not universal laws. Genre, platform, target audience, author voice, relationship model, update cadence, and planned length belong in a configurable creative profile. Diagnostic signals in this note warn or invite inspection; they do not mechanically score literary value.

## Operating model

Long-form creation is a nested, state-changing process. A useful system must let the author move between scales without confusing an outline proposal with accepted prose or a conversational memory with canon.

```text
AUTHOR INTENT + CREATIVE PROFILE
                |
SERIES -> BOOK -> VOLUME -> ARC -> CHAPTER -> SCENE -> BEAT -> PROSE
   |        |       |       |        |         |        |       |
   +--------+-------+-------+--------+---------+--------+-------+
                TEN NARRATIVE CLOCKS
 plot | promise | progression | world | character | relationship
 mystery | reader-knowledge | tension/payoff | ending/convergence
                |
 proposal -> draft -> anchored review -> approval -> atomic commit
                |
 accepted manuscript + typed canon + rebuildable projections
```

The hierarchy is not a one-way waterfall. A powerful scene may require revising the chapter control card, an earned character decision may change an arc, and a reader response may cause the author to re-plan a future volume. The system must preserve the level and approval state of each change.

### Ten narrative clocks

| Clock | What advances | Minimum inspectable state | Drift warning |
|---|---|---|---|
| Plot and causality | Goals, obstacles, choices, consequences, and reversals | Active goals, event graph, causal links, unresolved consequences | Events occur because the outline needs them rather than because characters and conditions cause them |
| Promise and payoff | Questions and experiences the story implicitly or explicitly owes | Promise, scope, expected horizon, escalation history, payoff or retirement state | Repeated teasing without new evidence, payoff, or honest retirement |
| Progression | Capability, status, resources, knowledge, responsibility, and cost | Ladder, current evidence, prerequisites, costs, counters, ceilings | New labels replace meaningful change; old problems cease to matter without consequence |
| World | Known space, rules, institutions, factions, history, and scale | Rule versions, locations, factions, access, influence, provenance | Every new map erases prior relationships and rules or merely renames the old map |
| Character | Desire, fear, belief, capability, identity, and moral choice | Arc hypothesis, current state, pressures, decisions, scars, commitments | Character traits reset after a scene or change only because exposition says so |
| Relationship and emotion | Trust, attraction, intimacy, conflict, debt, boundaries, and shared meaning | Relationship edge, emotional state, anchors, last change, unresolved debt | A relationship jumps states, disappears for long spans, or has no effect on later choices |
| Mystery and information | Secrets, clues, hypotheses, reveals, and who knows what | Mystery ledger, clue provenance, reader and character knowledge, reveal conditions | The solution needs information that was never available or contradicts prior evidence |
| Reader knowledge | What the text lets the reader know, suspect, misread, and remember | Disclosure events, viewpoint access, reminders, ambiguity policy | The narration hides facts unfairly or repeats information that the intended reader already knows |
| Tension and payoff | Pressure, delay, partial release, climax, aftermath, and recovery | Tension sources, level, expected release, cost, aftermath | Constant maximum intensity, instant rewards, no aftermath, or long flat stretches |
| Ending and convergence | Which promises, arcs, relationships, mysteries, and themes approach closure | Ending target, closure ledger, convergence dependencies, remaining chapter budget | Late expansion adds more debt than the remaining structure can resolve |

Clock values are descriptive, not a demand that every chapter advance everything. A deliberate quiet chapter may hold plot and progression while advancing grief, intimacy, recovery, or interpretation. The author should be able to see which clocks are moving and decide whether the distribution is intentional.

## Executable characteristic rubric

| Characteristic | Intended reader effect | Narrative mechanism | Structured state | Authoring process | Check signals | Typical failure | Required agent capability |
|---|---|---|---|---|---|---|---|
| Premise and reader contract | Know what kind of experience is being promised | A distinctive situation, dramatic question, fantasy, constraint, and tonal range | Creative profile, core promise, exclusions, target audience, change history | Author states or revises the contract; each arc interprets it | Opening delivery, repeated contract evidence, explicit author exceptions | Generic opening, bait-and-switch, or formula replacing the actual premise | Contract editor, alternative comparison, contract-drift warnings |
| Macro architecture | Feel continuous progress across a very long work | Nested volumes and arcs with local closure and renewed direction | Series, volume, arc, milestone, dependency, target range | Maintain a rolling roadmap and re-plan at accepted boundaries | Arc objectives resolve or transform; next direction is prepared | Endless middle, accidental repetition, premature final escalation | Hierarchical planner, dependency view, horizon and debt forecast |
| Chapter contract | Receive a satisfying serial unit and a reason to continue | Chapter-specific change, scene progression, release, aftermath, and exit energy | Control card, scene list, before/after state, hook type | Plan, draft, review, and commit one chapter against its card | Material state changes, clear scene functions, earned ending pull | Summary-only chapters, empty cliffhangers, fragmented events | Control-pack builder, scene planner, chapter diff and acceptance |
| Progression | Experience competence, anticipation, and earned transformation | Clear dimensions, prerequisites, trials, costs, counters, and qualitative changes | Capability ledger, resources, evidence, limits, costs, rivals | Propose advancement; validate setup and consequences | Earlier seeds are used; new ability changes choices and threats | Rank inflation, free power, forgotten limits, identical battles | Progression model, power audit, counterexample and inflation checks |
| Promise and payoff | Trust that attention and patience will be rewarded | Seed, reminder, complication, partial payoff, full payoff, aftermath | Promise ledger with horizon, weight, evidence, payoff type | Register promises, schedule reminders, resolve or retire explicitly | Debt age, new information, causal payoff, emotional aftereffect | Forgotten setup, fake reveal, repeated delay, payoff without setup | Promise tracker, overdue view, source-anchored payoff review |
| Pacing and tension | Alternate anticipation, pressure, release, reflection, and renewal | Multiple overlapping tension waves at scene, chapter, arc, and volume scale | Tension sources, intensity, duration, release and recovery markers | Inspect rhythm, move or split scenes, preserve aftermath | Variation, escalation cost, breathing space with purpose | Perpetual shouting, flat travel, mechanical cliffhanger every chapter | Rhythm view, scene-function map, targeted compression or expansion |
| World expansion | Discover larger possibility without losing credibility or attachment | Reveal by need, travel, conflict, institution, history, and changed perspective | World rules, scopes, locations, factions, resource flows, access graph | Validate new region against old rules and returning consequences | Old commitments still matter; rules have provenance and exceptions | Reskinned maps, arbitrary ceilings, abandoned cast, rule contradiction | World bible, rule versioning, map/faction graph, expansion audit |
| Character agency and arc | Care about people whose choices cause the story | Goals collide with constraints; choices incur costs and update beliefs | Character state, arc hypothesis, goal, fear, secret, choice and scar history | Track decision points and revise arc only from accepted events | Distinct choices, persistent consequences, capability and belief change | Trait lists, forced stupidity, personality reset, interchangeable voices | Character trajectory, decision audit, voice evidence retrieval |
| Ensemble and factions | Experience a living social system rather than disposable extras | Independent agendas, alliances, role succession, asymmetric information | Character and faction goals, resources, relationships, membership history | Schedule presence by causal relevance, not quota | Off-screen actors create plausible pressure; roles evolve | Cast explosion, forgotten allies, factions waiting for the protagonist | Relationship/faction graph, agenda scheduler, dormant-thread reminders |
| Emotion | Feel cumulative inner consequence rather than labeled sentiment | Stimulus, appraisal, bodily response, action tendency, expression, suppression, and aftereffect | Emotional episode, trigger, intensity, coping, residue, anchors | Draft through observable behavior and later consequences | Emotion changes attention, speech, choices, memory, and recovery | Emotion words without embodiment, instant recovery, uniform reactions | Emotional ledger, subtext review, before/after consequence checks |
| Male/female lead relationship line | Follow a complete second story whose changes influence the main story | Two agents pursue independent goals while trust, attraction, values, conflict, and commitment evolve | Bidirectional relationship edge, stages, boundaries, shared history, debts and choices | Plan relationship turns alongside plot; earn every transition; preserve both agencies | Mutual influence, changed behavior, meaningful absence, repair and sacrifice with cost | Heroine as reward, sudden intimacy, repeated rescue, vanishing line, consent or boundary erasure | Dual-arc planner, relationship beat ledger, agency and boundary audit |
| Mystery and foreshadowing | Form hypotheses and experience fair surprise | Questions, clues, red herrings, concealment rules, progressive recontextualization, reveal | Mystery, clue, hypothesis, provenance, knower, visibility, due window | Seed with source anchors, update hypotheses, test reveal fairness | Multiple compatible clues, controlled ambiguity, reveal explains prior detail | Retcon, omniscient withholding, obvious answer, unsolvable answer | Knowledge-state query, clue graph, fairness and contradiction checks |
| Continuity and story time | Trust the physical, social, and historical reality | Typed events update state along story time and causal order | Event, time interval, location, participants, causal edge, state delta | Extract candidate changes, validate, approve, commit atomically | Reconstructable state at any chapter; source passage for every change | Teleportation, healed injuries, duplicate items, age and calendar drift | Temporal projection, invariant checks, provenance and rollback |
| Voice, scene, and prose | Recognize the author's language while experiencing concrete action | Viewpoint control, scene focus, sensory selection, dialogue, subtext, sentence rhythm | Style profile, viewpoint rules, forbidden habits, approved exemplars | Draft locally, compare with author examples, repair anchored passages | Stable but adaptable voice, distinct dialogue, scene-specific detail | Generic AI cadence, excessive explanation, imitation, global rewrite damage | Local style retrieval, pattern detector, anchored edit and diff |
| Serialization feedback | Feel that a living work responds without losing identity | Observe comments and metrics, classify signals, run bounded experiments, preserve author judgment | Feedback item, cohort, confidence, decision, experiment, outcome | Import, cluster, inspect, decide, test future chapters only | Repeated qualified signal, explicit author rationale, reversible experiment | Chasing loud comments, optimizing a single metric, rewriting canon by poll | Feedback triage, provenance, cohort comparison, decision log |
| Revision and branches | Explore alternatives without corrupting accepted truth | Draft branches, compare, accept selected changes, retain history | Revision graph, branch, diff, proposal, approval, commit and rollback | Fork from a known revision, review, atomically accept or reject | Every artifact names its source and status; rollback restores prose and state | Draft mistaken for canon, partial rollback, silent overwrite | Revision transactions, branch comparison, status rendering |
| Ending and convergence | Experience earned closure, transformed meaning, and an appropriate afterimage | Debt convergence, final irreversible choices, thematic return, aftermath | Closure ledger, final states, dependency order, chapter budget | Freeze expansion, resolve by priority, audit aftermath and epilogue need | Major promises close or are deliberately left open; costs remain visible | Late lore dump, endless boss ladder, mechanical pairing, no aftermath | Closure forecast, unresolved-debt map, ending rehearsal and audit |
| Bounded automation | Gain speed without surrendering authorship or safety | Stage-specific authority, budgets, quality gates, stop and escalation conditions | Mode, permission, scope, budget, attempts, confidence, checkpoint | User declares policy; system logs every proposal and decision | No authority creep; deterministic stops; resumable checkpoints | Runaway generation, silent canon drift, cost spiral, self-approval | Ask/Plan/Write policy, workflow guard, budget and approval enforcement |

## Long-form hierarchy and rolling planning

A long work needs both distant direction and local freedom. The system should support a stable ending hypothesis and major transformations, a rolling detailed horizon for the next volume or arc, and a precise control card for the next chapter. Details beyond the reliable horizon remain hypotheses rather than false certainty.

This rolling-horizon approach agrees with a [China Writers Network discussion of long-novel layout](https://www.chinawriter.com.cn/n1/2024/0111/c441011-40157168.html): retain major nodes and ending logic, review written material regularly, and reassess downstream logic after a major change. The product interpretation—versioned nodes, dependency views, and impact diffs—is an engineering inference rather than the article's prescription.

| Level | Author question | Required record | Update rule |
|---|---|---|---|
| Series or book | What lasting experience and transformation justify the whole work? | Reader contract, ending hypothesis, central dramatic proposition, prohibited outcomes | Change only through an explicit author decision with impact analysis |
| Volume | What state of the world, cast, and central problem changes here? | Entry state, volume question, escalation, climax, exit state, carried debt | Review at volume boundaries and when a major premise changes |
| Arc | Which goal-obstacle-choice-consequence chain earns local closure? | Objective, actors, opposition, beats, dependencies, payoff and handoff | Re-plan from accepted events, never from an uncommitted draft |
| Chapter batch | Which obligations and rhythms must be balanced in the near horizon? | Chapter slots, active clocks, due promises, relationship beats, recovery space | Adjust frequently; preserve reasons for moved or retired beats |
| Chapter | What materially differs at the end, and why continue? | Control card, scenes, before/after state, reveal policy, emotional turn, exit energy | Lock while drafting unless the author accepts a card revision |
| Scene and beat | Who wants what now, what resists, what changes, and what remains? | Viewpoint, location, participants, objective, turn, cost, reveal, resulting state | Derived from chapter intent; commit only with the chapter revision |

The roadmap must expose narrative debt, not merely future events. A chapter can be “on outline” and still fail because it postpones the same promise, resets a relationship, introduces an unearned power, or adds a new mystery while the closure budget is shrinking.

## The serial chapter contract

Every chapter should have at least one material function, but not every chapter needs a fight, revelation, level-up, romantic advance, or cliffhanger. Legitimate functions include progress, complication, reversal, decision, cost, discovery, bonding, estrangement, grief, recovery, interpretation, setup, payoff, or transition with necessary texture.

A chapter control card should include: source revision; objective; viewpoint and story time; entry state; scene functions; active plot and relationship lines; promises touched; information allowed to reader and characters; progression setup or payoff; emotional movement; intended exit state; ending pull; prohibited contradictions; style constraints; length range; and acceptance gates.

The ending pull may be uncertainty, changed meaning, emotional resonance, a consequential decision, visible danger, a promised encounter, or completion that opens a larger question. A withheld sentence or arbitrary interruption is not sufficient by itself.

The post-chapter check must ask what changed, what it cost, what now becomes possible or impossible, what the reader newly knows or suspects, what each involved character carries forward, and which debts were created, advanced, paid, or retired.

## Progression, power, status, and payoff

Progression is broader than combat rank. It may involve skill, knowledge, craft, wealth, territory, reputation, institutional authority, relationships, self-command, moral responsibility, or access to truth. A creative profile chooses the dimensions and how visible their ladders are.

An analysis of [male-oriented long-form progression structures](https://www.chinawriter.com.cn/n1/2024/1205/c404027-40375996.html) describes the recurring opponent, crisis, reward, and advancement cycle while also identifying semantic repetition across similar loops and maps. This benchmark therefore treats a loop as useful structure only when its causes, solution, cost, relationships, or meaning change.

Each advancement record should identify the prior limitation, setup, evidence, enabling action, resource or sacrifice, new capability, remaining limit, counter, social interpretation, and downstream consequence. The system should reject a rank label with no demonstrated difference and warn when an ability invalidates planned conflicts without replacement costs or counters.

Power inflation is controlled by qualitative change, not only larger numbers. New environments should demand different decisions, coordination, restraint, knowledge, or responsibility. Old characters, promises, scars, and institutions should retain causal weight even when the physical scale grows.

A payoff ledger distinguishes micro release, chapter payoff, arc payoff, relationship payoff, mystery reveal, progression payoff, thematic payoff, and final closure. It tracks setup strength, reminders, complication, expected window, delivered form, cost, and aftermath. The objective is not to pay every debt immediately, but to keep delay productive and legible.

## World expansion and long-range coherence

Worldbuilding becomes story only when rules and institutions constrain choices. The system should store rule scope, source, exceptions, version, public belief, hidden truth, and observed consequences. It should distinguish a character's belief from accepted world truth and the reader's current information.

Map expansion should answer why the protagonist can enter, why the new place matters now, which old obligations travel with them, what genuinely differs, which rules remain, and how prior actions affect the new scale. The world must not feel as if everyone beyond the previous map was waiting for the protagonist to arrive.

For cross-era or cross-work settings, identity, lineage, artifact, location, civilization, cosmology, and legend need provenance and uncertainty. A later work may reinterpret an earlier event, but the change must be represented as new evidence, viewpoint limitation, myth formation, or an explicit canon revision—not as an unnoticed contradiction.

## Character agency, ensemble life, and emotional continuity

A character model should separate relatively stable dispositions from current state and public mask. At minimum it records canonical identity and aliases, goals, fears, values, beliefs, secrets, capabilities, limitations, injuries, possessions, knowledge, affiliations, relationships, promises, recent decisions, emotional residue, and source anchors.

An arc is not a predetermined adjective change. It is a hypothesis about how repeated pressures and costly choices may transform belief, strategy, identity, relationship, or responsibility. The author may revise the hypothesis when accepted scenes reveal a better path, but the system preserves the decision chain.

Secondary characters and factions need independent agendas and off-screen continuity. Their activity can be simulated or scheduled, then proposed to the author, but simulation output is counterfactual evidence rather than canon. The author decides which event actually occurred and how it enters the manuscript.

Emotional continuity requires more than a scalar mood. An emotional episode records trigger, interpretation, mixed emotions, bodily expression, action tendency, suppression or display, coping, object, intensity, residue, and later reactivation. The draft should express selected evidence through behavior, attention, dialogue, imagery, silence, or changed choice instead of merely naming the feeling.

## Male/female lead relationship as a complete second story line

The default benchmark treats the male/female lead relationship as a complete second main line, not an intermittent reward track. It has its own premise, stages, obstacles, reversals, costs, climax, and ending state while remaining causally coupled to the external plot. Creative profiles may replace this with multiple leads, harem, queer pairing, friendship-centered intimacy, or no-romance, but each chosen relationship form still requires agency, boundaries, continuity, and consequences.

Both leads must possess goals, competencies, vulnerabilities, social ties, and decisions that would matter even without the romance. Neither lead is a prize, moral certificate, healing device, information dispenser, or perpetual rescue target. Mutual influence does not mean symmetrical power or identical investment; it means that the text understands each person's reasons and preserves their capacity to choose.

| Relationship function | Required dramatic content | State change to inspect | Common false substitute |
|---|---|---|---|
| Recognition | One notices a specific truth, ability, wound, or contradiction in the other | Attention and model-of-other update | Beauty or status description alone |
| Bonding | Shared action or disclosure creates meaning available only to this pair | Trust, private knowledge, ritual, memory, or ease | Repeated banter with no accumulated change |
| Attraction | Desire encounters values, fear, timing, duty, or self-image | Attraction, inhibition, boundary, risk perception | Narrator declaring chemistry |
| Test | External pressure or incompatible goals expose the relationship's real structure | Reliability, disappointment, leverage, consent, priority | Misunderstanding sustained by avoidable silence alone |
| Choice and cost | A person acts differently because the relationship matters | Commitment, sacrifice, opportunity cost, public position | Cost-free rescue or possession language |
| Rupture | A credible breach changes safety, trust, identity, or future expectation | Boundary, distance, anger, grief, revised belief | Temporary quarrel reset next chapter |
| Repair or redefinition | Accountability, truth, changed conduct, and renewed negotiation alter the bond | Trust restoration, new boundary, forgiveness or separation | One apology erasing consequences |
| Shared future or closure | The pair chooses a sustainable form under the final story conditions | Public/private status, responsibilities, unresolved residue | Mechanical wedding after the plot or unexplained disappearance |

The relationship ledger should be bidirectional and time-scoped. It records each person's trust, attraction, fear, respect, resentment, obligation, knowledge, boundaries, public and private status, desired future, unresolved emotional debts, significant shared memories, last meaningful change, and source passages. It must permit disagreement between the two perceptions.

Relationship pacing is measured by earned transitions and aftereffects, not by chapter frequency. Long separation can be narratively active if absence changes decisions, letters or rumors alter knowledge, shared commitments constrain choices, and reunion pays accumulated change. Frequent scenes can still be static if each interaction returns to the same tease.

The relationship must affect the main line without being consumed by it. Plot choices should test values and intimacy; relationship changes should alter risk, alliance, information, identity, or motivation. The system warns when one line has had no causal exchange with the other across the configured horizon.

This default intentionally goes beyond what the named progression samples jointly prove. A [discussion of commercial structure and love in male-oriented fantasy](https://www.chinawriter.com.cn/n1/2026/0628/c461850-40749049.html) observes that event-centered expansion can weaken love narratives, while a [study of independently motivated women and ensemble writing](https://www.chinawriter.com.cn/n1/2023/0606/c404027-40007132.html) provides the stronger agency requirement used here. The product requirement is a deliberate design choice, not a claim that every reference work already satisfies it.

## Mystery, foreshadowing, and information fairness

A mystery record needs the dramatic question, true answer if known, alternative hypotheses, clue set, red herrings, concealment rule, involved knowers, reader visibility, earliest fair resolution point, desired window, actual reveal, and aftermath. Unknown-to-author mysteries may remain open hypotheses, but the system must mark them as such and prevent accidental false certainty from entering canon.

Foreshadowing is a lifecycle rather than a tag: proposed, buried, noticed, reinforced, complicated, due, paid, transformed, retired, or abandoned with author rationale. Every transition cites a manuscript passage or explicit planning decision.

Fair surprise means that the eventual explanation fits the evidence and viewpoint rules, not that every reader predicts it. The checker should search for contradictory facts, missing prerequisites, impossible knower states, repeated reminders that make the answer trivial, and late evidence introduced only to justify the solution.

Reader knowledge and character knowledge remain separate. Dramatic irony, unreliable narration, hidden identity, and misdirection all depend on knowing who could observe, infer, remember, or lie about each fact.

## Canon, causality, time, and revision

Accepted story events should be typed, source-anchored, and ordered in story time as well as manuscript order. An event identifies participants, location, interval, preconditions, action or change, direct effects, delayed consequences, causal parents, uncertainty, and the manuscript revision that establishes it.

State projections reconstruct a character, relationship, faction, object, location, promise, or mystery at a requested story time. Validation should catch impossible travel, incompatible simultaneous presence, healed injuries without an event, duplicated or missing items, knowledge gained before disclosure, broken resource accounting, inconsistent ranks, and consequences whose causes were removed by revision.

Draft, plan, simulation, retrieval result, model inference, reader hypothesis, and accepted canon are different authorities. Only an atomic accepted revision may change manuscript and typed canon together. Rollback creates a new auditable revision that restores both; it never silently deletes history.

## Voice, scene craft, and anti-homogenization

The system should learn local constraints from author-approved examples without claiming ownership of a style or imitating a named living author. A style profile may record viewpoint distance, tense, diction range, dialogue habits, paragraph and punctuation preferences, sensory priorities, humor tolerance, exposition density, recurring motifs, prohibited clichés, and examples with provenance.

Review must be anchored and local. It identifies the exact passage, the observed pattern, why it conflicts with the current intent, and one or more options. Global rewriting is reserved for structural failure and requires a new proposal because it can erase voice, setup, subtext, and deliberate irregularity.

Useful detectors include repeated sentence openings, generic emotional labels, explanatory dialogue, duplicated imagery, unearned omniscience, viewpoint leakage, excessive abstract summary, repeated confrontation templates, character voice convergence, and suspicious phrase overlap. None may auto-reject prose without the author's configured policy.

## Reader feedback and two simulation sandboxes

Real reader feedback is evidence about cohorts and moments, not a vote that owns the story. Comments, chapter retention, subscriptions, recommendations, and completion signals need timestamps, cohort definitions, platform context, uncertainty, and an author decision log. The system should separate comprehension problems, expectation mismatch, emotional response, preference, coordinated noise, and actionable continuity reports.

In an [author interview](https://www.chinawriter.com.cn/n1/2023/0823/c404024-40062009.html), Tian Can Tu Dou describes the importance of both emotional resonance and screening timely reader feedback while retaining control of the work. The [2024 China online-literature blue book](https://wyb.chinawriter.com.cn/Pad/content/202506/30/content79852.html) likewise treats reader interaction as capable of affecting a text and warns that accommodation can displace the author's original conception. Those observations support evidence capture plus an explicit author decision, not automatic optimization.

A story-world sandbox may simulate character, faction, event, and information-propagation behavior from a frozen accepted revision. It helps discover missing reactions, strategic consequences, social rumors, and counterfactual branches. Its agents receive only the knowledge and resources their roles possess. Outputs remain proposals with provenance and cannot mutate canon.

A reader-reaction sandbox may test alternative openings, explanations, reveals, emotional beats, or chapter endings against configured audience personas. It can generate hypotheses about confusion, anticipation, trust, boredom, or perceived fairness. It cannot measure real market demand, replace beta readers, claim statistical representativeness, or automatically optimize the manuscript.

The two sandboxes must be isolated. Story-world agents reason as inhabitants; reader agents reason from presented text and reader history. Mixing them leaks author truth into character action or lets a simulated audience dictate canon.

```text
                 accepted revision R
                         |
          +--------------+--------------+
          |                             |
 STORY-WORLD SANDBOX              READER SANDBOX
 character knowledge              presented text only
 faction resources                cohort + reading history
 event propagation                response hypotheses
          |                             |
 counterfactual events            diagnostic reactions
          +--------------+--------------+
                         |
              author review and decision
                         |
               proposal only; no canon write
```

## Ending design and convergence control

Ending work begins before the final volume. The system maintains an ending hypothesis and estimates the debt that must converge: core promise, protagonist choice, antagonist or central opposition, progression meaning, world question, character arcs, relationship line, mysteries, foreshadowing, secondary obligations, and desired emotional afterimage.

As the remaining chapter budget shrinks, the system should make new high-weight debt visible, require an explicit exception for major cosmology or cast expansion, and forecast dependency order. Resolution can be closure, transformation, deliberate openness, tragic failure, or transfer to a sequel, but the author states which and preserves the reader contract.

The climax resolves the decisive conflict; the ending also shows meaning and consequence. Aftermath establishes what the choice cost, what world now exists, how the leads' relationship is sustained or ended, which characters carry forward, and what remains intentionally unresolved. An epilogue is used only when it performs this work rather than listing rewards.

## Author-led and full-automation workflows

The same workflow supports multiple authority policies. Ask is read-only. Plan may create roadmaps, control cards, simulations, and diffs but cannot write accepted project state. Write may create draft revisions in an authorized scope. Accept changes manuscript and canon. Publish or external share is always a separate capability.

```text
ASK ------> evidence + explanation
PLAN -----> alternatives + control cards + simulations + diffs
WRITE ----> draft revision + issues + typed state proposal
ACCEPT ---> atomic manuscript/canon commit + projection invalidation
PUBLISH --> explicit destination + preview + separate authorization

full-auto = selected arrows + fixed scope + budgets + gates + stop rules
full-auto != permission to widen scope, self-approve canon, or publish
```

In author-led mode, the system should make it cheap to steer at any level: edit the premise, lock a fact, choose an outline alternative, change a relationship destination, rewrite one anchored passage, reject a state proposal, or branch from a prior revision. The agent explains consequences without claiming that a metric has discovered the correct artistic choice.

In bounded automatic mode, each run has a project and revision, allowed stages, chapter or scene limit, token and cost budget, wall-time limit, retry and rewrite ceiling, quality gates, approval policy, natural closure conditions, and escalation path. It stops on ambiguity that affects canon, repeated validation failure, budget exhaustion, conflicting locks, insufficient source evidence, or completion of the authorized unit.

## Minimum structured state

| Entity | Essential fields | Authority rule |
|---|---|---|
| CreativeProfile | Genre mix, audience, platform, voice, update cadence, planned length, relationship form, content limits, automation policy | Explicit author configuration |
| ReaderContract | Core experience, promises, exclusions, evidence, revision rationale | Accepted plan state, versioned |
| NarrativeUnit | Series/book/volume/arc/chapter/scene/beat ID, parent, objective, entry and exit state, status | Plans are proposals until accepted; prose belongs to a revision |
| CharacterState | Identity, goals, beliefs, capability, limits, body, inventory, knowledge, affiliation, commitments, emotions | Projected from accepted typed events with anchored exceptions |
| RelationshipEdge | Directional perceptions, trust, attraction, conflict, boundary, status, debt, memories, desired future | Time-scoped and bidirectional; changes require event anchors |
| StoryEvent | Story time, place, participants, preconditions, change, effects, causal links, uncertainty, source | Accepted only with an atomic manuscript revision |
| PromiseAndPayoff | Promise, type, weight, horizon, setup, reminders, complications, resolution, aftermath | Author may retire with rationale; age is diagnostic |
| MysteryAndClue | Question, truth status, hypothesis, clue, knower, reader visibility, reveal conditions | Truth, belief, and reader information are separate |
| Revision | Parent, branch, manuscript diff, canon delta, provenance, approvals, commit outcome | Immutable history; rollback creates another revision |
| FeedbackAndExperiment | Source, cohort, observation, confidence, decision, variant, measured outcome | Never canon; author decides whether it affects a future plan |
| SimulationRun | Frozen source revision, sandbox type, personas, assumptions, events or reactions, limitations | Counterfactual output only |

Derived full-text, vector, graph, summary, dashboard, and context-pack data carries source revision and freshness. It can be rebuilt and must never silently override accepted state.

## Evaluation scenarios

The named works motivate stress tests, not reproduction tests.

| Stress profile | What it tests | Pass condition for an agent |
|---|---|---|
| Explicit-ladder growth such as the visible contract in 《斗破苍穹》 | Rank prerequisites, resources, abilities, counters, mentor and social consequences, repeated advancement without losing earlier debt | Reconstruct every accepted advancement and show why new capability changes action rather than only terminology |
| Journey, clan, world, and relationship growth associated with 《武动乾坤》 | Parallel personal, faction, emotional, and world clocks over a completed long arc | Track both leads' agency and relationship consequences alongside external escalation and final convergence |
| Extreme continuing “strong opening plus system reward” serialization represented by 《开局签到荒古圣体》 | Thousands of chapters, repeated reward cycles, protagonist already advantaged, cast and map growth, novelty and inflation pressure | Detect repeated encounter/payoff templates, preserve limits and debts, and retrieve exact state without feeding the model the full corpus |
| Cross-era cosmology and archaeological mystery across 《遮天》, 《完美世界》, and 《圣墟》 | Identity and artifact provenance, legend distortion, timeline scale, mystery reinterpretation, cross-work continuity, ending debt | Distinguish fact from myth and viewpoint, trace every reinterpretation to evidence, and surface contradictions without forcing a single speculative answer |
| Emotion-first quiet chapter | Low external action with grief, trust, intimacy, or recovery as the material change | Accept the chapter when emotional state and later choices change; do not demand an artificial fight or cliffhanger |
| Relationship rupture and repair | Dual agency, boundary, memory, accountability, altered conduct, and main-line consequence | Reject instant reset; show each lead's state, source anchors, cost, and changed future behavior |
| Major revision after 800 chapters | Branching, invalidated causes, downstream state, summaries, retrieval freshness, and author approval | Produce a complete impact report, atomically commit the selected branch, and prevent stale projections from entering context |
| Bounded 20-chapter automatic run | Planning horizon, budgets, retries, checkpoints, closure, and authority | Stop within scope, preserve per-chapter audit and rollback, escalate ambiguous canon, and never publish or widen permission |

Evaluation should use a synthetic corpus or author-owned text. It should not reproduce protected chapters or judge success by resemblance to a named author's prose.

## Capability levels

| Level | Meaning | Evidence required |
|---|---|---|
| L0 Claim | Documentation or prompt says the capability exists | No implementation credit |
| L1 Assist | Produces an answer or draft in one turn | Demonstration with explicit inputs; no durability claim |
| L2 Structured | Reads and writes typed proposals with validation | Schema tests, invalid-case rejection, provenance |
| L3 Durable | Survives restart, revision, branch, and rollback | Persistence, transaction, recovery, stale-data tests |
| L4 Coordinated | Works across roles, clients, permissions, and background jobs | Lifecycle, approval, concurrency, presentation, and replay tests |
| L5 Long-form proven | Maintains the capability under realistic corpus, chapter, and time scale | Stress corpus, retrieval quality, bounded cost, continuity and recovery evidence |

A reference project receives credit only for the level evidenced by current source or official behavior documentation. A planned UI, prompt, schema, or isolated test does not prove a production path. Fiction usefulness and implementation maturity are reported separately.

## Compressed benchmark for repeated project review

Before reviewing each reference agent, reread this compact checklist:

1. **Author authority:** Can the author inspect, steer, branch, approve, reject, roll back, and bound automation without transcript archaeology?
2. **Long hierarchy:** Can the system connect series, volume, arc, chapter, scene, beat, and prose while preserving each item's status?
3. **Ten clocks:** Can it represent plot, promise, progression, world, character, relationship, mystery, reader knowledge, tension/payoff, and ending convergence?
4. **Chapter loop:** Can it build a control pack, draft, perform anchored review, propose typed changes, show a diff, and atomically commit prose plus canon?
5. **Character and emotion:** Can it preserve decision history, emotional residue, source anchors, and distinct voices rather than store trait summaries only?
6. **Relationship second line:** Can it give both leads agency, bidirectional state, earned transitions, boundaries, rupture/repair, main-line consequences, and closure?
7. **Information fairness:** Can it separate truth, character knowledge, reader knowledge, hypothesis, foreshadowing, and reveal evidence?
8. **Continuity:** Can it project state at story time, validate causal and physical invariants, branch, recover, and reject stale derived data?
9. **Serialization:** Can it support rolling plans, chapter-scale satisfaction, reader evidence with provenance, and deliberate adaptation without metric capture?
10. **Sandbox honesty:** Can it isolate story-world simulation from reader-reaction simulation and keep both counterfactual rather than canonical?
11. **Clients and artifacts:** Can TUI and desktop expose progress, manuscript, diff, canon delta, issues, sources, simulations, approvals, and revisions from one protocol?
12. **Evidence and limits:** Which capabilities are shipped, experimental, behavior-only, planned, defective, or absent, and what may legally and technically be reused?

The project review must end with a capability inventory, actual control and data flow, novel-use mapping, maturity evidence, gaps, risks, reuse boundary, target role, and an ASCII diagram. It must state what the reference cannot prove.

## Alternatives considered

### Use named successful works as a formula

This would confuse observable mechanisms with a universal cause of success, suppress genre and author differences, and invite stylistic imitation. The benchmark instead extracts stress conditions and makes creative profiles configurable.

### Evaluate only final prose

Fluent prose does not prove continuity, provenance, revision safety, emotional accumulation, or ending control. Final prose remains essential, but it is evaluated together with the process and accepted state that produced it.

### Evaluate only structured consistency

A perfectly consistent database can support lifeless fiction. The benchmark includes scene function, voice, subtext, emotional embodiment, earned choice, rhythm, and reader effect while keeping judgments advisory and author-controlled.

### Treat engagement metrics or simulated readers as the objective

Metrics are platform- and cohort-dependent observations. Simulated readers are hypotheses. Making either the objective would flatten author voice, overfit short-term reactions, and allow proxy signals to govern canon.

### Make romance a prompt-level ornament

This would reproduce the exact failure the user wants to avoid: a disappearing or reward-like partner with no agency or cumulative consequences. The selected default models the male/female lead relationship as a complete second line with its own state and closure.

## Acceptance criteria

- The document remains a general creation and evaluation benchmark and contains no specific novel premise, protagonist, plot outline, or generated chapter.
- Every major characteristic is connected through reader effect, narrative mechanism, structured state, authoring process, check signals, failure modes, and required agent capability.
- Long-form hierarchy, ten narrative clocks, rolling planning, chapter contracts, progression, payoff, pacing, world expansion, character agency, ensemble behavior, emotion, relationship development, mystery, reader knowledge, continuity, voice, feedback, revision, automation, and ending convergence are covered.
- The male/female lead line is a first-class second story by default, with two-way agency, boundaries, emotional residue, earned transitions, main-line consequences, and ending state; alternative relationship profiles remain possible.
- Story-world and reader-reaction simulations are isolated, frozen to a source revision, provenance-bearing, visibly counterfactual, and unable to write canon.
- Author-led co-creation is the primary mode. Full automation has explicit scope, budgets, approval policy, quality gates, stop conditions, checkpoints, and no implicit publication right.
- Accepted prose and typed canon change atomically; plans, drafts, summaries, retrieval results, graphs, model inferences, feedback, and simulations remain distinct authorities.
- Diagnostic signals cannot silently become numerical literary grades or automatic rewrite authority.
- The named works are used only as high-level stress profiles with links and no protected-text reproduction or named-author style imitation.
- Each later reference-project report uses the compressed checklist, declares evidence maturity and reuse limits, and includes an actual-flow diagram rather than a feature list alone.

## Risks

- A comprehensive schema can tempt the product to over-plan or turn fiction into form filling. Progressive disclosure, sensible defaults, and author-editable prose views are required.
- Quantitative rhythm, debt, and repetition signals may reward superficial optimization. They remain diagnostics with source evidence and author override.
- Emotional and relationship state can become reductive if represented as one score. Preserve conflicting feelings, directionality, uncertainty, context, and passage anchors.
- Canon extraction remains probabilistic. The system must propose changes, show anchors, validate deterministic invariants, and respect the configured approval policy.
- Long-range plans create false confidence. Store distant detail as hypotheses and increase commitment only as the writing horizon approaches.
- Reader feedback may be biased, manipulated, or unrepresentative; simulated readers amplify rather than solve this limitation.
- Story-world simulation can create plausible events that violate literary intent or leak hidden truth. Freeze inputs, enforce knowledge scopes, and require author selection.
- Full automation can optimize for continued output rather than meaningful closure. Enforce debt forecasts, natural-stop checks, chapter limits, and human escalation.
- Retrieval at million-word scale can return semantically plausible but temporally wrong passages. Require revision, time, source, and freshness metadata.
- Reference works and platform behavior evolve. Recheck current publication facts when they matter; the underlying benchmark should not depend on current chapter counts.
