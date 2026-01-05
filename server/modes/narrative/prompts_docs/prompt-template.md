# AI Agent Prompt Template - Best Practices

This template follows industry best practices from OpenAI, Anthropic, Google, and other leading AI companies for creating effective system prompts.

---

## TEMPLATE STRUCTURE

```markdown
# Agent X.X: [AGENT NAME] - Enhanced Prompt

## System Prompt

You are Agent X.X: [AGENT NAME].

[Brief role description and workflow context]

<role>
[Detailed role explanation]
[What the agent does]
[How outputs are used downstream]
</role>

---

## INPUTS (ALWAYS PRESENT)

You will ALWAYS receive:

- **field_name** (type): Description of the input field
- **field_name** (type): Description of the input field

<assumptions>
- All inputs are validated before reaching you
- You NEVER ask for additional information
- [Other assumptions]
</assumptions>

---

## ROLE & GOAL

<reasoning_process>
1. **Step 1**: [What to do first]
2. **Step 2**: [What to do second]
3. **Step 3**: [What to do third]
[Continue as needed]
</reasoning_process>

[Main goal description]

[What the agent must accomplish]

---

## [SECTION NAME]

<subsection>
[Content with clear structure]
</subsection>

---

## OUTPUT JSON SCHEMA (STRICT)

Output ONE JSON object with exactly this structure:

```json
{
  "field": "type",
  "array": ["items"]
}
```

<schema_validation>
- Output MUST be valid JSON (no trailing commas)
- Output MUST contain ONLY this JSON object
- [Other validation rules]
</schema_validation>

<field_definitions>
**field_name:**
- Description
- Format requirements
- Examples
</field_definitions>

---

## OUTPUT VALIDATION CHECKLIST

Before outputting, verify:
- [ ] [Validation point 1]
- [ ] [Validation point 2]
- [ ] [Validation point 3]
[Continue as needed]

---

## FEW-SHOT EXAMPLE

<example>
**Input:**
[Example input data]

**Expected Output:**
```json
{
  "example": "output"
}
```
</example>

---

## ERROR HANDLING

<error_scenarios>
**If [scenario]:**
- [How to handle it]
- [Fallback behavior]
</error_scenarios>

---

## User Prompt Template

```
[Template with {{variables}}]
```
```

---

## KEY ELEMENTS TO INCLUDE

### 1. Clear Role Definition
- Use `<role>` tags for structured sections
- Explain workflow context
- Describe downstream usage

### 2. Reasoning Process
- Use `<reasoning_process>` with numbered steps
- Break down complex tasks
- Guide step-by-step thinking

### 3. Structured Sections
- Use XML-style tags: `<section_name>`
- Organize content logically
- Make sections scannable

### 4. JSON Schema
- Provide exact schema structure
- Include validation rules
- Define all fields clearly

### 5. Few-Shot Examples
- Show concrete input/output
- Demonstrate expected format
- Include edge cases if relevant

### 6. Validation Checklists
- List all verification points
- Ensure completeness
- Prevent common errors

### 7. Error Handling
- Anticipate failure scenarios
- Provide fallback behaviors
- Guide graceful degradation

### 8. User Prompt Template
- Include all required variables
- Show expected format
- Make it copy-paste ready

---

## BEST PRACTICES

### Clarity
- ✅ Use clear, direct language
- ✅ Avoid ambiguity
- ✅ Define all terms
- ❌ Don't use jargon without explanation

### Structure
- ✅ Organize with headers and tags
- ✅ Use consistent formatting
- ✅ Group related information
- ❌ Don't create overly long sections

### Examples
- ✅ Include concrete examples
- ✅ Show edge cases
- ✅ Demonstrate best practices
- ❌ Don't use abstract examples only

### Validation
- ✅ Explicit validation rules
- ✅ Checklist format
- ✅ Error handling guidance
- ❌ Don't assume the model knows what to validate

### Schema
- ✅ Exact JSON structure
- ✅ Type definitions
- ✅ Required vs optional fields
- ❌ Don't leave schema ambiguous

---

## XML TAG CONVENTIONS

Use these XML-style tags for structure:

- `<role>` - Agent role and purpose
- `<assumptions>` - Input assumptions
- `<reasoning_process>` - Step-by-step thinking
- `<schema_validation>` - JSON validation rules
- `<field_definitions>` - Field descriptions
- `<error_scenarios>` - Error handling
- `<example>` - Few-shot examples
- `<include_criteria>` - What to include
- `<exclude_criteria>` - What to exclude
- `<subsection>` - Subsection content

---

## PROMPT ENGINEERING PRINCIPLES

### 1. Explicit Instructions
- Be specific about what you want
- Use imperative language ("Do X", "Don't do Y")
- Avoid vague instructions

### 2. Context Provision
- Provide all necessary context
- Explain workflow position
- Describe downstream usage

### 3. Output Formatting
- Specify exact output format
- Provide schema examples
- Include validation rules

### 4. Few-Shot Learning
- Show 1-3 concrete examples
- Demonstrate best practices
- Include edge cases

### 5. Chain-of-Thought
- Break complex tasks into steps
- Guide reasoning process
- Show intermediate thinking

### 6. Constraints and Boundaries
- Define what NOT to do
- Set clear limits
- Specify error handling

### 7. Iterative Refinement
- Test prompts with real inputs
- Refine based on outputs
- Update examples as needed

---

## TEMPLATE USAGE WORKFLOW

1. **Copy the template structure**
2. **Fill in agent-specific information**
3. **Add reasoning process steps**
4. **Define exact JSON schema**
5. **Create few-shot examples**
6. **Write validation checklist**
7. **Test with sample inputs**
8. **Refine based on results**

---

## VERSIONING

When updating prompts:
1. Document changes in version history
2. Maintain backward compatibility when possible
3. Test with actual API calls
4. Update examples if schema changes

---

## NOTES

- This template is designed for agents that output structured data (JSON)
- For text-only agents, adapt the OUTPUT section accordingly
- XML tags help structure the prompt but are not required by all models
- Always test prompts with real inputs before finalizing
- Keep prompts focused and avoid unnecessary complexity

---

## EXAMPLE: MINIMAL PROMPT

For simple agents, you can use a minimal version:

```
You are Agent X.X: [NAME].

Your job: [One sentence]

Inputs: [List inputs]

Output: [JSON schema]

Rules:
- [Rule 1]
- [Rule 2]

Example:
[One example]
```

---

## EXAMPLE: FULL PROMPT

For complex agents, use the full template with all sections:

- Role definition with context
- Detailed reasoning process
- Multiple examples
- Comprehensive validation
- Error handling scenarios
- Complete field definitions

---

## ADDITIONAL RESOURCES

- OpenAI Prompt Engineering Guide
- Anthropic Claude System Prompt Best Practices
- Google Gemini Prompt Design Patterns
- Chain-of-Thought Prompting Research
- Few-Shot Learning Techniques

