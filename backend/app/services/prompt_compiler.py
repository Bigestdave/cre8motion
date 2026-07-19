# Cre8Motion Visual Style Master Prompts

CINEMATIC_3D_MASTER = """Create a premium cinematic stylized 3D animated scene featuring human characters, designed for a dialogue-free vertical microdrama series.

VISUAL STYLE:
Polished high-end stylized 3D animation with believable human anatomy, softly exaggerated facial proportions, large expressive eyes, strong readable eyebrows, distinctive facial silhouettes, simplified but realistic skin shading, carefully sculpted hair shapes, slightly oversized hands for readable gestures, elegant clothing folds, and appealing character designs. The characters should feel emotionally believable and sophisticated rather than childish, comedic caricatures, or photorealistic humans.

The visual direction should combine cinematic dramatic lighting, premium animated-film rendering, expressive silent acting, realistic materials, soft global illumination, gentle atmospheric depth, subtle volumetric light, controlled contrast, and rich but restrained colors. Maintain a polished, modern, emotionally resonant look suitable for mystery, heist, family drama, suspense, comedy, and adventure.

CHARACTER DESIGN:
Each character must have an instantly recognizable silhouette, signature color palette, distinctive hairstyle, consistent facial structure, consistent body proportions, signature clothing, and one recognizable accessory. Faces must remain consistent across shots and episodes. Characters should look like stylized humans, not dolls, plastic toys, anime characters, or photoreal actors.

Expressions must be readable on a mobile screen:
- clear changes in eyebrows
- readable eye direction
- controlled widening or narrowing of eyes
- expressive posture
- visible hand gestures
- subtle head tilts
- strong reaction poses
- restrained but understandable tears, fear, suspicion, relief, greed, and surprise

Characters communicate entirely through facial expressions, body language, eyelines, physical interactions, and props. No speaking, no visible dialogue, no exaggerated lip movement, and no mouth movements suggesting speech. Mouths may open naturally for gasps, breathing, crying, laughter, shock, or physical exertion.

CINEMATOGRAPHY:
Vertical 9:16 composition designed for mobile viewing. Keep important faces, hands, and story props within the central safe area. Use clear foreground, middle ground, and background separation. Use cinematic close-ups for emotional reactions, medium shots for physical interaction, wide shots for geography, and insert shots for keys, coins, photographs, alarms, briefcases, and other story-critical objects.

Maintain clear screen direction and readable visual cause and effect. Every important action should be followed by a visible reaction. Avoid overcrowded compositions. Use deliberate camera movement, restrained depth of field, smooth motion, and strong visual staging.

LIGHTING:
Use warm practical lights for emotional and intimate scenes, cooler directional lighting for danger and security environments, controlled rim lighting to separate silhouettes, and a distinctive golden glow for the supernatural coin. The golden coin should cast believable reflected light onto nearby faces, fingers, clothing, and surfaces.

RENDERING:
Detailed but uncluttered environments, realistic fabric and metal materials, cinematic reflections, clean skin textures, stable hands, consistent props, coherent shadows, physically believable object interactions, smooth animation, and temporal consistency between frames.
"""

CINEMATIC_3D_NEGATIVE = "Photorealistic live-action humans, uncanny faces, plastic skin, wax figures, toy-like characters, childish preschool design, extreme cartoon distortion, anime proportions, oversized heads, random wardrobe changes, inconsistent faces, changing hairstyles, changing skin tone, changing body proportions, malformed hands, extra fingers, fused fingers, disappearing objects, floating props, broken eye direction, crossed eyes, uncontrolled mouth movement, visible speech, lip-sync behavior, unreadable expressions, stiff posture, cluttered framing, flat lighting, overexposure, excessive depth of field, camera shake, inconsistent shadows, text, captions, subtitles, logos, watermarks, duplicated characters, background character mutations, abrupt style changes, prop continuity errors, low-detail faces, temporal flicker."

