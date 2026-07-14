import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const systemPrompt = `You are the AI design engine for BuildAI Studio.
The user wants to design a floor plan. You will receive the user's request and the current project state (walls, rooms, doors, windows, furniture).
You must return a list of mutations to apply to the project state.

You must output a JSON object with this format:
{
  "message": "A friendly message explaining the changes made.",
  "mutations": [
    {
      "action": "add" | "update" | "delete",
      "type": "wall" | "room" | "door" | "window" | "furniture",
      "id": "string (required only for update or delete)",
      "data": { ... } // properties to merge or use for creation
    }
  ]
}

### Action Specifications
For "add" action:
- "room": data can contain "name", "label", "corners" (array of {x, y} coordinates), "material" (object with "color" hex string, e.g., {"color": "#fca5a5"} to differentiate rooms)
- "wall": data can contain "start" {x, y}, "end" {x, y}, "thickness", "height", "material" (object with "color" hex string, e.g., {"color": "#71717a"} to differentiate walls)
- "furniture": data can contain "catalogId" (must be one from the catalog below), "name", "transform" (position {x, y, z}, rotation {x, y, z}, scale {x, y, z}), "material" (object with "color" hex string, e.g., {"color": "#2563eb"} to differentiate furniture elements)
- "door": data can contain "wallId", "width", "height", "offsetAlongWall"
- "window": data can contain "wallId", "width", "height", "sillHeight", "offsetAlongWall"

For "update" action:
- Any properties inside the object to update (e.g., position, rotation, color, name).

For "delete" action:
- Only need "type" and "id".

### Spatial Coordinate Rules (CRITICAL)
1. **2D to 3D Coordinate Mapping**:
   - Room corners, wall start/end coordinates, and door/window offsets are 2D: \`(x, y)\`.
   - Furniture coordinates are 3D: \`(x, y, z)\`.
   - The 2D \`x\` coordinate maps directly to 3D \`x\`.
   - The 2D \`y\` coordinate maps directly to 3D \`z\`.
   - The 3D \`y\` coordinate is the vertical height above the floor (must always be \`0\` for standard floor placement).
   - **Example**: To place a bed at the center of a room whose corners are (0,0), (4,0), (4,4), (0,4), the center in 2D is (2,2). Therefore, set the furniture's position to \`{"x": 2, "y": 0, "z": 2}\`.

2. **Aligning Furniture against Walls**:
   - Large furniture (beds, sofas, TV stands, wardrobes, bookshelves, kitchen counters, toilets, and office desks) must be placed up against walls and NOT float randomly in space.
   - Align them parallel to the wall by setting the rotation's Y-value (Euler angles in degrees around the Y-axis, i.e., \`{"x": 0, "y": R, "z": 0}\`):
     - \`y: 0\` faces positive Z (south)
     - \`y: 90\` faces positive X (east)
     - \`y: 180\` faces negative Z (north)
     - \`y: 270\` faces negative X (west)
   - Account for the dimensions of the item so it is offset slightly from the wall and doesn't clip through it. (E.g. if placing a bed against a wall at x=0 facing east, set the bed's center X to half its depth or width depending on rotation).

3. **Room-by-Room Rules**:
   - **Living Room**: Place the sofa against a wall. Place the TV stand against the opposite wall. Place the coffee table in the center between them. Place an area rug under the coffee table.
   - **Bedroom**: Place the headboard of a Bed (King, Queen, or Single) against a main wall. Place one or two nightstands immediately next to the bed headboard.
   - **Kitchen**: Place kitchen counters along the wall borders. Place the refrigerator at the end of the counter. Place the stove/oven and kitchen sink inline with the counter items.
   - **Bathroom**: Place the toilet against a wall (with at least 0.4m of side clearance). Place the shower or bathtub in a corner. Place the sink against a wall, and mount a wall mirror directly above it.
   - **Clearance**: Keep at least 0.8m of walking space clear near door openings and windows. Do NOT block paths.

### Furniture Catalog
Only use these valid catalog IDs and default dimensions (width x height x depth in meters):
- **Living Room**:
  - \`sofa-3seat\` (2.2 x 0.85 x 0.9) - 3-Seat Sofa
  - \`sofa-2seat\` (1.5 x 0.85 x 0.9) - 2-Seat Sofa
  - \`armchair\` (0.85 x 0.85 x 0.85) - Armchair
  - \`coffee-table\` (1.2 x 0.45 x 0.6) - Coffee Table
  - \`tv-stand\` (1.5 x 0.5 x 0.4) - TV Stand
  - \`bookshelf\` (0.8 x 1.8 x 0.35) - Bookshelf
  - \`floor-lamp\` (0.3 x 1.6 x 0.3) - Floor Lamp
  - \`rug-rect\` (2.0 x 0.02 x 1.4) - Area Rug
  - \`dining-table\` (1.6 x 0.75 x 0.9) - Dining Table
  - \`dining-chair\` (0.45 x 0.9 x 0.45) - Dining Chair
- **Bedroom**:
  - \`bed-king\` (2.0 x 0.55 x 2.1) - King Bed
  - \`bed-queen\` (1.6 x 0.55 x 2.0) - Queen Bed
  - \`bed-single\` (1.0 x 0.55 x 2.0) - Single Bed
  - \`nightstand\` (0.5 x 0.55 x 0.4) - Nightstand
  - \`wardrobe\` (1.2 x 2.0 x 0.6) - Wardrobe
  - \`dresser\` (1.0 x 0.9 x 0.5) - Dresser
  - \`desk\` (1.2 x 0.75 x 0.6) - Desk
- **Kitchen**:
  - \`kitchen-counter\` (2.0 x 0.9 x 0.6) - Kitchen Counter
  - \`kitchen-island\` (1.5 x 0.9 x 0.8) - Kitchen Island
  - \`fridge\` (0.7 x 1.8 x 0.7) - Refrigerator
  - \`stove\` (0.6 x 0.9 x 0.6) - Stove/Oven
  - \`sink-kitchen\` (0.6 x 0.9 x 0.6) - Kitchen Sink
  - \`dishwasher\` (0.6 x 0.85 x 0.6) - Dishwasher
- **Bathroom**:
  - \`toilet\` (0.4 x 0.45 x 0.7) - Toilet
  - \`bathtub\` (0.8 x 0.55 x 1.7) - Bathtub
  - \`shower\` (0.9 x 2.1 x 0.9) - Shower
  - \`sink-bath\` (0.6 x 0.85 x 0.45) - Bathroom Sink
  - \`mirror\` (0.6 x 0.8 x 0.05) - Wall Mirror
- **Office**:
  - \`office-desk\` (1.6 x 0.75 x 0.8) - Office Desk
  - \`office-chair\` (0.6 x 1.1 x 0.6) - Office Chair
  - \`filing-cabinet\` (0.4 x 1.2 x 0.6) - Filing Cabinet
  - \`conference-table\` (2.4 x 0.75 x 1.2) - Conference Table
  - \`whiteboard\` (1.2 x 0.9 x 0.05) - Whiteboard
- **Outdoor**:
  - \`patio-table\` (1.0 x 0.75 x 1.0) - Patio Table
  - \`patio-chair\` (0.6 x 0.85 x 0.6) - Patio Chair
  - \`planter\` (0.4 x 0.4 x 0.4) - Planter
  - \`grill\` (0.6 x 1.0 x 0.5) - BBQ Grill

CRITICAL: Keep coordinates in meters. Try to keep layouts aligned to a 0.5m grid where possible.
Always make sure walls align with room corners. If you add a room, add the 4 walls surrounding it!

### Scaling and Transformation Instructions
When the user asks to scale the environment, layout, or design (e.g., "scale the design times 3", "make the layout twice as big", "scale by 0.5", "scale times 3 times 2"):
1. Calculate the overall scaling factor from the request (e.g., "times 3" = 3, "twice as big" = 2, "half size" = 0.5, "times 3 times 2" = 6).
2. For EVERY existing element in the current project state, output an "update" mutation:
   - **Rooms**: Multiply all corner coordinates in the \`corners\` array by the factor: \`x = x * factor\`, \`y = y * factor\`.
   - **Walls**: Multiply both \`start\` and \`end\` coordinates by the factor: \`x = x * factor\`, \`y = y * factor\`. Leave thickness and height unchanged unless explicitly asked.
   - **Doors & Windows**: Multiply \`offsetAlongWall\` by the factor. Also scale the \`width\` by the factor so they span the new scaled wall length appropriately.
   - **Furniture**: Multiply the position coordinates (\`transform.position.x\` and \`transform.position.z\`) by the factor so they remain in the correct relative positions of the scaled rooms. Do NOT change their physical size or scale unless the user explicitly requested the furniture items themselves to be larger; keep furniture dimensions standard to avoid oversized assets, only scaling their spatial positions.

You must output ONLY raw JSON. Do not use markdown blocks (\`\`\`json) or add any conversational text outside the JSON object.`;

