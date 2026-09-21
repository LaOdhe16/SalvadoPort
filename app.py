from flask import Flask, render_template, abort
from datetime import datetime
from urllib.parse import urlparse
import json

app = Flask(__name__)

# Category → default icon + label used on the detail page.
# A project can override the icon with its own "icon" field in data.json.
CATEGORY_META = {
    "Web": {"icon": "fa-layer-group", "tag": "WEB_APP"},
    "Cybersecurity": {"icon": "fa-shield-halved", "tag": "SECURITY"},
    "Game": {"icon": "fa-gamepad", "tag": "GAME"},
}
DEFAULT_META = {"icon": "fa-folder-open", "tag": "PROJECT"}

# Thumbnail gradients are cycled by project id (see style.css: .tone-1 … .tone-6)
TONE_COUNT = 6

# Where a project's "link" points to decides the button label / icon.
LINK_META = {
    "github.com": {"short": "GitHub", "icon": "fa-brands fa-github",
                   "label": "View on GitHub", "cta": "View source code"},
    "medium.com": {"short": "Medium", "icon": "fa-brands fa-medium",
                   "label": "Read on Medium", "cta": "Read the article"},
    "linkedin.com": {"short": "LinkedIn", "icon": "fa-brands fa-linkedin-in",
                     "label": "View on LinkedIn", "cta": "View the write-up"},
}
DEFAULT_LINK_META = {"short": "Link", "icon": "fa-solid fa-arrow-up-right-from-square",
                     "label": "Open project", "cta": "Open project"}

# Tech-stack bubbles: skill name → Font Awesome icon classes.
SKILL_ICONS = {
    "Python": "fa-brands fa-python",
    "Flask": "fa-solid fa-flask",
    "Linux": "fa-brands fa-linux",
    "Microsoft Azure": "fa-brands fa-microsoft",
    "MySQL": "fa-solid fa-database",
    "Docker": "fa-brands fa-docker",
    "Git": "fa-brands fa-git-alt",
    "Bash Scripting": "fa-solid fa-terminal",
    "JavaScript": "fa-brands fa-js",
    "Tailwind CSS": "fa-solid fa-wind",
    "Pygame": "fa-solid fa-gamepad",
    "Burp Suite": "fa-solid fa-bug",
    "Nmap": "fa-solid fa-satellite-dish",
    "Wireshark": "fa-solid fa-wave-square",
    "YARA Rules": "fa-solid fa-magnifying-glass",
    "JADX": "fa-solid fa-code",
    "ADB": "fa-brands fa-android",
    "Genymotion": "fa-solid fa-mobile-screen",
    "VirusTotal API": "fa-solid fa-virus-slash",
}
DEFAULT_SKILL_ICON = "fa-solid fa-code"


def load_data():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def tone_for(project_id):
    return (int(project_id) - 1) % TONE_COUNT + 1


def link_meta(url):
    host = (urlparse(url or "").hostname or "").lower()
    for domain, meta in LINK_META.items():
        if host == domain or host.endswith("." + domain):
            return meta
    return DEFAULT_LINK_META


def enrich(project):
    """Copy of a project dict with the fields the templates need."""
    meta = CATEGORY_META.get(project.get("category"), DEFAULT_META)
    link = project.get("link") or project.get("github_link") or ""
    return {
        **project,
        "link": link,
        "link_meta": link_meta(link),
        "icon": project.get("icon") or meta["icon"],
        "tag": meta["tag"],
        "tone": tone_for(project["id"]),
    }


@app.context_processor
def inject_data():
    data = load_data()
    return dict(profile=data.get('profile', {}), current_year=datetime.now().year)


@app.route('/')
def home():
    data = load_data()

    # Newest year first; projects with the same year keep their order in data.json.
    projects = sorted(
        (enrich(p) for p in data.get('projects', [])),
        key=lambda p: p.get('year', ''),
        reverse=True,
    )

    skills = [{"name": s, "icon": SKILL_ICONS.get(s, DEFAULT_SKILL_ICON)}
              for s in data.get('skills', [])]

    # Only certificates flagged "featured": true are shown on the page;
    # the rest live in the Google Drive folder behind the "View all" button.
    certificates = [c for c in data.get('certificates', []) if c.get('featured')]

    return render_template(
        'home.html',
        projects=projects,
        services=data.get('services', []),
        experience=data.get('experience', []),
        education=data.get('education', []),
        skills=skills,
        certificates=certificates,
    )


@app.route('/project/<int:id>')
def project_detail(id):
    data = load_data()
    raw = data.get('projects', [])
    project = next((p for p in raw if p['id'] == id), None)
    if not project:
        abort(404)

    # "What's next" navigation follows the order in data.json.
    ids = [p['id'] for p in raw]
    idx = ids.index(id)
    next_project = raw[(idx + 1) % len(raw)] if len(raw) > 1 else None

    return render_template(
        'project_detail.html',
        project=enrich(project),
        next_project=next_project,
    )


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True, port=5001)
