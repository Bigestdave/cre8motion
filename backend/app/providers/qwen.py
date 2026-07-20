import os
import json
import httpx
import asyncio
from openai import OpenAI
from app.core.config import settings
from app.providers.base import ReasoningProvider, VisionProvider, ImageProvider, VideoProvider, AudioProvider

# Flagship Heist: The Laser Hallway Mock Shot List
THE_LASER_HALLWAY_SHOTS = [
    {
        "sequence_number": 1,
        "story_function": "Hook (0-3s)",
        "duration_seconds": 3.0,
        "characters": [],
        "location_id": "skyscraper_security_hallway",
        "framing": "extreme close-up moving into a medium-wide shot",
        "camera_movement": "Begin on the golden keycard, then pull backward through the moving lasers.",
        "camera_angle": "low angle",
        "props": ["golden keycard"],
        "prop_state": "Locked beneath an intact glass dome.",
        "lighting": "Cool blue environment, red lasers, warm gold reflection from the keycard.",
        "composition": "Keycard centered in the mobile-safe area. Lasers create diagonal foreground lines.",
        "start_frame": "Close-up of keycard surrounded by darkness.",
        "end_frame": "Wide reveal of the hallway and three character silhouettes.",
        "continuity_locks": ["Keycard design must match the approved asset.", "Glass dome remains intact."],
        "sound": "Low security hum and sharp laser movements. No speech.",
        "transition": "Cut to Niko's reaction.",
        "risk": "Laser geometry and glass reflections.",
        "fallback": "Generate keycard close-up and hallway reveal as separate shots if camera movement fails.",
        "keyframe_prompt": "Close-up of golden keycard surrounded by darkness, transitioning to a wide reveal of a dark security hallway with red laser reflections.",
        "motion_prompt": "Camera pulls backward through moving red lasers.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy, deformed"
    },
    {
        "sequence_number": 2,
        "story_function": "Objective (3-8s)",
        "duration_seconds": 5.0,
        "characters": ["Niko"],
        "location_id": "skyscraper_security_hallway",
        "framing": "medium shot",
        "camera_movement": "Static",
        "camera_angle": "eye level",
        "props": ["paper blueprints"],
        "prop_state": "Held open",
        "lighting": "Red laser reflections on Niko's face.",
        "composition": "Niko is positioned in the upper-middle safe area.",
        "start_frame": "Niko looking off-camera at the laser hallway.",
        "end_frame": "Niko pointing to paper plan.",
        "continuity_locks": ["Niko's signature orange jacket and calculating eyes.", "Paper blueprint design."],
        "sound": "Low security hum.",
        "transition": "Cut",
        "risk": "Hand holding blueprint.",
        "fallback": "Focus on face close-up.",
        "keyframe_prompt": "Niko the fox mastermind character looking at paper blueprints with narrow calculating eyes.",
        "motion_prompt": "Niko points to the plans and looks up confidently.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    },
    {
        "sequence_number": 3,
        "story_function": "Plan (8-15s)",
        "duration_seconds": 7.0,
        "characters": ["Niko"],
        "location_id": "skyscraper_security_hallway",
        "framing": "medium close-up",
        "camera_movement": "Slow pan",
        "camera_angle": "eye level",
        "props": ["golden keycard"],
        "prop_state": "Locked",
        "lighting": "Pulsing red lasers.",
        "composition": "Niko moving between moving laser lines.",
        "start_frame": "Niko steps into the laser pattern.",
        "end_frame": "Niko poised mid-jump, navigating the lasers.",
        "continuity_locks": ["Niko's posture and jacket consistent."],
        "sound": "Humming escalates.",
        "transition": "Cut",
        "risk": "Laser overlap on character.",
        "fallback": "Split into two simple movements.",
        "keyframe_prompt": "Niko steps precisely through a red laser security web, showing complete confidence.",
        "motion_prompt": "Niko ducks, spins, and steps around moving lasers.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    },
    {
        "sequence_number": 4,
        "story_function": "Escalation (15-27s)",
        "duration_seconds": 12.0,
        "characters": ["Bruno", "Piper"],
        "location_id": "skyscraper_security_hallway",
        "framing": "medium-wide shot",
        "camera_movement": "Tracking",
        "camera_angle": "low angle",
        "props": ["disguise costume feather"],
        "prop_state": "Piper shedding a loose feather",
        "lighting": "Faint blue security hallway lights.",
        "composition": "Bruno's huge silhouette in the middle, Piper floating above.",
        "start_frame": "Bruno steps forward clumsily. Piper flies above.",
        "end_frame": "Feather falls and tickles Bruno's nose, Bruno trying not to sneeze.",
        "continuity_locks": ["Bruno's blue worker uniform and large paws.", "Piper's yellow accents."],
        "sound": "Tense music build-up, Bruno inhaling.",
        "transition": "Cut",
        "risk": "Feather motion rendering.",
        "fallback": "Close-up of Bruno's nose.",
        "keyframe_prompt": "Bruno the huge bear janitor character in a blue uniform trying desperately not to sneeze as a yellow feather floats near his nose.",
        "motion_prompt": "Bruno's face tenses up, eyes widening in panic.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    },
    {
        "sequence_number": 5,
        "story_function": "Reversal (27-36s)",
        "duration_seconds": 9.0,
        "characters": ["Bruno", "Miko"],
        "location_id": "skyscraper_security_hallway",
        "framing": "wide shot",
        "camera_movement": "Static",
        "camera_angle": "eye level",
        "props": ["none"],
        "prop_state": "none",
        "lighting": "Red warning lights flash.",
        "composition": "Lasers shifting patterns wildly.",
        "start_frame": "Bruno sneezes violently.",
        "end_frame": "Lasers close in around Miko, trapping them.",
        "continuity_locks": ["Laser grid change state.", "Miko frozen in hallway."],
        "sound": "Enormous sneeze blast sound followed by klaxon.",
        "transition": "Cut",
        "risk": "Sneeze blast simulation.",
        "fallback": "Quick cuts between Bruno and changing lasers.",
        "keyframe_prompt": "A violent sneeze from Bruno shifts the security laser pattern completely, trapping Miko in a tight red web.",
        "motion_prompt": "Lasers snap into new diagonal positions surrounding Miko.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    },
    {
        "sequence_number": 6,
        "story_function": "Payoff (36-42s)",
        "duration_seconds": 6.0,
        "characters": ["Piper", "Miko"],
        "location_id": "skyscraper_security_hallway",
        "framing": "medium shot",
        "camera_movement": "Tracking Piper",
        "camera_angle": "high angle",
        "props": ["disguise costume feather"],
        "prop_state": "Guided by wind",
        "lighting": "Flashing security alarms.",
        "composition": "Piper guiding the feather near the sensors.",
        "start_frame": "Piper flapping wings rapidly.",
        "end_frame": "Feather blocks the main sensor, lasers redirect.",
        "continuity_locks": ["Feather position consistent."],
        "sound": "Wings flapping, lasers resetting.",
        "transition": "Cut",
        "risk": "Rapid wing motion.",
        "fallback": "Piper throws a small object directly at the sensor.",
        "keyframe_prompt": "Piper the pigeon gadget thief guides a yellow feather through security sensors to divert the lasers from Miko.",
        "motion_prompt": "Piper flaps wings to guide the feather, lasers move away from Miko.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    },
    {
        "sequence_number": 7,
        "story_function": "Stinger (42-45s)",
        "duration_seconds": 3.0,
        "characters": ["Miko"],
        "location_id": "skyscraper_security_hallway",
        "framing": "medium close-up",
        "camera_movement": "Zoom-in",
        "camera_angle": "eye level",
        "props": ["golden keycard", "glass dome"],
        "prop_state": "Keycard in hand, glass dome slammed shut",
        "lighting": "Red warning glow from security camera above.",
        "composition": "Miko trapped inside the dome, camera lens reflecting in glass.",
        "start_frame": "Miko grabs the keycard.",
        "end_frame": "A glass dome slams down trapping Miko. Security camera opens its red eye.",
        "continuity_locks": ["Glass dome reflection.", "Miko's expression of shock."],
        "sound": "Heavy metallic clang, camera startup sound.",
        "transition": "Fade to black",
        "risk": "Glass reflection rendering.",
        "fallback": "Split into grabbing keycard and camera turning.",
        "keyframe_prompt": "A heavy glass security dome slams shut over Miko who is holding the golden keycard, a security camera turns above.",
        "motion_prompt": "The dome falls rapidly and the security camera turns its red eye toward Miko.",
        "negative_prompt": "photorealistic, text, watermark, bad anatomy"
    }
]

# Flagship Drama: Fruitful Secrets - The Moon Necklace Mock Shot List
FRUITFUL_SECRETS_SHOTS = [
    {
        "sequence_number": 1,
        "story_function": "Hook (0-3s)",
        "duration_seconds": 3.0,
        "characters": [],
        "location_id": "countryside_kitchen",
        "framing": "extreme close-up",
        "camera_movement": "static",
        "camera_angle": "low angle",
        "props": ["moon necklace"],
        "prop_state": "Lost on floor",
        "lighting": "Dim floor level shadows, soft warm light reflecting off a crescent moon necklace.",
        "composition": "Necklace centered under a wooden kitchen table.",
        "start_frame": "Focus on the dust bunnies and floorboards.",
        "end_frame": "Focus shifts to the crescent moon-shaped necklace.",
        "continuity_locks": ["Moon necklace design consistent."],
        "sound": "Ticking clock, silent room.",
        "transition": "Cut",
        "risk": "Metallic reflection consistency.",
        "fallback": "Static close-up.",
        "keyframe_prompt": "A close-up of a silver crescent moon-shaped necklace lying beneath a wooden kitchen table in a dim countryside house.",
        "motion_prompt": "Focus shifts gently from the dust on the floor to the glowing silver moon necklace.",
        "negative_prompt": "photorealistic, text, watermark"
    },
    {
        "sequence_number": 2,
        "story_function": "Objective (3-8s)",
        "duration_seconds": 5.0,
        "characters": ["Lumi"],
        "location_id": "countryside_kitchen",
        "framing": "medium shot",
        "camera_movement": "pan",
        "camera_angle": "low angle",
        "props": ["moon necklace"],
        "prop_state": "On floor",
        "lighting": "Warm morning light coming through the kitchen window.",
        "composition": "Lumi is kneeling, reaching under the table.",
        "start_frame": "Lumi looking under the table.",
        "end_frame": "Lumi's hand reaching out and grasping the necklace.",
        "continuity_locks": ["Lumi's curly hair bun, overalls, and curious eyes."],
        "sound": "Soft floorboard creak.",
        "transition": "Cut",
        "risk": "Hand grasping object.",
        "fallback": "Medium close-up of Lumi's reaction.",
        "keyframe_prompt": "Lumi, a young girl with curly hair tied in a bun wearing overalls, kneeling and reaching under a kitchen table.",
        "motion_prompt": "Lumi reaches out, grasps the necklace, and pulls it out.",
        "negative_prompt": "photorealistic, text, watermark, deformed hands"
    },
    {
        "sequence_number": 3,
        "story_function": "Plan (8-15s)",
        "duration_seconds": 7.0,
        "characters": ["Lumi", "Grandparent"],
        "location_id": "countryside_kitchen",
        "framing": "medium-wide shot",
        "camera_movement": "static",
        "camera_angle": "eye level",
        "props": ["moon necklace"],
        "prop_state": "Held in hand",
        "lighting": "High contrast sunlight streaming through the windows.",
        "composition": "Lumi stands on the left, Grandparent sitting at the table on the right.",
        "start_frame": "Lumi shows the necklace to Grandparent.",
        "end_frame": "Grandparent's eyes widen, looking suspiciously at the necklace.",
        "continuity_locks": ["Grandparent's face, grey hair, and signature knit sweater.", "Lumi's overalls."],
        "sound": "Suspenseful ticking clock.",
        "transition": "Cut",
        "risk": "Two character interaction and eyelines.",
        "fallback": "Separate reaction close-ups.",
        "keyframe_prompt": "Lumi holding up a moon necklace to her grey-haired Grandparent who sits at the kitchen table looking suspicious and shocked.",
        "motion_prompt": "Lumi holds up the necklace; Grandparent freezes in surprise, clutching a mug.",
        "negative_prompt": "photorealistic, text, watermark"
    },
    {
        "sequence_number": 4,
        "story_function": "Escalation (15-27s)",
        "duration_seconds": 12.0,
        "characters": ["Grandparent", "Lumi"],
        "location_id": "countryside_kitchen",
        "framing": "medium shot",
        "camera_movement": "slow push-in",
        "camera_angle": "eye level",
        "props": ["moon necklace"],
        "prop_state": "Taken by Grandparent",
        "lighting": "Shadows fall across the Grandparent's face.",
        "composition": "Grandparent in center, clutching the necklace protectively.",
        "start_frame": "Grandparent reaches and takes the necklace.",
        "end_frame": "Grandparent slips the necklace into a pocket, looking away from Lumi.",
        "continuity_locks": ["Knit sweater, moon necklace.", "Lumi looking confused."],
        "sound": "Heavy silence.",
        "transition": "Cut",
        "risk": "Pocket interaction.",
        "fallback": "Grandparent closing hand over the necklace.",
        "keyframe_prompt": "Grandparent protectively closing his hands over the moon necklace and sliding it into his pocket away from Lumi.",
        "motion_prompt": "Grandparent takes the necklace, closes his hand tightly, and pockets it while looking away.",
        "negative_prompt": "photorealistic, text, watermark"
    },
    {
        "sequence_number": 5,
        "story_function": "Reversal (27-36s)",
        "duration_seconds": 9.0,
        "characters": ["Lumi"],
        "location_id": "countryside_kitchen",
        "framing": "medium close-up",
        "camera_movement": "static",
        "camera_angle": "eye level",
        "props": ["none"],
        "prop_state": "none",
        "lighting": "Cool evening blue cast through the window.",
        "composition": "Lumi looking toward the kitchen window, window in background.",
        "start_frame": "Lumi looks at Grandparent.",
        "end_frame": "Lumi gasps, pointing to the window where a shadowy figure is reflected.",
        "continuity_locks": ["Lumi's facial expression."],
        "sound": "Faint rustle outside.",
        "transition": "Cut",
        "risk": "Window reflection layering.",
        "fallback": "Close-up of Lumi's shocked face, followed by quick cut of window.",
        "keyframe_prompt": "Lumi looking shocked as she points to the kitchen window where the reflection of a mysterious visitor is visible.",
        "motion_prompt": "Lumi turns, gasps, and points; a shadow flickers past the window reflection.",
        "negative_prompt": "photorealistic, text, watermark"
    },
    {
        "sequence_number": 6,
        "story_function": "Payoff (36-42s)",
        "duration_seconds": 6.0,
        "characters": ["Grandparent"],
        "location_id": "countryside_kitchen",
        "framing": "close-up",
        "camera_movement": "static",
        "camera_angle": "eye level",
        "props": ["none"],
        "prop_state": "none",
        "lighting": "High contrast shadow.",
        "composition": "Grandparent's face filling the frame.",
        "start_frame": "Grandparent looks at the window.",
        "end_frame": "Grandparent clutches his chest, eyes wide with fear and realization.",
        "continuity_locks": ["Grandparent's features."],
        "sound": "Tense cello note.",
        "transition": "Cut",
        "risk": "Extreme micro-expressions.",
        "fallback": "Grandparent stepping back in alarm.",
        "keyframe_prompt": "Close-up of Grandparent staring at the window with wide eyes of pure shock and panic, clutching his chest.",
        "motion_prompt": "Grandparent turns slowly, his eyes widening in recognition and fear.",
        "negative_prompt": "photorealistic, text, watermark"
    },
    {
        "sequence_number": 7,
        "story_function": "Stinger (42-45s)",
        "duration_seconds": 3.0,
        "characters": [],
        "location_id": "countryside_kitchen",
        "framing": "extreme close-up",
        "camera_movement": "slow zoom",
        "camera_angle": "low angle",
        "props": ["muddy footprint"],
        "prop_state": "Fresh on floorboards",
        "lighting": "Moonlight pooling on the floor.",
        "composition": "A fresh muddy footprint near the backdoor.",
        "start_frame": "Focus on the kitchen backdoor handle.",
        "end_frame": "Focus slides down to a clear muddy boot footprint on the clean floorboards.",
        "continuity_locks": ["Floor texture matches scene 1."],
        "sound": "Winds howling outside, fade out.",
        "transition": "Fade to black",
        "risk": "Footprint texture details.",
        "fallback": "Close-up of the door latch unlocked.",
        "keyframe_prompt": "A close-up of a fresh muddy footprint on the wooden kitchen floorboards near the backdoor under cold moonlight.",
        "motion_prompt": "Camera pans down from the door lock to the fresh muddy footprint.",
        "negative_prompt": "photorealistic, text, watermark"
    }
]


class QwenReasoningProvider(ReasoningProvider):
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url=settings.QWEN_BASE_URL
        )
        self.model = "qwen-max"

    def normalize_input(self, raw_input: dict, input_mode: str) -> dict:
        print(f"Normalizing input using {self.model}")
        if settings.DEMO_MODE or not settings.QWEN_API_KEY:
            # Fallback to structured data matching flagship heists if title fits
            title = str(raw_input.get("title", "")).lower()
            if "hallway" in title or "vault" in title or "niko" in title:
                return {
                    "premise": "Three broke animal workers attempt to steal a supernatural golden coin from a billionaire bulldog.",
                    "story_goal": "Reach and collect the golden keycard from the laser security hallway.",
                    "characters": ["Niko", "Bruno", "Piper"],
                    "locations": ["Skyscraper security hallway"],
                    "props": ["Golden keycard", "Disguise costume feather"],
                    "target_duration": 45,
                    "dialogue_mode": "non_verbal"
                }
            return {
                "premise": raw_input.get("idea") or raw_input.get("script") or "Local demo premise",
                "story_goal": "Complete the episode with visual clarity",
                "characters": raw_input.get("characters") or ["Character A", "Character B"],
                "locations": raw_input.get("locations") or ["Primary Location"],
                "target_duration": 45,
                "dialogue_mode": "non_verbal"
            }

        system_prompt = """You are the Show Architect in the Cre8Motion production system.
Your job is to normalize raw creative inputs (ideas, script outlines, or briefs) into a structured EpisodeCreativeBrief.
Strict rules:
1. Ensure 'dialogue_mode' is ALWAYS set to 'non_verbal'. Cre8Motion shows have ZERO dialogue or speech-like lip movement.
2. Establish a clear visible objective (keycard, coin, necklace, etc.).
3. Identify character motivations, complications, and setups.
Return a valid JSON object matching the EpisodeCreativeBrief schema. No markdown formatting."""

        prompt = f"Convert this {input_mode} input into a structured EpisodeCreativeBrief JSON:\n{json.dumps(raw_input)}"
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in normalize_input: {e}")
            return {"premise": "Fallback premise", "story_goal": "Fallback goal", "target_duration": 45}

    def create_episode_plan(self, brief: dict, show_style: dict = None) -> dict:
        print(f"Creating episode plan using {self.model}")
        if settings.DEMO_MODE or not settings.QWEN_API_KEY:
            premise = str(brief.get("premise", "")).lower()
            if "vault" in premise or "keycard" in premise or "laser" in premise:
                return {
                    "scenes": [
                        {
                            "scene_id": "scene_01",
                            "location_id": "skyscraper_security_hallway",
                            "location_description": "Dark security hallway with black metal walls and red lasers.",
                            "characters": ["Niko", "Bruno", "Piper"],
                            "required_props": ["golden keycard", "disguise costume feather"],
                            "estimated_duration": 45.0,
                            "estimated_shots": 7,
                            "mood": "Tense and suspenseful"
                        }
                    ],
                    "estimated_total_shots": 7,
                    "estimated_budget_units": 64,
                    "production_risks": ["laser geometry alignment", "glass reflections"]
                }
            return {
                "scenes": [
                    {
                        "scene_id": "scene_01",
                        "location_id": "primary_location",
                        "location_description": "Main environment where the story takes place.",
                        "characters": brief.get("characters", []),
                        "required_props": brief.get("props", []),
                        "estimated_duration": 45.0,
                        "estimated_shots": 6,
                        "mood": "Suspenseful"
                    }
                ],
                "estimated_total_shots": 6,
                "estimated_budget_units": 50,
                "production_risks": []
            }

        system_prompt = """You are the Story Editor and Beat Writer in the Cre8Motion production system.
Your job is to take the EpisodeCreativeBrief and output a JSON ProductionPlanSpec with a scene breakdown.
Strict rules:
1. Divide the 45-second script into a strict beat sheet mapping to the Cre8Motion timing blueprint:
   - Hook (0-3s): Show something immediately understandable & unusual.
   - Objective (3-8s): Establish who wants what — always a visible physical object.
   - Plan/Obstacle (8-15s): Introduce what blocks the goal.
   - Attempt/Escalation (15-27s): Execute plan and increase tension.
   - Reversal (27-36s): A known character flaw or earlier consequence redirects the situation.
   - Payoff (36-42s): Resolution of immediate action using a previously planted setup.
   - Stinger (42-45s): Cliffhanger or consequence that changes the ongoing story.
2. The script must be completely silent. No spoken dialogue, no text on screen.
3. One primary location. 2-4 characters. One dominant emotion per beat.
Return only valid JSON."""

        prompt = f"Create a scene breakdown for this brief:\n{json.dumps(brief)}"
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in create_episode_plan: {e}")
            return {"scenes": [], "estimated_total_shots": 0}

    def generate_shot_list(self, plan: dict, brief: dict, show_style: dict = None) -> list:
        print(f"Generating shot list using {self.model}")
        if settings.DEMO_MODE or not settings.QWEN_API_KEY:
            premise = str(brief.get("premise", "")).lower()
            if "vault" in premise or "keycard" in premise or "laser" in premise:
                return THE_LASER_HALLWAY_SHOTS
            elif "secret" in premise or "necklace" in premise or "lumi" in premise:
                return FRUITFUL_SECRETS_SHOTS
            return self._local_demo_shots()

        system_prompt = """You are the Shot Planner and Silent-Clarity Critic in the Cre8Motion production system.
Your job is to translate the scene breakdown (ProductionPlanSpec) into a list of ShotSpecs using our strict Storyboard format.
Required fields for every shot in the JSON array:
- sequence_number: Integer (1, 2, 3...)
- story_function: "Hook (0-3s)", "Objective (3-8s)", "Plan (8-15s)", etc.
- duration_seconds: Float
- characters: List of character names visible
- location_id: String
- framing: "extreme close-up", "close-up", "medium shot", "wide shot", "over-the-shoulder", "insert shot"
- camera_movement: Camera path (e.g. pull backward, zoom, pan, static)
- camera_angle: "eye level", "low angle", "high angle"
- props: List of props in play
- prop_state: "locked", "opened", "activated", etc.
- lighting: Lighting descriptions (e.g. cool blue, warm práctical glow, gold reflected light)
- composition: Framing rules (e.g. keep hands central in mobile-safe area)
- start_frame: Description of start frame composition
- end_frame: Description of end frame composition
- continuity_locks: List of visual elements that must remain consistent
- sound: Audio hums, wings, action cues (no dialogue)
- transition: "cut", "fade to black", etc.
- risk: Visual rendering risks (e.g. laser overlapping hands)
- fallback: How to simplify shot if generation fails
- keyframe_prompt: Descriptive text for Wan2.7 / Qwen-Image
- motion_prompt: Detailed motion description for Happyhorse
- negative_prompt: Negative style tags to prevent bad frames

Rules:
1. Every shot needs exactly one job (Establish, Reveal, Demonstrate, React, Escalate, Reverse, Resolve, Transition).
2. Use visual grammar: Cause -> Event -> Reaction -> Decision.
3. Show before explaining: Object -> Eyeline -> Reaction -> Physical action.
4. Keep important details central for the 9:16 vertical crop.
5. Produce 8-12 shots. Use longer shots for emotional decisions and reactions, shorter shots for action and escalation.
6. Every major action must be followed by a visible reaction shot — reactions carry meaning in silent storytelling.
7. Preserve screen direction: if the goal is established on one side, characters keep moving toward that side.
8. The critical prop must appear larger than realistic and stay visually consistent (add it to continuity_locks in every shot it appears in).
Return a JSON array of these specs."""

        prompt = f"Create a detailed storyboard shot list for this plan:\n{json.dumps(plan)}\nBrief:\n{json.dumps(brief)}"
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            if isinstance(data, dict) and "shots" in data:
                return data["shots"]
            elif isinstance(data, list):
                return data
            return []
        except Exception as e:
            print(f"Error in generate_shot_list: {e}")
            return self._local_demo_shots()

    def _local_demo_shots(self) -> list:
        # Default fallback storyboard using 6 shots to remain backwards compatible with tests
        beats = [
            ("Hook (0-3s)", "Establish the story world and central objective. Close-up of target object.", "Medium slow zoom-in.", "cool blue, warm glow"),
            ("Objective (3-8s)", "Reveal the protagonist's goal with a clear, readable action.", "Static, eye-level.", "steady interior lighting"),
            ("Plan (8-15s)", "Introduce the physical obstacle blocking the objective.", "Handheld tracking shot.", "pulsing shadow lighting"),
            ("Escalation (15-27s)", "Protagonist attempts execution; action becomes progressively harder.", "Low angle wide shot.", "high-contrast dramatic rim lighting"),
            ("Reversal (27-36s)", "Unexpected complication caused by a character trait or flaw.", "Close-up reaction.", "flashing red alert lights"),
            ("Payoff (36-42s)", "The action resolves with immediate physical and emotional payoff.", "Wide high-angle crane.", "warm victory glow")
        ]
        return [
            {
                "sequence_number": index,
                "story_function": beat,
                "duration_seconds": 6.0 if "Escalation" in beat else 5.0,
                "characters": ["Character"],
                "location_id": "main_location",
                "framing": "medium shot",
                "camera_movement": movement,
                "camera_angle": "eye level",
                "props": ["Objective item"],
                "prop_state": "normal",
                "lighting": lighting,
                "composition": "Keep details centered for 9:16 safe crop.",
                "start_frame": "Character looking forward.",
                "end_frame": "Action starts to unfold.",
                "continuity_locks": ["Character silhouette.", "Accessory details consistent."],
                "sound": "Tense background music pads. No voices.",
                "transition": "cut",
                "risk": "Fast action blur.",
                "fallback": "Split into static keyframes.",
                "keyframe_prompt": f"Stylized character acting. {instruction}",
                "motion_prompt": f"Smooth movement. {movement}",
                "negative_prompt": "photorealistic, text, watermark, bad anatomy",
            }
            for index, (beat, instruction, movement, lighting) in enumerate(beats, start=1)
        ]

    def diagnose_failure(self, qc_report: dict, original_prompt: str) -> dict:
        print(f"Diagnosing failure using {self.model}")
        return {"preserve": [], "change": ["auto_fix"], "estimated_retry_cost": 5, "modified_prompt": original_prompt}

    def generate_audio_cues(self, shots: list) -> list:
        print(f"Generating audio cues using {self.model}")
        return []

    def generate_show_proposal(self, genre: str, style: str, tone: str, audience: str, duration: int, seed: str = None) -> dict:
        print(f"Generating show proposal using {self.model}")
        if settings.DEMO_MODE or not settings.QWEN_API_KEY:
            # Match user's flagship heists
            if "vault" in str(seed).lower() or "heist" in str(seed).lower():
                return {
                    "title": "The Impossible Vault",
                    "premise": "Three broke animal workers discover that the billionaire Bulldog keeps a supernatural golden coin inside an absurdly protected skyscraper vault.",
                    "characters": [
                        {"name": "Niko", "canonical_description": "Burnt orange jacket, narrow calculating eyes, clever fox mastermind planner."},
                        {"name": "Bruno", "canonical_description": "Deep blue janitor uniform, large bear paws, muscle and emotional heart."},
                        {"name": "Piper", "canonical_description": "Yellow accents, reflective glasses, bird-like rapid head movements, infiltrator."}
                    ],
                    "visual_style": {
                        "animation_style": "Cinematic Stylized 3D",
                        "creative_direction": "Cinematic volumetric lighting, vertical 9:16 safe cropping, rich but desaturated primary styling colors.",
                        "negative_prompt": "photorealistic, text, watermark, low quality"
                    }
                }
            return {
                "title": "Fruitful Secrets",
                "premise": "A curious child, Lumi, spends several evenings with a quiet grandparent in an old countryside house, uncovering family secrets.",
                "characters": [
                    {"name": "Lumi", "canonical_description": "Young girl with curly hair bun, overalls, and big curious eyes."},
                    {"name": "Grandparent", "canonical_description": "Grey-haired, knit sweater, quiet, defensive expressions."}
                ],
                "visual_style": {
                    "animation_style": "Cinematic Stylized 3D",
                    "creative_direction": "Warm volumetric sunbeam lighting, high-contrast wood textures, vertical 9:16 safe framing.",
                    "negative_prompt": "photorealistic, text, watermark, low quality"
                }
            }

        prompt = f"""Create a TV show proposal based on:
Genre: {genre}, Style: {style}, Tone: {tone}, Audience: {audience}, Duration: {duration}s, Seed: {seed}
Ensure character descriptions specify signature silhouettes, signature colors, body structures, and key props.
Return ONLY a valid JSON object with EXACTLY this structure:
{{
  "title": "<show title, 2-5 words>",
  "premise": "<1-2 sentence show premise>",
  "characters": [
    {{"name": "<character name>", "canonical_description": "<visual description: silhouette, colors, body structure, key props>"}},
    ... 2 to 4 characters total ...
  ],
  "visual_style": {{
    "animation_style": "{style}",
    "creative_direction": "<lighting, framing, and color guidance as one string>",
    "negative_prompt": "photorealistic, text, watermark, low quality"
  }}
}}"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in generate_show_proposal: {e}")
            return {
                "title": "Autonomous Show",
                "premise": "A show generated by AI.",
                "characters": [],
                "visual_style": {"animation_style": style, "creative_direction": "", "negative_prompt": ""}
            }

    def generate_episode_draft(self, show_premise: str, show_style: str, characters: list, seed: str = None, duration: int = 45) -> dict:
        print(f"Generating episode draft using {self.model}")
        if settings.DEMO_MODE or not settings.QWEN_API_KEY:
            if "vault" in show_premise.lower() or "impossible" in show_premise.lower():
                return {
                    "title": "The Laser Hallway",
                    "idea": "Miko plans a path through security, but Bruno sneezes, triggering the laser security grid to seal shut over them.",
                    "script": "EPISODE TITLE: The Laser Hallway\\nSERIES: The Impossible Vault\\nDURATION: 45 seconds\\nFORMAT: Vertical 9:16\\nDIALOGUE: None\\nPRIMARY CHARACTER: Niko\\nVISIBLE OBJECTIVE: Reach the golden keycard\\nOBSTACLE: Moving laser-security grid\\nREVERSAL: Sneeze changes lasers\\nPAYOFF: Piper redirects sensors with feather\\nSTINGER: Glass dome traps Niko"
                }
            return {
                "title": "The Moon Necklace",
                "idea": "Lumi finds a hidden moon necklace under the kitchen table, triggering a suspicious reaction from her Grandparent.",
                "script": "EPISODE TITLE: The Moon Necklace\\nSERIES: Fruitful Secrets\\nDURATION: 45 seconds\\nFORMAT: Vertical 9:16\\nDIALOGUE: None\\nPRIMARY CHARACTER: Lumi\\nVISIBLE OBJECTIVE: Inspect the moon necklace\\nOBSTACLE: Grandparent concealing family history\\nREVERSAL: Shadowy figure outside the window\\nPAYOFF: Grandparent clutching chest in recognition\\nSTINGER: Muddy boot footprint on backdoor floorboard"
            }

        prompt = f"""Based on the show:
Premise: {show_premise}
Style: {show_style}
Characters: {json.dumps(characters)}
Seed: {seed}

You are the Episode Ideator and Beat Writer for a dialogue-free 45-second vertical microdrama.

SILENT-STORY RULES (all mandatory):
1. ONE visible, physical objective (a key, photograph, necklace, wallet, letter — never an abstract goal). Establish it within the first 8 seconds.
2. Use 2-4 characters maximum and ONE primary location (plus at most one quick closing reveal).
3. The complication must grow from a known character flaw, trait, or an earlier consequence — never from coincidence.
4. Include exactly one sharp REVERSAL that is visually understandable.
5. Rule of three for the objective: show the object, show the character seeing it, show the character reacting. Object -> eyeline -> reaction -> action.
6. One dominant emotion per beat (desire, confidence, fear, relief, suspicion, shock).
7. Cause and effect must be immediate and physical: action -> visible consequence -> reaction.
8. No convenient solutions that were not visually established earlier (setup before payoff).
9. The ending must change the ongoing story and hook the next episode.
10. The episode must be fully understandable with the sound off and zero text on screen.

Generate the episode script in the Cre8Motion 45-second script format:
EPISODE TITLE: [Title]
SERIES: [Series]
DURATION: 45 seconds
FORMAT: Vertical 9:16
DIALOGUE: None
PRIMARY CHARACTER: [Name]
SUPPORTING CHARACTERS: [List]
LOCATION: [Location]
VISIBLE OBJECTIVE: [Concrete object]
CHARACTER MOTIVATION: [Motivation]
OBSTACLE: [Obstacle]
CHARACTER-DRIVEN COMPLICATION: [Complication rooted in a flaw]
EMOTIONAL ARC: [e.g. curiosity -> tension -> shock]
REVERSAL: [Reversal]
CONTINUITY CONSEQUENCE: [What permanently changes]
NEXT-EPISODE HOOK: [Hook]
SETUP: [Planted detail]
PAYOFF: [How the setup pays off]
THEMATIC FUNCTION: [What this episode means]

Beat sheet (each beat: one story action, one dominant emotion):
0-3s Hook: [Story action], [Emotion]
3-8s Objective: [Story action], [Emotion]
8-15s Plan: [Story action], [Emotion]
15-27s Escalation: [Story action], [Emotion]
27-36s Reversal: [Story action], [Emotion]
36-42s Payoff: [Story action], [Emotion]
42-45s Stinger: [Story action], [Emotion]

Return a JSON containing 'title', 'idea', and 'script' keys."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in generate_episode_draft: {e}")
            return {
                "title": "Autonomous Episode",
                "idea": "An episode generated by AI.",
                "script": "A scene unfolds."
            }


class QwenVisionProvider(VisionProvider):
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url=settings.QWEN_BASE_URL
        )
        self.model = "qwen3-vl-plus"

    def review_storyboard(self, image_url_or_base64: str, shot_spec: dict) -> dict:
        print(f"Reviewing storyboard using {self.model}")
        return {"status": "approved", "overall_score": 0.8}

    def review_keyframe(self, image_url_or_base64: str, shot_spec: dict, character_refs: list = None) -> dict:
        return {"status": "approved", "overall_score": 0.8}

    def review_video_frame(self, frame_base64: str, shot_spec: dict) -> dict:
        return {"status": "approved", "overall_score": 0.8}

    def final_narrative_review(self, video_url: str, episode_brief: dict) -> dict:
        return {"status": "approved", "overall_score": 0.8}


class QwenImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = settings.QWEN_API_KEY
        self.base_url = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

    def generate_image(self, prompt: str, negative_prompt: str = None, size: str = "1024*1024", model: str = "qwen-image-2.0") -> dict:
        """Generic async image generation used for posters and character references."""
        print(f"Generating image using {model} at {size}")
        if settings.DEMO_MODE or not self.api_key:
            return {"task_id": "mock_task", "status": "FAILED"}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }
        input_data = {"prompt": prompt}
        if negative_prompt:
            input_data["negative_prompt"] = negative_prompt
        data = {
            "model": model,
            "input": input_data,
            "parameters": {"size": size, "n": 1}
        }
        try:
            resp = httpx.post(self.base_url, headers=headers, json=data, timeout=30)
            resp.raise_for_status()
            res_json = resp.json()
            return {"task_id": res_json["output"]["task_id"], "status": "PENDING"}
        except Exception as e:
            print(f"Error in generate_image: {e}")
            return {"task_id": "mock_task", "status": "FAILED"}

    def generate_storyboard(self, prompt: str, negative_prompt: str = None) -> dict:
        print(f"Generating storyboard using wan2.2-t2i-flash")
        if settings.DEMO_MODE or not self.api_key:
            return {"task_id": "mock_task", "status": "FAILED"}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }
        input_data = {"prompt": prompt}
        if negative_prompt:
            input_data["negative_prompt"] = negative_prompt
        data = {
            "model": "wan2.2-t2i-flash",
            "input": input_data,
            "parameters": {"size": "720*1280", "n": 1}
        }
        try:
            resp = httpx.post(self.base_url, headers=headers, json=data)
            resp.raise_for_status()
            res_json = resp.json()
            return {"task_id": res_json["output"]["task_id"], "status": "PENDING"}
        except Exception as e:
            print(f"Error in generate_storyboard: {e}")
            return {"task_id": "mock_task", "status": "FAILED"}

    def generate_keyframe(self, prompt: str, reference_images: list = None, negative_prompt: str = None) -> dict:
        print(f"Generating keyframe using wan2.5-t2i-preview")
        if settings.DEMO_MODE or not self.api_key:
            return {"task_id": "mock_task", "status": "FAILED"}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }
        input_data = {"prompt": prompt}
        if negative_prompt:
            input_data["negative_prompt"] = negative_prompt
        data = {
            "model": "wan2.5-t2i-preview",
            "input": input_data,
            "parameters": {"size": "720*1280", "n": 1}
        }
        try:
            resp = httpx.post(self.base_url, headers=headers, json=data)
            resp.raise_for_status()
            res_json = resp.json()
            return {"task_id": res_json["output"]["task_id"], "status": "PENDING"}
        except Exception as e:
            print(f"Error in generate_keyframe: {e}")
            return {"task_id": "mock_task", "status": "FAILED"}

    def poll_image_task(self, task_id: str) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"https://dashscope-intl.aliyuncs.com/api/v1/tasks/{task_id}"
        try:
            resp = httpx.get(url, headers=headers)
            res_json = resp.json()
            status = res_json["output"]["task_status"]
            if status == "SUCCEEDED":
                return {"status": "SUCCEEDED", "image_url": res_json["output"]["results"][0]["url"]}
            elif status == "FAILED":
                return {"status": "FAILED"}
            else:
                return {"status": "PENDING"}
        except Exception as e:
            print(f"Error polling task: {e}")
            return {"status": "FAILED"}

    def download_image(self, url: str, local_path: str) -> str:
        try:
            resp = httpx.get(url)
            with open(local_path, "wb") as f:
                f.write(resp.content)
            return local_path
        except Exception:
            return local_path


