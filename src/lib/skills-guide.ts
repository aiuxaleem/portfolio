/* The facts the /skills page teaches (L-61): what a skill is, how to install one, and the safety advice. Every line comes
   from Anthropic's own pages, read on 9 November 2026 (scratch research notes); where two of them disagree (which plans can
   upload a custom skill, the description's length on Claude.ai), the page takes the cautious wording and says so. Check the
   sources again before changing a step. */
const DOCS = 'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview';
const HELP = 'https://support.claude.com/en/articles/12512180-using-skills-in-claude';
const CODE = 'https://code.claude.com/docs/en/skills';

export const GUIDE = {
  whatSource: 'In plain words, from Anthropic\'s Agent Skills documentation.',
  what: [
    { title: 'A folder with one required file', body: 'SKILL.md starts with a name and a description, then the instructions Claude follows. The folder can also carry longer guides, scripts and templates.' },
    { title: 'Claude reads the description first', body: 'Each installed skill costs Claude about a hundred tokens until a request matches its description. Only then does it read the instructions, and a bundled file only when the instructions point to it. So you can install many.' },
    { title: 'It works where you use Claude', body: 'In Claude.ai on the web and desktop, in Claude Code, and through the API. A skill added in one place does not appear in the others, so add it where you work.' },
  ],
  install: [
    {
      where: 'Claude.ai, web and desktop',
      who: 'Pro, Max, Ultra, Team and Enterprise plans. On Free, look under Customize > Skills: Anthropic\'s help and its documentation disagree on whether Free can upload.',
      steps: [
        'Keep the download zipped. The folder inside must have the skill\'s own name.',
        'In Settings > Capabilities, turn on Code execution and file creation (Create and edit files in the newer layout).',
        'Go to Customize > Skills, click +, then Create skill, then Upload a skill, and choose the zip.',
        'The skill appears in your list. Switch it on, then ask for the task it describes.',
        'On Team and Enterprise, an admin first allows Skills under Organization settings > Plugins & skills > Policy.',
      ],
      code: undefined as string | undefined,
      source: { label: 'Claude Help Center: Using skills in Claude', href: HELP },
    },
    {
      where: 'Claude Code',
      who: 'In the terminal, the desktop app or an editor.',
      steps: [
        'Unzip the download.',
        'Move the folder to ~/.claude/skills/ to use it in every project, or to .claude/skills/ in a repository to share it with your team.',
        'Start a new session. Claude uses the skill when a request matches, or type a slash and the skill\'s name.',
        'A skill published as a plugin installs with /plugin install name@marketplace, after /plugin marketplace add owner/repo. Run /plugin to browse.',
      ],
      code: '~/.claude/skills/\n  ui-ux-review-audit/\n    SKILL.md',
      source: { label: 'Claude Code docs: Extend Claude with skills', href: CODE },
    },
    {
      where: 'The Claude API',
      who: 'For a product or an internal tool.',
      steps: [
        'Upload a custom skill through the Skills API (the /v1/skills endpoints).',
        'Name its skill_id in the container parameter, with the code execution tool turned on.',
        'Anthropic\'s own pptx, xlsx, docx and pdf skills are already there under those IDs.',
      ],
      code: undefined as string | undefined,
      source: { label: 'Claude Docs: Agent Skills overview', href: DOCS },
    },
  ],
  safety: {
    body: 'A skill gives Claude instructions and code, so treat it like installing software. Anthropic advises using skills only from sources you trust, and reading every file a skill bundles before you install it: the SKILL.md, its scripts and its images, watching for network calls or file access that do not match what it says it does. Each of my skills links its SKILL.md above so you can do exactly that.',
    source: { label: 'Claude Docs: Security considerations for Skills', href: DOCS },
  },
};
