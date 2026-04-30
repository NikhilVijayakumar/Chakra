import os
import shutil
from pathlib import Path

# Common Source
COMMON_SKILLS = Path("skills").resolve()
COMMON_RULES = Path("rules").resolve()

# Skill Target Paths
SKILL_TARGETS = {
    "Antigravity": Path(".agent/skills"),
    "Copilot": Path(".github/skills"),
    "Claude": Path(".claude/skills"),
    "OpenCode": Path(".opencode/skills"),
    "Codex": Path(".agents/skills")
}

# Rule Target Paths
RULE_TARGETS = {
    "Antigravity": Path(".agent/rules"),
    "Copilot": Path(".github/rules"),
    "Claude": Path("CLAUDE.md"),
    "OpenCode": Path("AGENTS.md"),
    "Codex": Path("AGENTS.md"),
    "CopilotMerged": Path(".github/copilot-instructions.md")
}

def sync_skills():
    """Symlinks every skill folder to all agent skill directories."""
    for skill in [d for d in COMMON_SKILLS.iterdir() if d.is_dir()]:
        for agent_name, base_path in SKILL_TARGETS.items():
            base_path.mkdir(parents=True, exist_ok=True)
            link_target = base_path / skill.name

            if link_target.exists() or link_target.is_symlink():
                link_target.unlink() if link_target.is_symlink() else shutil.rmtree(link_target)

            os.symlink(os.path.relpath(skill, base_path), link_target, target_is_directory=True)
    print("🔄 Skills Synced.")

def sync_rules():
    """Sync rules to each agent's rules location."""
    rule_files = sorted(list(COMMON_RULES.glob("*.md")))
    if not rule_files: return

    # 1. Folder Symlinks (Antigravity, Copilot)
    for target_path in [RULE_TARGETS["Antigravity"], RULE_TARGETS["Copilot"]]:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        if target_path.exists() or target_path.is_symlink():
            target_path.unlink() if target_path.is_symlink() else shutil.rmtree(target_path)
        os.symlink(os.path.relpath(COMMON_RULES, target_path.parent), target_path)

    # 2. Merged File (Claude - CLAUDE.md)
    content = "# Project Rules\n\n"
    for rf in rule_files:
        rule_content = rf.read_text(encoding='utf-8')
        content += f"## {rf.stem.replace('-', ' ').title()}\n{rule_content}\n\n---\n\n"

    RULE_TARGETS["Claude"].parent.mkdir(parents=True, exist_ok=True)
    RULE_TARGETS["Claude"].write_text(content, encoding='utf-8')
    print("🔄 CLAUDE.md created.")

    # 3. Merged File (OpenCode + Codex - shared AGENTS.md)
    RULE_TARGETS["OpenCode"].parent.mkdir(parents=True, exist_ok=True)
    RULE_TARGETS["OpenCode"].write_text(content, encoding='utf-8')
    # Codex uses the same AGENTS.md (shared)
    print("🔄 AGENTS.md created (OpenCode + Codex).")

    # 4. Merged File (Copilot - copilot-instructions.md)
    RULE_TARGETS["CopilotMerged"].parent.mkdir(parents=True, exist_ok=True)
    RULE_TARGETS["CopilotMerged"].write_text(content, encoding='utf-8')
    print("🔄 Rules Merged & Synced.")

if __name__ == "__main__":
    sync_skills()
    sync_rules()