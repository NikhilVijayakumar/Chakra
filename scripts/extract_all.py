import shutil
from pathlib import Path

# Common Destination
COMMON_SKILLS = Path("skills").resolve()
COMMON_RULES = Path("rules").resolve()

# Source Paths to Extract From
SKILL_SOURCES = {
    "Antigravity": Path(".agent/skills"),
    "Copilot": Path(".github/skills"),
    "Claude": Path(".claude/skills"),
    "OpenCode": Path(".opencode/skills"),
    "Codex": Path(".agents/skills")
}

RULE_SOURCES = {
    "Antigravity": Path(".agent/rules"),
    "Copilot": Path(".github/rules"),
    "Claude": Path(".claude/rules")
}

def extract_all():
    """Extract skills and rules from all agent folders to common storage."""

    COMMON_SKILLS.mkdir(exist_ok=True)
    COMMON_RULES.mkdir(exist_ok=True)

    print("🚀 Starting Extraction from all agent folders...")

    # 1. Extract All Skills
    for agent_name, source_path in SKILL_SOURCES.items():
        if source_path.exists() and source_path.is_dir():
            for skill_folder in [d for d in source_path.iterdir() if d.is_dir() and not d.is_symlink()]:
                dest = COMMON_SKILLS / skill_folder.name
                shutil.copytree(skill_folder, dest, dirs_exist_ok=True)
                print(f"✅ Extracted Skill: {skill_folder.name} ({agent_name})")

    # 2. Extract All Rules
    for agent_name, source_path in RULE_SOURCES.items():
        if source_path.exists():
            if source_path.is_dir() and not source_path.is_symlink():
                for rule_file in source_path.glob("*.md"):
                    dest = COMMON_RULES / rule_file.name
                    shutil.copy2(rule_file, dest)
                    print(f"✅ Extracted Rule: {rule_file.name} ({agent_name})")
            elif source_path.is_file() and not source_path.is_symlink():
                dest = COMMON_RULES / source_path.name
                shutil.copy2(source_path, dest)
                print(f"✅ Extracted Rule: {source_path.name} ({agent_name})")

if __name__ == "__main__":
    extract_all()
    print("✨ Extraction complete. Now run sync.py to link them back.")