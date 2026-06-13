#!/usr/bin/env python3
import subprocess
import re
import sys
import os
import time
import signal

INTERVAL = int(os.environ.get("AUTOCOMMIT_INTERVAL", 1800))

def signal_handler(signum, frame):
    print("Stopping Git Auto-Commit Daemon...", flush=True)
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def run_cmd(args):
    res = subprocess.run(args, capture_output=True, text=True)
    return res.stdout

def get_git_status():
    return run_cmd(["git", "status", "--porcelain"]).strip()

def generate_commit_message():
    diff = run_cmd(["git", "diff", "--cached"])
    if not diff:
        return "Auto-commit updates"
    
    current_file = None
    file_diffs = {}
    
    for line in diff.splitlines():
        if line.startswith("diff --git"):
            match = re.search(r'b/(.+)$', line)
            if match:
                current_file = match.group(1)
                file_diffs[current_file] = []
        elif current_file and (line.startswith("+") or line.startswith("-")) and not line.startswith("+++") and not line.startswith("---"):
            file_diffs[current_file].append(line)
            
    file_summaries = []
    scopes = []
    
    for filepath, lines in file_diffs.items():
        filename = os.path.basename(filepath)
        ext = os.path.splitext(filename)[1]
        
        scope = ""
        if "backend" in filepath:
            scope = "backend"
        elif "frontend" in filepath:
            scope = "frontend"
        elif filename == ".gitignore":
            scope = "gitignore"
        elif filename == "run.sh":
            scope = "run-script"
        else:
            scope = filename
            
        scopes.append(scope)
        
        added_methods = []
        added_routes = []
        added_classes = []
        general_changes = 0
        
        for l in lines:
            if l.startswith("+"):
                content = l[1:].strip()
                if ext == ".py":
                    def_match = re.match(r'def\s+(\w+)', content)
                    class_match = re.match(r'class\s+(\w+)', content)
                    route_match = re.search(r'@.*\.route\([\'"]([^\'"]+)', content)
                    if def_match:
                        added_methods.append(def_match.group(1))
                    elif class_match:
                        added_classes.append(class_match.group(1))
                    elif route_match:
                        added_routes.append(route_match.group(1))
                elif ext == ".js":
                    js_match = re.match(r'(\w+)\s*\(.*\)\s*\{', content)
                    js_prop_match = re.match(r'(\w+)\s*:\s*function', content)
                    if js_match and js_match.group(1) not in ("if", "for", "while", "switch", "catch"):
                        added_methods.append(js_match.group(1))
                    elif js_prop_match:
                        added_methods.append(js_prop_match.group(1))
                general_changes += 1
                
        details = []
        if added_classes:
            details.append(f"add class{'es' if len(added_classes)>1 else ''} {', '.join(added_classes)}")
        if added_methods:
            details.append(f"add method{'s' if len(added_methods)>1 else ''} {', '.join(added_methods)}")
        if added_routes:
            details.append(f"add route{'s' if len(added_routes)>1 else ''} {', '.join(added_routes)}")
            
        if details:
            file_summaries.append(f"- {filepath}: {'; '.join(details)}")
        else:
            action = "update" if any(l.startswith("-") for l in lines) else "add"
            file_summaries.append(f"- {filepath}: {action} file contents ({general_changes} additions)")

    unique_scopes = list(set(scopes))
    selected_scope = unique_scopes[0] if len(unique_scopes) == 1 else ""
    
    if selected_scope:
        header = f"Update {selected_scope} files"
    else:
        header = "Auto-commit project changes"
        
    body = "\n".join(file_summaries)
    return f"{header}\n\n{body}"

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("🔄 Git Auto-Commit Daemon started.", flush=True)
    print(f"⏱️  Checking for changes every {INTERVAL} seconds.", flush=True)
    
    while True:
        status = get_git_status()
        if status:
            print("Changes detected. Generating commit message and committing...", flush=True)
            run_cmd(["git", "add", "-A"])
            commit_msg = generate_commit_message()
            res = subprocess.run(["git", "commit", "-m", commit_msg], capture_output=True, text=True)
            if res.returncode == 0:
                print(f"✅ Successfully committed:\n---\n{commit_msg}\n---", flush=True)
            else:
                print(f"❌ Commit failed:\n{res.stderr}", flush=True)
        else:
            pass
            
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