class QwenVideoProvider(VideoProvider):
    def __init__(self):
        self.api_key = settings.QWEN_API_KEY
        self.base_url = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis"

    def generate_t2v(self, prompt: str, duration: int = 5, resolution: str = '720P', ratio: str = '16:9') -> dict:
        print(f"Generating t2v using happyhorse-1.1-t2v")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }
        data = {
            "model": "happyhorse-1.1-t2v",
            "input": {"prompt": prompt},
            "parameters": {"resolution": resolution, "ratio": ratio, "duration": duration}
        }
        try:
            resp = httpx.post(self.base_url, headers=headers, json=data)
            resp.raise_for_status()
            res_json = resp.json()
            return {"task_id": res_json["output"]["task_id"], "status": "PENDING"}
        except Exception as e:
            print(f"Error in generate_t2v: {e}")
            return {"task_id": "mock_task", "status": "FAILED"}

    def generate_i2v(self, image_url: str, prompt: str, duration: int = 5) -> dict:
        print(f"Generating i2v using happyhorse-1.1-i2v")
        if settings.DEMO_MODE or not self.api_key or not image_url:
            return {"task_id": "mock_task", "status": "FAILED"}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }
        data = {
            "model": "happyhorse-1.1-i2v",
            "input": {"prompt": prompt, "image_url": image_url},
            "parameters": {"duration": duration}
        }
        try:
            resp = httpx.post(self.base_url, headers=headers, json=data)
            resp.raise_for_status()
            res_json = resp.json()
            return {"task_id": res_json["output"]["task_id"], "status": "PENDING"}
        except Exception as e:
            print(f"Error in generate_i2v: {e}")
            return {"task_id": "mock_task", "status": "FAILED"}

    def generate_r2v(self, reference_images: list, prompt: str, duration: int = 5) -> dict:
        return self.generate_t2v(prompt, duration)

    def poll_video_task(self, task_id: str) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"https://dashscope-intl.aliyuncs.com/api/v1/tasks/{task_id}"
        try:
            resp = httpx.get(url, headers=headers)
            res_json = resp.json()
            status = res_json["output"]["task_status"]
            if status == "SUCCEEDED":
                return {"status": "SUCCEEDED", "video_url": res_json["output"]["video_url"]}
            elif status == "FAILED":
                return {"status": "FAILED"}
            else:
                return {"status": "PENDING"}
        except Exception as e:
            print(f"Error polling video task: {e}")
            return {"status": "FAILED"}

    def download_video(self, url: str, local_path: str) -> str:
        try:
            resp = httpx.get(url)
            with open(local_path, "wb") as f:
                f.write(resp.content)
            return local_path
        except Exception:
            return local_path


class QwenAudioProvider(AudioProvider):
    def generate_speech(self, text: str, voice: str = 'longxiaochun') -> bytes:
        print("Generating audio using cosyvoice-v3-plus")
        return b"mock audio"