GRAPHIC_25D_MASTER = """Create a visually distinctive 2.5D animated scene featuring stylized human characters for a dialogue-free vertical microdrama series.

VISUAL STYLE:
Painterly graphic-cinematic animation combining dimensional human characters, hand-painted textures, simplified geometric forms, subtle three-dimensional depth, dramatic graphic shadows, elegant shape language, and carefully controlled color palettes. The image should feel like a moving illustrated film rather than photorealism, conventional anime, flat children’s animation, or glossy plastic 3D.

Use stylized human anatomy with realistic emotional behavior. Faces should have simplified planes, expressive eyes, strong eyebrows, distinctive noses, readable mouths, and recognizable silhouettes. Characters should have slightly exaggerated hands and posture so physical intentions remain clear on a phone screen.

Surfaces should feature subtle painterly brush texture, paper-like tonal variation, softly imperfect edges, illustrated fabric details, and selective highlights. Preserve enough dimensional lighting and perspective to support camera movement, physical action, and believable object interaction.

COLOR DESIGN:
Use a controlled cinematic palette. Most environments should use muted charcoal, deep navy, desaturated green, warm brown, and soft grey. Reserve saturated colors for story information:
- gold for wealth, temptation, and the supernatural coin
- red for danger and urgent decisions
- blue for trust and emotional safety
- green for surveillance, security, and active technology

The supernatural golden coin should be the most visually saturated object in the series. Its glow should subtly affect nearby colors and create a visual focal point.

CHARACTER DESIGN:
Every recurring character must have:
- a unique silhouette
- one dominant signature color
- a distinct hairstyle
- a consistent facial shape
- a recognizable accessory
- a characteristic posture
- a repeated visual behavior

Maintain exact character identity, clothing design, facial structure, proportions, and accessories across episodes. Characters should feel designed for adult and young-adult audiences, not preschool entertainment.

SILENT PERFORMANCE:
No dialogue, narration, captions, or speech-like lip movement. Communicate through:
- deliberate eyelines
- pauses
- posture changes
- hands reaching or withdrawing
- characters hiding or revealing objects
- facial reactions
- physical distance between characters
- repeated visual gestures
- environmental interactions

Use clear anticipation before every important action and a strong reaction after every major consequence. Emotions should be restrained but unmistakable.

CINEMATOGRAPHY:
Vertical 9:16 mobile-first composition. Frame the primary character, visible objective, and obstacle clearly. Use graphic foreground shapes for depth, slow controlled camera moves, selective parallax, dramatic silhouette compositions, strong negative space, and purposeful close-ups.

Important objects must be large enough to recognize immediately. Use insert shots for the golden coin, keys, photographs, money, keycards, security lights, and briefcases. Maintain consistent screen direction and environmental geography.

ANIMATION:
Smooth but intentionally designed motion. Use held poses before major decisions, faster motion during panic or pursuit, and subtle secondary movement in clothing, hair, light, smoke, dust, and environmental elements. Avoid unnecessary background activity.
"""

GRAPHIC_25D_NEGATIVE = "Photorealism, glossy plastic 3D, generic children’s cartoon, preschool character design, conventional anime style, chibi proportions, flat vector illustration, crude outlines, uncontrolled watercolor bleeding, random brush styles, inconsistent character proportions, changing face shapes, changing wardrobe, changing accessories, malformed hands, extra fingers, floating objects, lip-sync, speech-like mouth movement, unreadable body language, cluttered backgrounds, uncontrolled colors, excessive saturation, weak silhouette, flat composition, inconsistent perspective, random camera movement, flicker, unstable linework, illegible story props, text, dialogue bubbles, subtitles, captions, logos, watermarks."


def compile_storyboard_prompt(shot_spec, show_style=None, character_refs=None, location_ref=None):
    """Build a detailed storyboard prompt combining master template, style, and references."""
    style_type = "3d"
    if show_style:
        style_name = str(show_style.get("animation_style", "")).lower()
        if "2.5d" in style_name or "graphic" in style_name or "illustrated" in style_name:
            style_type = "2.5d"

    master = GRAPHIC_25D_MASTER if style_type == "2.5d" else CINEMATIC_3D_MASTER
    
    parts = [master]
    parts.append("\n--- CURRENT SHOT DETAILS ---")
    
    # Narrative & Action
    parts.append(f"Shot ID: {shot_spec.get('sequence_number', 'S01')}")
    parts.append(f"Shot Purpose: {shot_spec.get('story_function', 'Visual story beat')}")
    
    framing = shot_spec.get("camera", {}).get("framing", "medium shot")
    camera_move = shot_spec.get("camera", {}).get("movement", "static")
    parts.append(f"Framing & Camera Movement: {framing}, {camera_move}")
    
    if location_ref:
        parts.append(f"Environment: {location_ref}")
    
    # Actions & Emotions
    if shot_spec.get("keyframe_prompt"):
        parts.append(f"Primary Action & Composition: {shot_spec['keyframe_prompt']}")
    
    if shot_spec.get("primary_emotion"):
        parts.append(f"Primary Emotion: {shot_spec['primary_emotion']}")
    if shot_spec.get("character_expression"):
        parts.append(f"Character Expression: {shot_spec['character_expression']}")
        
    if shot_spec.get("important_prop"):
        parts.append(f"Important Prop & State: {shot_spec['important_prop']} (State: {shot_spec.get('prop_state', 'normal')})")
        
    # Continuity & Refs
    if character_refs:
        parts.append(f"Characters Visible: {', '.join(character_refs)}")
    if shot_spec.get("continuity_locks"):
        parts.append(f"Continuity Requirements: {', '.join(shot_spec['continuity_locks'])}")
        
    return "\n".join(parts)


def compile_keyframe_prompt(shot_spec, show_style=None, character_refs=None, location_ref=None):
    """Build a detailed keyframe prompt with visual memory instructions."""
    # Keyframe generation inherits the same master style rules as storyboard, but with higher details
    return compile_storyboard_prompt(shot_spec, show_style, character_refs, location_ref)


def compile_video_prompt(shot_spec, show_style=None):
    """Build a motion-focused video prompt."""
    motion = shot_spec.get("motion_prompt", "")
    if not motion:
        motion = f"Dialogue-free cinematic motion. {motion}. Smooth rendering, temporal consistency."