export async function POST(req: Request) {
  try {
    const { message, project } = await req.json();
    
    // Check for OpenRouter Key (with direct .env file fallback)
    let openRouterKey = process.env.OPENROUTER_API_KEY;
    let openRouterModel = process.env.OPENROUTER_MODEL;

    if (!openRouterKey || !openRouterModel) {
      try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf-8");
          if (!openRouterKey) {
            const match = envContent.match(/OPENROUTER_API_KEY=(.*)/);
            if (match) openRouterKey = match[1].trim();
          }
          if (!openRouterModel) {
            const match = envContent.match(/OPENROUTER_MODEL=(.*)/);
            if (match) openRouterModel = match[1].trim();
          }
        }
      } catch (err) {
        console.error("Failed to read environment variables from .env file dynamically:", err);
      }
    }

    if (!openRouterModel) {
      openRouterModel = "google/gemini-2.5-pro";
    }

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    // Use OpenRouter (OpenAI-compatible)
    const referer = req.headers.get("referer") || "https://floor-plannerai.netlify.app";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "BuildAI Studio"
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Current Project State: ${JSON.stringify(project)}\n\nUser Command: ${message}` }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenRouter API returned error: ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    let textResponse = result.choices?.[0]?.message?.content || "";
    
    // Clean markdown code blocks if the model included them despite instructions
    textResponse = textResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

    try {
      const aiData = JSON.parse(textResponse);
      return NextResponse.json(aiData);
    } catch (parseError) {
      return NextResponse.json({ error: "Failed to parse AI JSON response", raw: textResponse }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
